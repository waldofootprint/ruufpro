// Twilio voice status callback — powers missed-call text-back.
// When a call to the contractor's Twilio number goes unanswered,
// Twilio posts a status callback here. We detect no-answer/busy
// and fire an automatic text-back to the caller.
//
// Setup: configure the Twilio number to forward to the contractor's
// personal phone, with this URL as the status callback. When the
// call status is 'no-answer' or 'busy', we trigger the textback.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio's URL-encoded voice webhook body
    const formData = await request.formData();

    // Validate request is actually from Twilio (prevents forged payloads)
    const { validateTwilioWebhook, formDataToParams } = await import("@/lib/twilio");
    const params = formDataToParams(formData);
    const isValid = await validateTwilioWebhook(request, params);
    if (!isValid) {
      console.warn("Voice webhook: invalid Twilio signature — rejecting");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const callStatus = params.CallStatus;
    const from = params.From;
    const to = params.To;
    const callSid = params.CallSid;

    if (!from || !to) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up which contractor owns this Twilio number
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, business_name, phone")
      .eq("twilio_number", to)
      .single();

    // Only fire textback for unanswered calls
    const missedStatuses = ["no-answer", "busy", "failed"];
    if (callStatus && missedStatuses.includes(callStatus) && contractor) {

        // Emit event to Inngest — handles textback with dedup + retry
        await inngest.send({
          name: "sms/call.missed",
          data: {
            contractorId: contractor.id,
            callerPhone: from,
            callSid: callSid || "",
          },
        });

        // Log the missed call
        await supabase.from("sms_messages").insert({
          contractor_id: contractor.id,
          direction: "inbound",
          from_number: from,
          to_number: to,
          body: `Missed call (${callStatus})`,
          message_type: "missed_call",
          twilio_sid: callSid || null,
          status: "received",
        });
    }

    // Return TwiML: forward call to contractor's personal phone for 20 seconds.
    // If no answer, Twilio posts back with CallStatus='no-answer' and we send a textback.
    // If we can't find the contractor or they have no phone, just say sorry and hang up.
    const forwardNumber = contractor?.phone || null;
    const twiml = forwardNumber
      ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20" action="${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/sms/voice-webhook">
    <Number>${forwardNumber}</Number>
  </Dial>
  <Say>Sorry, no one is available right now. We'll text you back shortly. Goodbye.</Say>
  <Hangup/>
</Response>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, no one is available right now. We'll text you back shortly. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("Voice webhook error:", err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}
