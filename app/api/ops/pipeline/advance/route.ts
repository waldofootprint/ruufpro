// Advance selected prospects to the next pipeline stage.
// Auth is handled by the /ops layout (admin email check).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PIPELINE_STAGES } from "@/lib/ops-pipeline";

// Stage progression map — which stage comes next
const NEXT_STAGE: Record<string, string> = {
  scraped: "site_built",
  enriched: "site_built",
  site_built: "site_approved",
  site_approved: "outreach_approved",
  outreach_approved: "sent",
};

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { prospect_ids } = await req.json();
  if (!prospect_ids || !Array.isArray(prospect_ids) || prospect_ids.length === 0) {
    return NextResponse.json({ error: "prospect_ids required" }, { status: 400 });
  }

  // Fetch current stages
  const { data: prospects, error: fetchErr } = await supabase
    .from("prospect_pipeline")
    .select("id, stage")
    .in("id", prospect_ids);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  let advanced = 0;
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (const prospect of (prospects || [])) {
    const nextStage = NEXT_STAGE[prospect.stage];
    if (!nextStage) {
      errors.push(`${prospect.id}: no next stage from "${prospect.stage}"`);
      continue;
    }

    // Build timestamp field name for the new stage
    const timestampField = `${nextStage.replace("site_", "site_")}_at`;
    const updateData: Record<string, unknown> = {
      stage: nextStage,
      stage_entered_at: now,
    };

    // Set the appropriate timestamp
    if (nextStage === "site_built") updateData.site_built_at = now;
    else if (nextStage === "site_approved") updateData.site_approved_at = now;
    else if (nextStage === "outreach_approved") updateData.outreach_approved_at = now;
    else if (nextStage === "sent") updateData.sent_at = now;

    const { error: updateErr } = await supabase
      .from("prospect_pipeline")
      .update(updateData)
      .eq("id", prospect.id);

    if (updateErr) {
      errors.push(`${prospect.id}: ${updateErr.message}`);
    } else {
      advanced++;
    }
  }

  return NextResponse.json({ advanced, errors, total: prospect_ids.length });
}
