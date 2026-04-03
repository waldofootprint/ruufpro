// Send an SMS message via Twilio.
// Internal-only: called by other server-side code (e.g., notification flows).
// Protected by X-Internal-Secret header to prevent external abuse.

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // All env vars accessed inside the handler (Vercel build safety)
  const INTERNAL_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    // Only allow internal calls from our own server
    const secret = request.headers.get("x-internal-secret");
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { to, contractorId, leadId, body: messageBody, messageType } = body;

    if (!to || !contractorId || !messageBody || !messageType) {
      return NextResponse.json(
        { error: "to, contractorId, body, and messageType are required" },
        { status: 400 }
      );
    }

    // Resolve the contractor's sending number (dedicated local or shared toll-free fallback)
    const { getContractorNumber, sendSMS } = await import("@/lib/twilio");
    const fromNumber = await getContractorNumber(contractorId);

    if (!fromNumber) {
      return NextResponse.json(
        { error: "SMS not provisioned for this contractor" },
        { status: 400 }
      );
    }

    // sendSMS handles opt-out checks, Twilio delivery, and logging to sms_messages
    const result = await sendSMS({
      to,
      from: fromNumber,
      body: messageBody,
      contractorId,
      leadId: leadId || undefined,
      messageType,
    });

    if (!result.success) {
      console.error("SMS send failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageSid: result.messageSid });
  } catch (err) {
    console.error("SMS send endpoint error:", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
