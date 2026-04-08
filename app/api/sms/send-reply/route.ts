// Dashboard manual reply — contractor sends a text to a homeowner from the conversation UI.
// Auth: reads session from cookies via RLS.

import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthSupabase();

    // Verify logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractor record
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "No contractor found" }, { status: 404 });
    }

    const { to, body: messageBody } = await request.json();

    if (!to || !messageBody?.trim()) {
      return NextResponse.json({ error: "to and body are required" }, { status: 400 });
    }

    // Look up the lead by phone number for this contractor (best-effort)
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("contractor_id", contractor.id)
      .eq("phone", to)
      .limit(1)
      .maybeSingle();

    const { getContractorNumber, sendSMS } = await import("@/lib/twilio");
    const fromNumber = await getContractorNumber(contractor.id);

    if (!fromNumber) {
      return NextResponse.json(
        { error: "SMS not active — business number still pending approval" },
        { status: 400 }
      );
    }

    const result = await sendSMS({
      to,
      from: fromNumber,
      body: messageBody.trim(),
      contractorId: contractor.id,
      leadId: lead?.id || undefined,
      messageType: "manual",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageSid: result.messageSid });
  } catch (err) {
    console.error("send-reply error:", err);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
