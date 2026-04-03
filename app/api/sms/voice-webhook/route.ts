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

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio's URL-encoded voice webhook body
    const formData = await request.formData();
    const callStatus = formData.get("CallStatus") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callSid = formData.get("CallSid") as string;

    if (!from || !to) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // Only fire textback for unanswered calls
    const missedStatuses = ["no-answer", "busy", "failed"];
    if (callStatus && missedStatuses.includes(callStatus)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Look up which contractor owns this Twilio number
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, business_name")
        .eq("twilio_number", to)
        .single();

      if (contractor) {
        // Fire the missed-call textback
        const { sendMissedCallTextback } = await import(
          "@/lib/sms-workflows"
        );
        await sendMissedCallTextback(contractor.id, from);

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
    }

    // Return TwiML: ring contractor's phone for 20 seconds, then hang up.
    // The actual forwarding number is configured on the Twilio number itself.
    // This response handles the initial call flow if used as the primary webhook.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20">
    <!-- Twilio forwards to contractor's personal phone (configured per number) -->
  </Dial>
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
