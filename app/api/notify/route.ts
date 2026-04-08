// Notification endpoint — called after a lead is created.
// Looks up the contractor's email and sends a notification.
// Public endpoint: called from the estimate widget and contact forms
// on the contractor's public site (visitors are not logged in).
// Validates contractor_id exists before sending.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLeadNotificationEmail } from "@/lib/notifications";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const body = await request.json();
    const { contractor_id, lead_name, lead_phone, lead_email, lead_address, lead_message, source, estimate_low, estimate_high, estimate_material, estimate_roof_sqft, timeline: leadTimeline, financing_interest } = body;

    if (!contractor_id || !lead_name) {
      return NextResponse.json({ error: "contractor_id and lead_name required" }, { status: 400 });
    }

    // Look up contractor email
    const { data: contractor } = await supabase
      .from("contractors")
      .select("email, business_name")
      .eq("id", contractor_id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Send email notification
    const emailSent = await sendLeadNotificationEmail({
      contractorEmail: contractor.email,
      contractorName: contractor.business_name,
      leadName: lead_name,
      leadPhone: lead_phone || null,
      leadEmail: lead_email || null,
      leadAddress: lead_address || null,
      leadMessage: lead_message || null,
      source: source || "contact_form",
      estimateLow: estimate_low || null,
      estimateHigh: estimate_high || null,
      estimateMaterial: estimate_material || null,
      estimateRoofSqft: estimate_roof_sqft || null,
    });

    // Send smart push notification with full lead details
    const parts: string[] = [lead_name];
    if (estimate_roof_sqft) parts.push(`${estimate_roof_sqft.toLocaleString()} sqft`);
    if (estimate_material) parts.push(estimate_material);
    if (estimate_low && estimate_high) parts.push(`$${estimate_low.toLocaleString()}-$${estimate_high.toLocaleString()}`);
    if (!estimate_low && lead_phone) parts.push(lead_phone);
    const pushBody = parts.join(" · ");

    // Include timeline if available for urgency context
    const timeline = body.timeline;
    const timelineLabel = timeline === "now" ? " · ASAP" : timeline === "1_3_months" ? " · 1-3mo" : "";
    const pushTitle = source === "estimate_widget"
      ? `New Estimate Lead${timelineLabel}`
      : "New Contact Form Lead";

    // Emit event to Inngest — handles push notification + auto-response SMS + CRM webhook
    // with retry, monitoring, and no silent failures
    await inngest.send({
      name: "sms/lead.created",
      data: {
        contractorId: contractor_id,
        leadPhone: lead_phone || null,
        leadName: lead_name,
        leadEmail: lead_email || null,
        leadAddress: lead_address || null,
        leadMessage: lead_message || null,
        source: source || "contact_form",
        estimateLow: estimate_low || null,
        estimateHigh: estimate_high || null,
        estimateMaterial: estimate_material || null,
        estimateRoofSqft: estimate_roof_sqft || null,
        timeline: leadTimeline || null,
        financingInterest: financing_interest || null,
        pushTitle,
        pushBody,
        origin: request.nextUrl.origin,
      },
    });

    return NextResponse.json({ emailSent, to: contractor.email });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
