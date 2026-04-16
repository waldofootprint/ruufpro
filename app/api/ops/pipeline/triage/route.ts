import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TriageDecision {
  id: string;
  decision: "selected" | "parked" | "skipped";
  parked_until?: string;
  parked_reason?: string;
}

// ── POST /api/ops/pipeline/triage ──────────────────────────────────
// Body: { decisions: TriageDecision[] }
// Processes triage decisions: selected → site_built, parked → parked, skipped → removed
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { decisions } = (await req.json()) as { decisions: TriageDecision[] };

    if (!decisions?.length) {
      return NextResponse.json({ error: "decisions array required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    let selected = 0;
    let parked = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const d of decisions) {
      if (d.decision === "selected") {
        const { error } = await supabase
          .from("prospect_pipeline")
          .update({
            stage: "demo_built",
            stage_entered_at: now,
            triage_decision: "selected",
            triage_decided_at: now,
          })
          .eq("id", d.id)
          .eq("stage", "awaiting_triage");

        if (error) errors.push(`${d.id}: ${error.message}`);
        else selected++;
      } else if (d.decision === "parked") {
        const { error } = await supabase
          .from("prospect_pipeline")
          .update({
            stage: "parked",
            stage_entered_at: now,
            triage_decision: "parked",
            triage_decided_at: now,
            parked_until: d.parked_until || null,
            parked_reason: d.parked_reason || null,
          })
          .eq("id", d.id)
          .eq("stage", "awaiting_triage");

        if (error) errors.push(`${d.id}: ${error.message}`);
        else parked++;
      } else if (d.decision === "skipped") {
        // Skipped stays at awaiting_triage with triage_decision = "skipped"
        // Won't show in triage panel (filtered out), but stays in pipeline for records
        const { error } = await supabase
          .from("prospect_pipeline")
          .update({
            triage_decision: "skipped",
            triage_decided_at: now,
          })
          .eq("id", d.id)
          .eq("stage", "awaiting_triage");

        if (error) errors.push(`${d.id}: ${error.message}`);
        else skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      selected,
      parked,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Triage error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
