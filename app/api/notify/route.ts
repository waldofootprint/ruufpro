// Notification endpoint — called after a lead is created.
// Looks up the contractor's email and sends a notification.
// Public endpoint: called from the estimate widget and contact forms
// on the contractor's public site (visitors are not logged in).
// Validates contractor_id exists before sending.
//
// Rate limiting: per-IP and per-contractor burst protection.
// Serverless instances reset on cold start, but this stops
// sustained abuse within a warm instance.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLeadNotificationEmail } from "@/lib/notifications";
import { inngest } from "@/lib/inngest/client";

// ---------------------------------------------------------------------------
// In-memory rate limiter (per serverless instance)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_PER_IP = 10;               // 10 requests per IP per minute
const MAX_PER_CONTRACTOR = 20;       // 20 leads per contractor per minute

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  });
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// Phone number validation (basic E.164-ish check)
// ---------------------------------------------------------------------------
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`ip:${ip}`, MAX_PER_IP)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

    // Validate contractor_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contractor_id)) {
      return NextResponse.json({ error: "Invalid contractor_id" }, { status: 400 });
    }

    // Rate limit by contractor
    if (isRateLimited(`contractor:${contractor_id}`, MAX_PER_CONTRACTOR)) {
      return NextResponse.json({ error: "Too many requests for this contractor" }, { status: 429 });
    }

    // Validate phone number format if provided (prevents garbage strings hitting Twilio)
    if (lead_phone && !isValidPhone(lead_phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // Look up contractor — must exist and be active
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
