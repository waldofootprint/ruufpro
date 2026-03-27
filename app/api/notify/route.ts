// Notification endpoint — called after a lead is created.
// Looks up the contractor's email and sends a notification.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLeadNotificationEmail } from "@/lib/notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractor_id, lead_name, lead_phone, lead_email, lead_address, lead_message, source, estimate_low, estimate_high, estimate_material, estimate_roof_sqft } = body;

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
    const sent = await sendLeadNotificationEmail({
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

    return NextResponse.json({ sent });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
