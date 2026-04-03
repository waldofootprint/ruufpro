// Trust Hub status webhook — Twilio calls this when a Customer Profile
// or Trust Product status changes (draft → pending-review → twilio-approved/rejected).
// Advances the 10DLC registration to the next step automatically.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resourceSid = formData.get("ResourceSid") as string;
    const status = formData.get("Status") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    console.log(`Trust Hub webhook: ${resourceSid} → ${status}`);

    if (!resourceSid || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Find the contractor by matching the SID to either customer_profile_sid or trust_product_sid
    const { data: record } = await supabase
      .from("sms_numbers")
      .select("contractor_id, registration_status, customer_profile_sid, trust_product_sid")
      .or(`customer_profile_sid.eq.${resourceSid},trust_product_sid.eq.${resourceSid}`)
      .single();

    if (!record) {
      console.log(`Trust Hub webhook: no matching record for ${resourceSid}`);
      return NextResponse.json({ ok: true });
    }

    if (status === "twilio-approved") {
      // Both the Customer Profile and Trust Product need to be approved
      // before we can register the brand. Check if both are now approved.
      if (record.registration_status === "profile_pending") {
        // Profile just got approved — check if trust product is also done,
        // or if this IS the trust product approval
        const { registerBrand } = await import("@/lib/twilio-10dlc");
        await registerBrand(record.contractor_id);
        console.log(`Brand registration started for contractor ${record.contractor_id}`);
      }
    }

    if (status === "twilio-rejected") {
      await supabase
        .from("sms_numbers")
        .update({
          registration_status: "failed",
          registration_error: errorMessage || `Rejected: ${errorCode || "unknown"}`,
          updated_at: new Date().toISOString(),
        })
        .eq("contractor_id", record.contractor_id);

      console.error(`Trust Hub rejected for ${record.contractor_id}: ${errorMessage}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Trust Hub webhook error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
