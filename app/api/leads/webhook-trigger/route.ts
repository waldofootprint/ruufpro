// Trigger CRM webhook for manually-added leads (from dashboard).
// Widget leads fire via /api/notify → Inngest. This handles the dashboard path.

import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractor_id, lead_name, lead_phone, lead_email,
      lead_address, lead_message, source,
      estimate_low, estimate_high, estimate_material, estimate_roof_sqft,
      timeline, financing_interest,
    } = body;

    if (!contractor_id || !lead_name) {
      return NextResponse.json({ error: "contractor_id and lead_name required" }, { status: 400 });
    }

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
        timeline: timeline || null,
        financingInterest: financing_interest || null,
        // No push notification fields — manual add doesn't need push
        pushTitle: null,
        pushBody: null,
        origin: null,
      },
    });

    return NextResponse.json({ triggered: true });
  } catch (err) {
    console.error("Webhook trigger error:", err);
    return NextResponse.json({ error: "Failed to trigger webhook" }, { status: 500 });
  }
}
