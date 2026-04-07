// Triggers 10DLC registration for a contractor.
// Called after onboarding completes or from the dashboard.
// Authenticated — only the contractor or service role can trigger.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // Authenticate — get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractor record
    const { data: contractor, error: contractorError } = await supabase
      .from("contractors")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Check if already registered or in progress
    const { data: existing } = await supabase
      .from("sms_numbers")
      .select("registration_status")
      .eq("contractor_id", contractor.id)
      .single();

    if (existing && existing.registration_status !== "failed" && existing.registration_status !== "not_started") {
      return NextResponse.json({
        error: "Registration already in progress",
        status: existing.registration_status,
      }, { status: 409 });
    }

    // Parse the request body for any additional fields (mobile phone for OTP)
    const body = await req.json().catch(() => ({}));

    // Build registration data from contractor record
    // Split business_name into first/last for sole props, or use as-is
    const nameParts = (contractor.business_name || "").split(" ");
    const firstName = nameParts[0] || "Owner";
    const lastName = nameParts.slice(1).join(" ") || contractor.business_name || "Owner";

    const { startRegistration } = await import("@/lib/twilio-10dlc");

    const result = await startRegistration({
      contractorId: contractor.id,
      firstName,
      lastName,
      businessName: contractor.business_name,
      email: contractor.email,
      phone: contractor.phone?.startsWith("+") ? contractor.phone : `+1${contractor.phone.replace(/\D/g, "")}`,
      mobilePhone: body.mobilePhone || undefined,
      ssnLast4: body.ssnLast4 || undefined,
      street: contractor.address || "",
      city: contractor.city,
      state: contractor.state,
      zip: contractor.zip || "",
      legalEntityType: contractor.legal_entity_type || "sole_proprietor",
      ein: contractor.ein || undefined,
      websiteUrl: `https://${contractor.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ruufpro.com`,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("SMS register error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
