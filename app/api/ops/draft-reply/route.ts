// Draft reply actions — send or skip a draft reply from the ops dashboard.
// POST body: { prospect_id, action: "send" | "skip", edited_text? }
//
// "send" flow:
//   1. Find the outreach_replies record for this prospect (if exists)
//   2. Send via /api/replies/send (goes through Instantly)
//   3. Update prospect_pipeline: stage → responded, draft_status → approved
//
// "skip" flow:
//   1. Update prospect_pipeline: draft_status → skipped, stage → responded

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;
  const body = await req.json();
  const { prospect_id, action, edited_text } = body as {
    prospect_id: string;
    action: "send" | "skip";
    edited_text?: string;
  };

  if (!prospect_id || !action) {
    return NextResponse.json({ error: "prospect_id and action required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  if (action === "skip") {
    await supabase
      .from("prospect_pipeline")
      .update({
        draft_status: "skipped",
        stage: "responded",
        stage_entered_at: now,
        responded_at: now,
      })
      .eq("id", prospect_id);

    return NextResponse.json({ success: true, action: "skipped" });
  }

  // action === "send"
  // Block sending if reply contains placeholder links
  const replyPreview = edited_text || "";
  const placeholderPattern = /\[(CALENDAR_LINK|PREVIEW_LINK|LOOM_LINK|ANSWER_PLACEHOLDER|HANNAH)/;
  if (placeholderPattern.test(replyPreview)) {
    return NextResponse.json(
      { error: "Reply contains placeholder text (e.g. [CALENDAR_LINK]). Edit the draft before sending." },
      { status: 400 }
    );
  }

  // Find the prospect
  const { data: prospect } = await supabase
    .from("prospect_pipeline")
    .select("id, owner_email, business_name, draft_response, reply_text, outreach_method")
    .eq("id", prospect_id)
    .single();

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const replyText = edited_text || prospect.draft_response || "";

  // Final placeholder check (catches DB-sourced draft too)
  if (placeholderPattern.test(replyText)) {
    return NextResponse.json(
      { error: "Reply contains placeholder text (e.g. [CALENDAR_LINK]). Edit the draft before sending." },
      { status: 400 }
    );
  }

  // Try to find and send via outreach_replies (goes through Instantly)
  if (prospect.owner_email) {
    const { data: replyRecord } = await supabase
      .from("outreach_replies")
      .select("id, status")
      .eq("prospect_email", prospect.owner_email)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (replyRecord) {
      // Send via the replies API (handles Instantly sending)
      const sendRes = await fetch(new URL("/api/replies/send", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyId: replyRecord.id,
          editedText: replyText,
        }),
      });

      if (!sendRes.ok) {
        const err = await sendRes.json();
        return NextResponse.json({ error: `Reply send failed: ${err.error}` }, { status: 500 });
      }
    }
  }

  // Update pipeline record
  await supabase
    .from("prospect_pipeline")
    .update({
      draft_status: "approved",
      draft_response: replyText,
      stage: "responded",
      stage_entered_at: now,
      responded_at: now,
    })
    .eq("id", prospect_id);

  return NextResponse.json({ success: true, action: "sent" });
}
