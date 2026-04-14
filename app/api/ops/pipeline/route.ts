// Pipeline API — returns weekly batch data with stage counts and gate status.
// GET: used by /ops dashboard. POST: creates a new batch.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PipelineStage, GateStatus, ProspectBatch, PipelineResponse } from "@/lib/ops-pipeline";
import { PIPELINE_STAGES } from "@/lib/ops-pipeline";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function GET() {
  // Auth handled by /ops layout (client-side admin email check).
  // Cookie-based auth fails in API routes when session isn't synced.

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch batches, pipeline entries, and gates in parallel
  // Step 1: Get active batches first (need IDs to filter pipeline query)
  const batchesResult = await supabase
    .from("prospect_batches")
    .select("*")
    .in("status", ["active", "completed"])
    .order("week_start", { ascending: false })
    .limit(12);

  const batchIds = (batchesResult.data || []).map((b) => b.id);

  // Step 2: Fetch pipeline + gates only for active batches
  const [pipelineResult, gatesResult] = await Promise.all([
    batchIds.length > 0
      ? supabase
          .from("prospect_pipeline")
          .select("batch_id, stage")
          .in("batch_id", batchIds)
      : Promise.resolve({ data: [], error: null }),
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

  // Auto-create gates when leads reach gate stages but no pending gate exists
  const GATE_TRIGGERS: { stage: string; gate_type: string }[] = [
    { stage: "site_built", gate_type: "site_review" },
    { stage: "site_approved", gate_type: "outreach_approval" },
    { stage: "replied", gate_type: "draft_approval" },
  ];

  for (const b of batchesResult.data || []) {
    const stageCounts = batchStageCounts.get(b.id);
    if (!stageCounts) continue;

    const existingGates = batchGates.get(b.id) || [];

    for (const { stage, gate_type } of GATE_TRIGGERS) {
      const count = stageCounts[stage as PipelineStage] || 0;
      if (count === 0) continue;

      // Check if a pending gate already exists for this type
      const hasGate = existingGates.some(g => g.gate_type === gate_type && g.status === "pending");
      if (hasGate) continue;

      // Create the gate
      const { data: newGate } = await supabase
        .from("pipeline_gates")
        .insert({
          batch_id: b.id,
          gate_type,
          items_pending: count,
          items_approved: 0,
          items_rejected: 0,
          status: "pending",
        })
        .select("*")
        .single();

      if (newGate) {
        if (!batchGates.has(b.id)) batchGates.set(b.id, []);
        batchGates.get(b.id)!.push({
          id: newGate.id,
          gate_type: newGate.gate_type,
          items_pending: newGate.items_pending,
          items_approved: 0,
          items_rejected: 0,
          status: "pending",
        });
      }
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

// ── POST: Create a new batch ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const cityTargets: string[] = body.city_targets || [];

    if (cityTargets.length === 0) {
      return NextResponse.json({ error: "city_targets required" }, { status: 400 });
    }

    // Calculate current ISO week
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNumber = Math.ceil((days + jan1.getDay() + 1) / 7);
    const weekYear = now.getFullYear();

    // Week start (Monday) and end (Sunday)
    const dayOfWeek = now.getDay() || 7; // Sunday = 7
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { data: batch, error } = await supabase
      .from("prospect_batches")
      .insert({
        week_number: weekNumber,
        week_year: weekYear,
        week_start: weekStart.toISOString().slice(0, 10),
        week_end: weekEnd.toISOString().slice(0, 10),
        city_targets: cityTargets,
        lead_count: 0,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      // Unique constraint on week_number + week_year — append a suffix
      if (error.code === "23505") {
        return NextResponse.json({ error: "A batch already exists for this week. Use the existing one or wait until next week." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    console.error("Create batch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
