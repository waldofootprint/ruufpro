// POST /api/replies/inbound
// Webhook receiver for incoming replies from all channels.
// Instantly fires here when a prospect replies to a cold email.
// Categorizes, drafts a reply, stores in Supabase, pushes to Slack.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize inbound data — supports Instantly webhook format
    // Instantly sends: { event_type, data: { from_email, from_name, subject, text, ... } }
    const payload = body.data || body;

    const prospectName = payload.from_name || payload.prospect_name || "Unknown";
    const prospectEmail = payload.from_email || payload.prospect_email || payload.email;
    const prospectCompany = payload.company || payload.prospect_company || "";
    const prospectCity = payload.city || payload.prospect_city || "";
    const prospectState = payload.state || payload.prospect_state || "";
    const inboundText = payload.text || payload.body || payload.message || "";
    const originalOutreach = payload.original_text || payload.original_outreach || "";
    const originalSubject = payload.subject || "";
    const channel = payload.channel || "instantly";
    const instantlyCampaignId = payload.campaign_id || "";
    const instantlyReplyId = payload.id || payload.reply_id || "";

    if (!inboundText) {
      return NextResponse.json({ error: "No reply text provided" }, { status: 400 });
    }

    // Step 1: AI categorize + draft
    const { categorizeReply, generateDraftReply } = await import("@/lib/reply-ai");

    const result = generateDraftReply({
      prospectName,
      prospectCompany,
      prospectCity,
      inboundText,
      originalOutreach,
      channel,
    });

    // Step 2: Store in Supabase
    const { data: reply, error: dbError } = await supabase
      .from("outreach_replies")
      .insert({
        prospect_name: prospectName,
        prospect_email: prospectEmail,
        prospect_company: prospectCompany,
        prospect_city: prospectCity,
        prospect_state: prospectState,
        channel,
        category: result.category,
        confidence: result.confidence,
        inbound_text: inboundText,
        original_outreach: originalOutreach,
        original_subject: originalSubject,
        draft_reply: result.draftReply,
        status: "draft",
        instantly_campaign_id: instantlyCampaignId,
        instantly_reply_id: instantlyReplyId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error storing reply:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Step 3: Push to Slack
    const { postReplyNotification } = await import("@/lib/slack-replies");

    const slackResult = await postReplyNotification({
      id: reply.id,
      prospectName,
      prospectCompany,
      prospectCity,
      prospectState,
      channel,
      category: result.category,
      confidence: result.confidence,
      inboundText,
      originalOutreach,
      draftReply: result.draftReply,
    });

    // Step 4: Store Slack message ID for later updates
    if (slackResult.success && slackResult.messageTs) {
      await supabase
        .from("outreach_replies")
        .update({
          slack_message_ts: slackResult.messageTs,
          slack_channel_id: process.env.SLACK_REPLY_CHANNEL,
          status: "draft",
        })
        .eq("id", reply.id);
    }

    // Step 5: Auto-process unsubscribes
    if (result.category === "unsubscribe" && prospectEmail) {
      const { addToSuppressionList } = await import("@/lib/instantly");
      await addToSuppressionList(prospectEmail);
    }

    return NextResponse.json({
      success: true,
      replyId: reply.id,
      category: result.category,
      confidence: result.confidence,
      slackSent: slackResult.success,
    });
  } catch (error) {
    console.error("Reply inbound error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
