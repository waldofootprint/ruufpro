// POST /api/replies/slack-action
// Handles interactive button clicks from Slack (Send, Edit, Skip, Remove).
// Slack sends a payload when Hannah taps a button in the reply notification.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Slack sends form-encoded payload
    const formData = await req.formData();
    const payloadStr = formData.get("payload") as string;

    if (!payloadStr) {
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    // Verify request is from Slack (check signing secret in production)
    // For now, we trust the payload structure

    const action = payload.actions?.[0];
    if (!action) {
      return NextResponse.json({ error: "No action" }, { status: 400 });
    }

    const replyId = action.value;
    const actionId = action.action_id; // reply_send | reply_edit | reply_skip | reply_remove
    const messageTs = payload.message?.ts;

    // Fetch the reply record
    const { data: reply, error: fetchError } = await supabase
      .from("outreach_replies")
      .select("*")
      .eq("id", replyId)
      .single();

    if (fetchError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const { updateReplyMessage, postThreadMessage } = await import(
      "@/lib/slack-replies"
    );

    switch (actionId) {
      case "reply_send": {
        // Send the draft reply via the original channel
        const { sendReply } = await import("@/lib/instantly");

        const sendResult = await sendReply({
          from_email: process.env.OUTREACH_FROM_EMAIL || "hannah@ruufpro.com",
          to_email: reply.prospect_email,
          subject: reply.original_subject
            ? `Re: ${reply.original_subject}`
            : `Re: Hey, ${reply.prospect_name.split(" ")[0]}`,
          body: reply.draft_reply,
          reply_to_message_id: reply.instantly_reply_id,
        });

        if (sendResult.success) {
          // Update database
          await supabase
            .from("outreach_replies")
            .update({
              status: "sent",
              final_reply: reply.draft_reply,
              sent_at: new Date().toISOString(),
              responded_by: "hannah",
            })
            .eq("id", replyId);

          // Update Slack message
          if (messageTs) {
            await updateReplyMessage(messageTs, "sent");
          }
        } else {
          // Notify about send failure
          if (messageTs) {
            await postThreadMessage(
              messageTs,
              `⚠️ Failed to send: ${sendResult.error}. Try again or send manually.`
            );
          }
        }
        break;
      }

      case "reply_edit": {
        // Open edit flow — post in thread asking for edited version
        if (messageTs) {
          await updateReplyMessage(messageTs, "editing");
          await postThreadMessage(
            messageTs,
            "✏️ Type your edited reply here. When you're done, I'll send it.\n\nOr reply with just `send` to send the original draft as-is."
          );
        }

        // Update status to editing
        await supabase
          .from("outreach_replies")
          .update({ status: "editing" })
          .eq("id", replyId);

        break;
      }

      case "reply_skip": {
        // Mark as skipped, no reply sent
        await supabase
          .from("outreach_replies")
          .update({ status: "skipped" })
          .eq("id", replyId);

        if (messageTs) {
          await updateReplyMessage(messageTs, "skipped");
        }
        break;
      }

      case "reply_remove": {
        // Add to suppression list + mark as removed
        if (reply.prospect_email) {
          const { addToSuppressionList } = await import("@/lib/instantly");
          await addToSuppressionList(reply.prospect_email);
        }

        await supabase
          .from("outreach_replies")
          .update({ status: "removed" })
          .eq("id", replyId);

        if (messageTs) {
          await updateReplyMessage(messageTs, "removed");
        }
        break;
      }

      default:
        console.warn("Unknown action:", actionId);
    }

    // Slack expects 200 OK immediately
    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("Slack action error:", error);
    // Always return 200 to Slack to prevent retries
    return new NextResponse("", { status: 200 });
  }
}
