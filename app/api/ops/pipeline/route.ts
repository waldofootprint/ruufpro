// Pipeline API — returns weekly batch data with stage counts and gate status.
// Used by the /ops dashboard to render the batch pipeline view.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import type { PipelineStage, GateStatus, ProspectBatch, PipelineResponse } from "@/lib/ops-pipeline";
import { PIPELINE_STAGES } from "@/lib/ops-pipeline";

export async function GET() {
  // Auth check
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch batches, pipeline entries, and gates in parallel
  const [batchesResult, pipelineResult, gatesResult] = await Promise.all([
    supabase
      .from("prospect_batches")
      .select("*")
      .in("status", ["active", "completed"])
      .order("week_start", { ascending: false })
      .limit(12),
    supabase
      .from("prospect_pipeline")
      .select("batch_id, stage"),
    supabase
      .from("pipeline_gates")
      .select("*")
      .eq("status", "pending"),
  ]);

  // Build stage counts per batch
  const batchStageCounts = new Map<string, Record<PipelineStage, number>>();
  const totalCounts: Record<string, number> = {};
  PIPELINE_STAGES.forEach((s) => (totalCounts[s] = 0));

  if (pipelineResult.data) {
    for (const row of pipelineResult.data) {
      const batchId = row.batch_id || "__none__";
      if (!batchStageCounts.has(batchId)) {
        const counts: Record<string, number> = {};
        PIPELINE_STAGES.forEach((s) => (counts[s] = 0));
        batchStageCounts.set(batchId, counts as Record<PipelineStage, number>);
      }
      const counts = batchStageCounts.get(batchId)!;
      if (row.stage in counts) {
        counts[row.stage as PipelineStage]++;
        totalCounts[row.stage]++;
      }
    }
  }

  // Build gate status map
  const batchGates = new Map<string, GateStatus[]>();
  if (gatesResult.data) {
    for (const gate of gatesResult.data) {
      const batchId = gate.batch_id;
      if (!batchGates.has(batchId)) batchGates.set(batchId, []);
      batchGates.get(batchId)!.push({
        id: gate.id,
        gate_type: gate.gate_type,
        items_pending: gate.items_pending,
        items_approved: gate.items_approved,
        items_rejected: gate.items_rejected,
        status: gate.status,
      });
    }
  }

  // Assemble batch objects
  const batches: ProspectBatch[] = (batchesResult.data || []).map((b) => {
    const stageCounts = batchStageCounts.get(b.id) ||
      (Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0])) as Record<PipelineStage, number>);

    // Progress = % of leads that have reached "sent" or beyond
    const totalLeads = b.lead_count || Object.values(stageCounts).reduce((a, c) => a + c, 0);
    const sentIndex = PIPELINE_STAGES.indexOf("sent");
    const pastSent = PIPELINE_STAGES.slice(sentIndex).reduce((sum, s) => sum + (stageCounts[s] || 0), 0);
    const progress = totalLeads > 0 ? Math.round((pastSent / totalLeads) * 100) : 0;

    return {
      id: b.id,
      week_number: b.week_number,
      week_year: b.week_year,
      week_start: b.week_start,
      week_end: b.week_end,
      city_targets: b.city_targets || [],
      lead_count: totalLeads,
      status: b.status,
      created_at: b.created_at,
      stage_counts: stageCounts,
      gates: batchGates.get(b.id) || [],
      progress,
    };
  });

  // Collect all pending gates across batches
  const pendingGates: GateStatus[] = gatesResult.data || [];

  const response: PipelineResponse = {
    batches,
    totals: totalCounts as Record<PipelineStage, number>,
    pending_gates: pendingGates,
  };

  return NextResponse.json(response);
}
