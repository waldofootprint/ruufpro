// Twilio SMS delivery status callback.
// Twilio POSTs here as messages progress: queued → sent → delivered / failed.
// Updates sms_messages status and alerts on failures.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Error codes worth alerting on — carrier rejections, spam filters, etc.
const ALERT_ERROR_CODES = new Set([
  "30003", // Unreachable destination
  "30004", // Message blocked
  "30005", // Unknown destination
  "30006", // Landline or unreachable carrier
  "30007", // Carrier violation (spam filtered)
  "21610", // Attempt to send to unsubscribed recipient
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate this is actually from Twilio
    const { validateTwilioWebhook, formDataToParams } = await import("@/lib/twilio");
    const params = formDataToParams(formData);
    const isValid = await validateTwilioWebhook(request, params);
    if (!isValid) {
      console.warn("Status callback: invalid Twilio signature");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus; // queued, sent, delivered, undelivered, failed
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ ok: true }); // Nothing to do
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the message status in our database
    const updateData: Record<string, string | null> = {
      status: messageStatus,
    };

    if (messageStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    if (errorCode) {
      updateData.error_code = errorCode;
      updateData.error_message = errorMessage;
    }

    await supabase
      .from("sms_messages")
      .update(updateData)
      .eq("twilio_sid", messageSid);

    // Alert on serious failures
    if (
      (messageStatus === "failed" || messageStatus === "undelivered") &&
      errorCode &&
      ALERT_ERROR_CODES.has(errorCode)
    ) {
      const { sendAlert } = await import("@/lib/alerts");
      await sendAlert({
        title: "SMS delivery failed",
        message: `Message ${messageSid} was ${messageStatus}: ${errorMessage || errorCode}`,
        severity: "warning",
        details: {
          "Message SID": messageSid,
          "Status": messageStatus,
          "Error Code": errorCode,
          "Error": errorMessage,
          "To": params.To || null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Status callback error:", err);
    return NextResponse.json({ ok: true }); // Don't make Twilio retry on our errors
  }
}
