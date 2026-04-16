// Batch form submission — fires staggered Inngest events to submit contact forms.
// POST body: { batch_id?: string, prospect_ids?: string[] }
// Staggered: 1 event per prospect, with 30s delays between each via Inngest step.sleep.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;
  const body = await req.json();
  const { batch_id, prospect_ids } = body as {
    batch_id?: string;
    prospect_ids?: string[];
  };

  if (!batch_id && !prospect_ids?.length) {
    return NextResponse.json({ error: "Provide batch_id or prospect_ids" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find qualifying prospects: outreach_approved, has form, no captcha, pending
  let query = supabase
    .from("prospect_pipeline")
    .select("id, has_captcha, contact_form_url")
    .eq("stage", "outreach_approved")
    .not("contact_form_url", "is", null)
    .eq("has_captcha", false)
    .eq("form_submission_status", "pending");

  if (batch_id) {
    query = query.eq("batch_id", batch_id);
  } else if (prospect_ids?.length) {
    query = query.in("id", prospect_ids);
  }

  const { data: prospects, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count skipped prospects
  let skippedCaptcha = 0;
  let skippedNoForm = 0;

  if (batch_id) {
    const { count: captchaCount } = await supabase
      .from("prospect_pipeline")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batch_id)
      .eq("stage", "outreach_approved")
      .eq("has_captcha", true);

    const { count: noFormCount } = await supabase
      .from("prospect_pipeline")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batch_id)
      .eq("stage", "outreach_approved")
      .is("contact_form_url", null);

    skippedCaptcha = captchaCount || 0;
    skippedNoForm = noFormCount || 0;
  }

  if (!prospects?.length) {
    return NextResponse.json({
      queued: 0,
      skipped_captcha: skippedCaptcha,
      skipped_no_form: skippedNoForm,
      message: "No prospects qualify for form submission",
    });
  }

  // Fire staggered Inngest events — each gets a delay via ts (Unix ms).
  // The prospectFormSubmit function handles its own execution;
  // staggering prevents Browserless burst.
  const events = prospects.map((p, i) => ({
    name: "ops/form.submit" as const,
    data: { prospectId: p.id },
    // Inngest ts = Unix timestamp in ms for delayed delivery
    ...(i > 0 ? { ts: Date.now() + i * 30000 } : {}),
  }));

  await inngest.send(events);

  return NextResponse.json({
    queued: prospects.length,
    skipped_captcha: skippedCaptcha,
    skipped_no_form: skippedNoForm,
    stagger_seconds: 30,
    estimated_completion_minutes: Math.ceil((prospects.length * 30) / 60),
  });
}
