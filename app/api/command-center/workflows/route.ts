import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

// GET — fetch all workflow statuses + step statuses
// Called when Mission Control loads to hydrate the Workflows tab
export async function GET() {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [workflowsRes, stepsRes] = await Promise.all([
    supabase.from("workflow_status").select("*").order("priority", { ascending: true }),
    supabase.from("workflow_step_status").select("*").order("workflow_id").order("sort_order", { ascending: true }),
  ]);

  if (workflowsRes.error) return NextResponse.json({ error: workflowsRes.error.message }, { status: 500 });
  if (stepsRes.error) return NextResponse.json({ error: stepsRes.error.message }, { status: 500 });

  return NextResponse.json({ workflows: workflowsRes.data, steps: stepsRes.data });
}

// PATCH — update a workflow step's status
// Actions: approve_to_build, start_building, submit_for_review, approve, send_back, skip
export async function PATCH(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId, action, reviewNotes, contextNotes, buildSummary } = await req.json();
  if (!stepId || !action) return NextResponse.json({ error: "Missing stepId or action" }, { status: 400 });

  // First, get the current step so we know which workflow it belongs to
  const { data: step, error: stepErr } = await supabase
    .from("workflow_step_status")
    .select("*")
    .eq("id", stepId)
    .single();

  if (stepErr || !step) return NextResponse.json({ error: "Step not found" }, { status: 404 });

  // Build the update based on the action
  let stepUpdate: Record<string, unknown> = {};
  let workflowUpdate: Record<string, unknown> = {};

  switch (action) {
    case "approve_to_build":
      // Hannah approves — Claude can start building this step
      stepUpdate = { status: "approved_to_build" };
      workflowUpdate = { status: "in_progress", current_step: step.sort_order };
      break;

    case "start_building":
      // Claude picks up the step and starts working
      stepUpdate = { status: "building", started_at: new Date().toISOString() };
      if (contextNotes) stepUpdate.context_notes = contextNotes;
      workflowUpdate = { status: "in_progress" };
      break;

    case "submit_for_review":
      // Claude finished building, sends back to Hannah for review
      stepUpdate = { status: "review" };
      if (buildSummary) stepUpdate.build_summary = buildSummary;
      if (contextNotes) stepUpdate.context_notes = contextNotes;
      workflowUpdate = { status: "awaiting_review" };
      break;

    case "approve":
      // Hannah approves the completed work — step is done
      stepUpdate = { status: "approved", completed_at: new Date().toISOString() };
      break;

    case "send_back":
      // Hannah sends back with required notes
      if (!reviewNotes) return NextResponse.json({ error: "Review notes required when sending back" }, { status: 400 });
      stepUpdate = { status: "revision", review_notes: reviewNotes };
      workflowUpdate = { status: "in_progress" };
      break;

    case "skip":
      // Skip this step entirely
      stepUpdate = { status: "skipped", completed_at: new Date().toISOString() };
      break;

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Update the step
  const { data: updatedStep, error: updateErr } = await supabase
    .from("workflow_step_status")
    .update(stepUpdate)
    .eq("id", stepId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Update the workflow status if needed
  if (Object.keys(workflowUpdate).length > 0) {
    await supabase
      .from("workflow_status")
      .update(workflowUpdate)
      .eq("workflow_id", step.workflow_id);
  }

  // After approving or skipping, check if all steps are done → mark workflow complete
  if (action === "approve" || action === "skip") {
    const { data: allSteps } = await supabase
      .from("workflow_step_status")
      .select("status")
      .eq("workflow_id", step.workflow_id);

    if (allSteps) {
      const allDone = allSteps.every((s) => s.status === "approved" || s.status === "skipped");
      if (allDone) {
        await supabase
          .from("workflow_status")
          .update({ status: "complete" })
          .eq("workflow_id", step.workflow_id);
      } else {
        // Advance current_step to the next pending step
        const { data: nextSteps } = await supabase
          .from("workflow_step_status")
          .select("sort_order")
          .eq("workflow_id", step.workflow_id)
          .eq("status", "pending")
          .order("sort_order", { ascending: true })
          .limit(1);

        if (nextSteps && nextSteps.length > 0) {
          await supabase
            .from("workflow_status")
            .update({ current_step: nextSteps[0].sort_order, status: "in_progress" })
            .eq("workflow_id", step.workflow_id);
        }
      }
    }
  }

  return NextResponse.json(updatedStep);
}
