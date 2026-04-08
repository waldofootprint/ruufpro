// Twilio inbound SMS webhook.
// Public endpoint — Twilio posts here when a homeowner texts the contractor's number.
// Validates Twilio signature in production. Handles opt-outs (STOP) and logs messages.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio's URL-encoded webhook body
    const formData = await request.formData();

    // Validate request is actually from Twilio (prevents forged payloads)
    const { validateTwilioWebhook, formDataToParams } = await import("@/lib/twilio");
    const params = formDataToParams(formData);
    const isValid = await validateTwilioWebhook(request, params);
    if (!isValid) {
      console.warn("SMS webhook: invalid Twilio signature — rejecting");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const from = params.From;
    const to = params.To;
    const body = params.Body;
    const messageSid = params.MessageSid;

    if (!from || !to) {
      return new NextResponse("<Response/>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

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
    const normalizedBody = body?.trim().toLowerCase() || "";
    const isOptOut = optOutKeywords.includes(normalizedBody);

    // Check for HELP/INFO keywords — carriers require a response
    const helpKeywords = ["help", "info"];
    const isHelp = helpKeywords.includes(normalizedBody);

    if (isOptOut && contractorId) {
      // Handle opt-out: mark the phone number as opted out
      const { handleOptOut } = await import("@/lib/twilio");
      await handleOptOut(from, contractorId);
    }

    // Look up contractor info for HELP response
    let contractorName = "";
    let contractorPhone = "";
    if (isHelp && contractorId) {
      const { data: contractorInfo } = await supabase
        .from("contractors")
        .select("business_name, phone")
        .eq("id", contractorId)
        .single();
      contractorName = contractorInfo?.business_name || "";
      contractorPhone = contractorInfo?.phone || "";
    }

    // Log the inbound message
    await supabase.from("sms_messages").insert({
      contractor_id: contractorId,
      direction: "inbound",
      from_number: from,
      to_number: to,
      body: body || "",
      message_type: isOptOut ? "opt_out" : isHelp ? "help" : "inbound",
      twilio_sid: messageSid || null,
      status: "received",
    });

    // Notify contractor about regular inbound replies (not opt-out or HELP)
    if (!isOptOut && !isHelp && contractorId && body?.trim()) {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({
        name: "sms/reply.received",
        data: {
          contractorId,
          fromNumber: from,
          body: body.trim(),
          origin: `https://${request.headers.get("host") || "ruufpro.com"}`,
        },
      });
    }

    // Build TwiML response
    let twiml: string;
    if (isHelp && contractorName) {
      // Carriers require a response to HELP keyword
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${contractorName}: For help, call ${contractorPhone}. Reply STOP to unsubscribe.</Message></Response>`;
    } else {
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    }

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
