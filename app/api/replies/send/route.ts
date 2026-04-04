// POST /api/replies/send
// Standalone endpoint to send a reply manually (outside of Slack flow).
// Also handles sending edited replies from the Slack thread.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { replyId, editedText } = await req.json();

    if (!replyId) {
      return NextResponse.json({ error: "replyId required" }, { status: 400 });
    }

    // Fetch the reply record
    const { data: reply, error: fetchError } = await supabase
      .from("outreach_replies")
      .select("*")
      .eq("id", replyId)
      .single();

    if (fetchError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    if (reply.status === "sent") {
      return NextResponse.json({ error: "Already sent" }, { status: 400 });
    }

    const textToSend = editedText || reply.draft_reply;

    // Send via the appropriate channel
    if (reply.channel === "instantly") {
      const { sendReply } = await import("@/lib/instantly");

      const result = await sendReply({
        from_email: process.env.OUTREACH_FROM_EMAIL || "hannah@ruufpro.com",
        to_email: reply.prospect_email,
        subject: reply.original_subject
          ? `Re: ${reply.original_subject}`
          : `Re: Hey, ${reply.prospect_name.split(" ")[0]}`,
        body: textToSend,
        reply_to_message_id: reply.instantly_reply_id,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: `Send failed: ${result.error}` },
          { status: 500 }
        );
      }
    }
    // LinkedIn and Facebook: log for manual sending
    else {
      console.log(
        `[${reply.channel}] Manual send needed for ${reply.prospect_name}: ${textToSend}`
      );
    }

    // Update database
    await supabase
      .from("outreach_replies")
      .update({
        status: "sent",
        final_reply: textToSend,
        sent_at: new Date().toISOString(),
        responded_by: "hannah",
      })
      .eq("id", replyId);

    // Update Slack message if we have the reference
    if (reply.slack_message_ts) {
      const { updateReplyMessage } = await import("@/lib/slack-replies");
      await updateReplyMessage(reply.slack_message_ts, "sent", textToSend);
    }

    return NextResponse.json({ success: true, replyId, status: "sent" });
  } catch (error) {
    console.error("Reply send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
