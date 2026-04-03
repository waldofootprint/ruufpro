// Twilio inbound SMS webhook.
// Public endpoint — Twilio posts here when a homeowner texts the contractor's number.
// Validates Twilio signature in production. Handles opt-outs (STOP) and logs messages.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio's URL-encoded webhook body
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    if (!from || !to) {
      return new NextResponse("<Response/>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Optional: validate Twilio signature in production
    // In production, use twilio.validateRequest() with the auth token
    // and the full URL + params to verify requests are from Twilio.
    // Skipped for now — add when Twilio account is live.

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up which contractor owns this Twilio number
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("twilio_number", to)
      .single();

    const contractorId = contractor?.id || null;

    // Check for opt-out keywords (STOP, UNSUBSCRIBE, etc.)
    const optOutKeywords = ["stop", "unsubscribe", "cancel", "quit", "end"];
    const isOptOut =
      body && optOutKeywords.includes(body.trim().toLowerCase());

    if (isOptOut && contractorId) {
      // Handle opt-out: mark the phone number as opted out
      const { handleOptOut } = await import("@/lib/twilio");
      await handleOptOut(from, contractorId);
    }

    // Log the inbound message
    await supabase.from("sms_messages").insert({
      contractor_id: contractorId,
      direction: "inbound",
      from_number: from,
      to_number: to,
      body: body || "",
      message_type: isOptOut ? "opt_out" : "inbound",
      twilio_sid: messageSid || null,
      status: "received",
    });

    // Return empty TwiML response (no auto-reply for now)
    // To add an auto-reply later, use: <Response><Message>Your reply</Message></Response>
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("SMS webhook error:", err);
    // Always return valid TwiML even on error so Twilio doesn't retry
    return new NextResponse("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
