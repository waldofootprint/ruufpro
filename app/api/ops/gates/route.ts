// Gate Actions API — approve/reject items at pipeline approval gates.
// POST: batch approve sites, approve outreach, etc.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GATE_APPROVED_STAGE } from "@/lib/ops-pipeline";
import type { GateActionRequest } from "@/lib/ops-pipeline";
import { requireOpsAuth } from "@/lib/ops-auth";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;
  const body: GateActionRequest = await req.json();
  const { gate_type, batch_id, action, prospect_ids } = body;

  if (!gate_type || !batch_id || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Support both v3 gates and legacy gates still in DB
  const approvedStageMap: Record<string, string> = {
    site_review: "site_approved",
    draft_approval: "responded",
    triage_review: "site_built",
    outreach_approval: "outreach_approved",
  };
  const nextStage = approvedStageMap[gate_type];
  if (!nextStage) {
    return NextResponse.json({ error: "Invalid gate type" }, { status: 400 });
  }

  // Determine which stage leads are currently in (the gate trigger stage)
  const currentStageMap: Record<string, string> = {
    site_review: "site_built",
    draft_approval: "replied",
    // Legacy gates — still process if they exist in DB
    triage_review: "awaiting_triage",
    outreach_approval: "contact_ready",
  };
  const currentStage = currentStageMap[gate_type];
  if (!currentStage) {
    return NextResponse.json({ error: "Invalid gate type" }, { status: 400 });
  }

  if (action === "approve_all") {
    // Move all leads at the gate stage to the next stage
    const { data, error } = await supabase
      .from("prospect_pipeline")
      .update({
        stage: nextStage,
        stage_entered_at: new Date().toISOString(),
        ...(gate_type === "site_review" ? { site_approved_at: new Date().toISOString() } : {}),
      })
      .eq("batch_id", batch_id)
      .eq("stage", currentStage)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update the gate record
    await supabase
      .from("pipeline_gates")
      .update({
        status: "approved",
        items_approved: data?.length || 0,
        items_pending: 0,
        closed_at: new Date().toISOString(),
      })
      .eq("batch_id", batch_id)
      .eq("gate_type", gate_type)
      .eq("status", "pending");

    // Gate 1 approved → fire auto-send via Instantly
    if (gate_type === "site_review" && data?.length) {
      await inngest.send({
        name: "ops/outreach.auto-send",
        data: {
          batchId: batch_id,
          prospectIds: data.map((p: { id: string }) => p.id),
        },
      });
    }

    return NextResponse.json({ approved: data?.length || 0, auto_send_triggered: gate_type === "site_review" });

  } else if (action === "approve_selected" && prospect_ids?.length) {
    // Move only selected leads
    const { data, error } = await supabase
      .from("prospect_pipeline")
      .update({
        stage: nextStage,
        stage_entered_at: new Date().toISOString(),
        ...(gate_type === "site_review" ? { site_approved_at: new Date().toISOString() } : {}),
      })
      .in("id", prospect_ids)
      .eq("batch_id", batch_id)
      .eq("stage", currentStage)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update gate — partial if some remain
    const { count: remaining } = await supabase
      .from("prospect_pipeline")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batch_id)
      .eq("stage", currentStage);

    await supabase
      .from("pipeline_gates")
      .update({
        status: (remaining || 0) > 0 ? "partial" : "approved",
        items_approved: data?.length || 0,
        items_pending: remaining || 0,
        ...(remaining === 0 ? { closed_at: new Date().toISOString() } : {}),
      })
      .eq("batch_id", batch_id)
      .eq("gate_type", gate_type)
      .eq("status", "pending");

    // Gate 1 approved → fire auto-send for selected prospects
    if (gate_type === "site_review" && data?.length) {
      await inngest.send({
        name: "ops/outreach.auto-send",
        data: {
          batchId: batch_id,
          prospectIds: data.map((p: { id: string }) => p.id),
        },
      });
    }

    return NextResponse.json({ approved: data?.length || 0, remaining: remaining || 0, auto_send_triggered: gate_type === "site_review" });

  } else if (action === "reject_selected" && prospect_ids?.length) {
    // Mark rejected leads as unsubscribed (remove from pipeline)
    const { data, error } = await supabase
      .from("prospect_pipeline")
      .update({
        stage: "unsubscribed",
        stage_entered_at: new Date().toISOString(),
      })
      .in("id", prospect_ids)
      .eq("batch_id", batch_id)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rejected: data?.length || 0 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
