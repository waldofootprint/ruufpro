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
