// Trust Hub + Brand + Campaign status webhook.
// Twilio POSTs here when any registration resource changes status:
//   - Customer Profile: draft → pending-review → twilio-approved/rejected
//   - Trust Product: draft → pending-review → twilio-approved/rejected
//   - Brand Registration: PENDING → APPROVED/FAILED
//   - Campaign (usAppToPerson): PENDING → VERIFIED/FAILED
//
// This gives us real-time approval detection. The daily cron in
// /api/cron/check-10dlc-status remains as backup (belt + suspenders).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Validate request is actually from Twilio
    const { validateTwilioWebhook, formDataToParams } = await import("@/lib/twilio");
    const params = formDataToParams(formData);
    const isValid = await validateTwilioWebhook(req, params);
    if (!isValid) {
      console.warn("Trust Hub webhook: invalid Twilio signature — rejecting");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resourceSid = params.ResourceSid || params.Sid;
    const status = params.Status || params.status;
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    console.log(`Trust Hub webhook: ${resourceSid} → ${status}`);

    if (!resourceSid || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Use service role — this is a system webhook, not a user request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find which contractor this SID belongs to (could be profile, trust product, or brand)
    const { data: record } = await supabase
      .from("sms_numbers")
      .select("contractor_id, registration_status, registration_path, customer_profile_sid, trust_product_sid, brand_registration_sid, compliance_website_url")
      .or(`customer_profile_sid.eq.${resourceSid},trust_product_sid.eq.${resourceSid},brand_registration_sid.eq.${resourceSid}`)
      .single();

    if (!record) {
      console.log(`Trust Hub webhook: no matching record for ${resourceSid}`);
      return NextResponse.json({ ok: true });
    }

    const cid = record.contractor_id;
    const normalStatus = status.toLowerCase();

    // ── APPROVAL: Profile or Trust Product → register brand ─────────
    if (normalStatus === "twilio-approved") {
      if (
        record.registration_status === "profile_pending" ||
        record.registration_status === "profile_approved"
      ) {
        console.log(`Profile/Trust approved for ${cid} — registering brand`);

        await supabase
          .from("sms_numbers")
          .update({ registration_status: "profile_approved", updated_at: new Date().toISOString() })
          .eq("contractor_id", cid);

        const { registerBrand } = await import("@/lib/twilio-10dlc");
        await registerBrand(cid);

        await notifyOps(supabase, cid, "info", "Trust profile approved — brand registration started automatically.");
      }
    }

    // ── APPROVAL: Brand → start campaign registration ───────────────
    if (
      (normalStatus === "approved" && resourceSid === record.brand_registration_sid) ||
      // Twilio sometimes sends uppercase
      (status === "APPROVED" && resourceSid === record.brand_registration_sid)
    ) {
      console.log(`Brand approved for ${cid}`);

      if (record.compliance_website_url) {
        // Compliance URL exists — submit campaign automatically
        const { completeCampaignRegistration } = await import("@/lib/twilio-10dlc");
        await completeCampaignRegistration(cid);
        await notifyOps(supabase, cid, "info", "Brand approved. Campaign registration submitted automatically.");
      } else {
        // No compliance URL — park at brand_approved, alert Hannah
        await supabase
          .from("sms_numbers")
          .update({ registration_status: "brand_approved", updated_at: new Date().toISOString() })
          .eq("contractor_id", cid);

        await notifyOps(supabase, cid, "warning", "Brand approved but no compliance URL. Add A2P Wizard URL to continue.");
      }
    }

    // ── APPROVAL: Campaign verified → activate SMS ──────────────────
    if (
      (normalStatus === "verified" || status === "VERIFIED") &&
      record.registration_status === "campaign_pending"
    ) {
      console.log(`Campaign approved for ${cid} — activating SMS!`);

      const { activateSMS } = await import("@/lib/twilio-10dlc");
      await activateSMS(cid);

      // Get contractor name for the alert
      const { data: contractor } = await supabase
        .from("contractors")
        .select("business_name, city, state")
        .eq("id", cid)
        .single();

      const name = contractor?.business_name || cid;
      const location = contractor ? `${contractor.city}, ${contractor.state}` : "";

      await notifyOps(supabase, cid, "info", `SMS LIVE: ${name} (${location}) — all 4 automations active.`);
    }

    // ── REJECTION: any resource ─────────────────────────────────────
    if (
      normalStatus === "twilio-rejected" ||
      normalStatus === "failed" ||
      status === "FAILED"
    ) {
      const errorDetail = errorMessage || errorCode || "No details provided";
      console.error(`Trust Hub REJECTED for ${cid}: ${errorDetail}`);

      await supabase
        .from("sms_numbers")
        .update({
          registration_status: "failed",
          registration_error: `Rejected: ${errorDetail}`,
          updated_at: new Date().toISOString(),
        })
        .eq("contractor_id", cid);

      await notifyOps(supabase, cid, "error", `10DLC registration REJECTED: ${errorDetail}. SID: ${resourceSid}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Trust Hub webhook error:", err.message);
    // Return 200 so Twilio doesn't keep retrying on our errors
    return NextResponse.json({ ok: true });
  }
}

// ── Alert Hannah via email + Slack ──────────────────────────────────
async function notifyOps(
  supabase: any,
  contractorId: string,
  severity: "error" | "warning" | "info",
  message: string
) {
  try {
    // Get contractor name for readable alerts
    const { data: contractor } = await supabase
      .from("contractors")
      .select("business_name")
      .eq("id", contractorId)
      .single();

    const name = contractor?.business_name || contractorId;
    const title = severity === "error"
      ? `10DLC Failed: ${name}`
      : severity === "warning"
        ? `10DLC Action Needed: ${name}`
        : `10DLC Update: ${name}`;

    const { sendAlert } = await import("@/lib/alerts");
    await sendAlert({ title, message, severity, details: { "Contractor ID": contractorId } });
  } catch (err: any) {
    // Don't let alert failures break the webhook
    console.error("Failed to send ops notification:", err.message);
  }
}
