// POST /api/replies/form-inbound
// Webhook receiver for replies to contact form outreach.
// Resend inbound webhook fires here when a roofer replies to forms@getruufpro.com.
// Matches sender to prospect, categorizes, drafts reply, stores, pushes to Slack.
//
// Resend inbound webhook payload:
// https://resend.com/docs/dashboard/webhooks/introduction
// {
//   "from": "john@roofingcompany.com",
//   "to": "forms@getruufpro.com",
//   "subject": "Re: Free website...",
//   "text": "...",
//   "html": "...",
//   "headers": { ... }
// }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Resend inbound webhook format
    const senderEmail = body.from || body.sender || "";
    const replyText = body.text || body.html?.replace(/<[^>]*>/g, " ").trim() || "";
    const subject = body.subject || "";

    if (!replyText) {
      return NextResponse.json({ error: "No reply text" }, { status: 400 });
    }

    // Match sender to prospect — try email match first, then domain match
    let prospect = null;

    // Try exact email match on owner_email
    if (senderEmail) {
      const { data } = await supabase
        .from("prospect_pipeline")
        .select("id, contractor_id, outreach_method, their_website_url, contractors(business_name, city, state)")
        .eq("owner_email", senderEmail)
        .eq("outreach_method", "form")
        .limit(1)
        .single();

      if (data) prospect = data;
    }

    // Fall back to domain matching — extract domain from sender, match against their_website_url
    if (!prospect && senderEmail) {
      const senderDomain = senderEmail.split("@")[1];
      if (senderDomain) {
        const { data } = await supabase
          .from("prospect_pipeline")
          .select("id, contractor_id, outreach_method, their_website_url, contractors(business_name, city, state)")
          .eq("outreach_method", "form")
          .ilike("their_website_url", `%${senderDomain}%`)
          .limit(1)
          .single();

        if (data) prospect = data;
      }
    }

    const prospectName = senderEmail.split("@")[0] || "Unknown";
    const prospectCompany = (prospect?.contractors as any)?.business_name || "";
    const prospectCity = (prospect?.contractors as any)?.city || "";
    const prospectState = (prospect?.contractors as any)?.state || "";

    // Step 1: AI categorize + draft
    const { generateDraftReply } = await import("@/lib/reply-ai");

    const result = generateDraftReply({
      prospectName,
      prospectCompany,
      prospectCity,
      inboundText: replyText,
      originalOutreach: "Contact form submission: free website offer with claim link",
      channel: "form",
    });

    // Step 2: Store in Supabase
    const { data: reply, error: dbError } = await supabase
      .from("outreach_replies")
      .insert({
        prospect_name: prospectName,
        prospect_email: senderEmail,
        prospect_company: prospectCompany,
        prospect_city: prospectCity,
        prospect_state: prospectState,
        channel: "form",
        category: result.category,
        confidence: result.confidence,
        inbound_text: replyText,
        original_outreach: "Contact form submission: free website offer with claim link",
        original_subject: subject,
        draft_reply: result.draftReply,
        status: "draft",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error storing form reply:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Step 3: Update prospect pipeline if matched
    if (prospect) {
      await supabase
        .from("prospect_pipeline")
        .update({
          stage: "replied",
          stage_entered_at: new Date().toISOString(),
          replied_at: new Date().toISOString(),
          reply_text: replyText,
          reply_category: result.category,
          draft_response: result.draftReply,
          draft_status: "pending",
        })
        .eq("id", prospect.id);
    }

    // Step 4: Push to Slack
    const { postReplyNotification } = await import("@/lib/slack-replies");

    const slackResult = await postReplyNotification({
      id: reply.id,
      prospectName,
      prospectCompany,
      prospectCity,
      prospectState,
      channel: "form",
      category: result.category,
      confidence: result.confidence,
      inboundText: replyText,
      originalOutreach: "Contact form submission: free website offer with claim link",
      draftReply: result.draftReply,
    });

    // Step 5: Store Slack message ID
    if (slackResult.success && slackResult.messageTs) {
      await supabase
        .from("outreach_replies")
        .update({
          slack_message_ts: slackResult.messageTs,
          slack_channel_id: process.env.SLACK_REPLY_CHANNEL,
        })
        .eq("id", reply.id);
    }

    return NextResponse.json({
      success: true,
      replyId: reply.id,
      category: result.category,
      matched_prospect: !!prospect,
      prospect_id: prospect?.id || null,
    });
  } catch (error) {
    console.error("Form reply inbound error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
