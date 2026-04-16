// Advance selected prospects to the next pipeline stage.
// Auth is handled by the /ops layout (admin email check).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

// Stage progression map — which stage comes next
const NEXT_STAGE: Record<string, string> = {
  // v4 flow (demo page pipeline)
  scraped: "google_enriched",
  google_enriched: "awaiting_triage",
  awaiting_triage: "demo_built",
  demo_built: "demo_approved",
  demo_approved: "contact_lookup",
  contact_lookup: "contact_ready",
  contact_ready: "outreach_approved",
  outreach_approved: "sent",
  // Legacy (existing batches that used old enrichment flow)
  enriched: "demo_built",
  site_built: "demo_approved",
  site_approved: "contact_lookup",
};

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

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

    const updateData: Record<string, unknown> = {
      stage: nextStage,
      stage_entered_at: now,
    };

    // Set the appropriate timestamp
    if (nextStage === "google_enriched") updateData.google_enriched_at = now;
    else if (nextStage === "demo_built") updateData.demo_page_built_at = now;
    else if (nextStage === "demo_approved") updateData.demo_page_approved_at = now;
    else if (nextStage === "contact_lookup") updateData.contact_lookup_at = now;
    else if (nextStage === "contact_ready") updateData.contact_ready_at = now;
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
