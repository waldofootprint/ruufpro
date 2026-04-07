// Resend OTP verification code for sole proprietor 10DLC registration.
// Authenticated — only the contractor can trigger.

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Rate limit: 60-second cooldown between OTP requests
    const { data: smsRecord } = await supabase
      .from("sms_numbers")
      .select("last_otp_sent_at")
      .eq("contractor_id", contractor.id)
      .single();

    if (smsRecord?.last_otp_sent_at) {
      const lastSent = new Date(smsRecord.last_otp_sent_at).getTime();
      const cooldownMs = 60 * 1000;
      const elapsed = Date.now() - lastSent;
      if (elapsed < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec} seconds before resending` },
          { status: 429 }
        );
      }
    }

    const { resendOTP } = await import("@/lib/twilio-10dlc");
    const result = await resendOTP(contractor.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend OTP error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
