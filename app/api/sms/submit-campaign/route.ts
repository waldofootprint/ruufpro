// Triggers campaign registration after contractor saves their compliance URL.
// Called from the SMS dashboard when brand is approved and compliance URL is saved.
// Authenticated — only the contractor or service role can trigger.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractor
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Verify they're in the right state
    const { data: smsRecord } = await supabase
      .from("sms_numbers")
      .select("registration_status, compliance_website_url")
      .eq("contractor_id", contractor.id)
      .single();

    if (!smsRecord) {
      return NextResponse.json({ error: "No SMS registration found" }, { status: 404 });
    }

    if (smsRecord.registration_status !== "brand_approved") {
      return NextResponse.json({
        error: `Cannot submit campaign — current status is ${smsRecord.registration_status}`,
      }, { status: 409 });
    }

    if (!smsRecord.compliance_website_url) {
      return NextResponse.json({ error: "Save compliance URL first" }, { status: 400 });
    }

    // Submit campaign registration
    const { completeCampaignRegistration } = await import("@/lib/twilio-10dlc");
    const result = await completeCampaignRegistration(contractor.id);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Submit campaign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
