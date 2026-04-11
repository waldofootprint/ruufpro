// SMS Command Center — real-time registration pipeline, health alerts, contractor monitoring.
// Reads from Supabase (sms_numbers, contractors, sms_messages). No demo data.

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────
interface SmsContractor {
  contractor_id: string;
  business_name: string;
  city: string;
  state: string;
  tier: string;
  phone: string | null;
  email: string | null;
  sms_enabled: boolean;
  twilio_number: string | null;
  // From sms_numbers join
  registration_status: string | null;
  registration_path: string | null;
  sms_number_status: string | null;
  phone_number: string | null;
  activated_at: string | null;
  sms_created_at: string | null;
  sms_updated_at: string | null;
  compliance_website_url: string | null;
  brand_registration_sid: string | null;
  customer_profile_sid: string | null;
  campaign_sid: string | null;
  registration_error: string | null;
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  tagLabel: string;
  // Plain English
  whatHappened: string;
  whyItMatters: string;
  // Step-by-step fix
  steps: { text: string; link?: string; linkLabel?: string }[];
}

// ── Registration phases (all 8) ────────────────────────────────────
const PHASES = [
  { key: "profile_created", label: "Profile Created", shortLabel: "Profile", sla: "instant", statuses: ["profile_pending", "profile_approved"] },
  { key: "brand_submitted", label: "Brand Submitted", shortLabel: "Brand", sla: "instant", statuses: ["brand_pending"] },
  { key: "otp_sent", label: "OTP Sent", shortLabel: "OTP Sent", sla: "1 day", statuses: ["brand_otp_required"] },
  { key: "otp_verified", label: "OTP Verified", shortLabel: "OTP OK", sla: "instant", statuses: [] },
  { key: "brand_approved", label: "Brand Approved", shortLabel: "Brand OK", sla: "1-7 days", statuses: ["brand_approved"] },
  { key: "campaign_created", label: "Campaign Created", shortLabel: "Campaign", sla: "auto", statuses: ["campaign_pending"] },
  { key: "campaign_approved", label: "Campaign Approved", shortLabel: "Approved", sla: "10-15 days", statuses: ["campaign_approved"] },
  { key: "number_active", label: "SMS Live", shortLabel: "LIVE", sla: "auto", statuses: [] },
];

// Map registration_status to phase index (0-7)
function getPhaseIndex(status: string | null, smsStatus: string | null): number {
  if (smsStatus === "active") return 7;
  switch (status) {
    case "campaign_approved": return 7;
    case "campaign_pending": return 5;
    case "brand_approved": return 4;
    case "brand_otp_required": return 2;
    case "brand_pending": return 1;
    case "profile_approved": return 1;
    case "profile_pending": return 0;
    case "not_started": return -1;
    case "failed": return -2;
    default: return -1;
  }
}

// SLA thresholds for stuck detection (days)
const SLA_THRESHOLDS: Record<string, number> = {
  brand_otp_required: 3,
  brand_pending: 7,
  brand_approved: 1, // compliance URL should be added within 1 day
  campaign_pending: 20,
  profile_pending: 5,
};

function daysSince(d: string | null): number {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3");
}

// ── Generate alerts from real data ─────────────────────────────────
function generateAlerts(contractors: SmsContractor[]): Alert[] {
  const alerts: Alert[] = [];
  const TW = "https://console.twilio.com";
  const SB = "https://supabase.com/dashboard/project/comcpamnxjtldlnnudqc/sql";

  for (const c of contractors) {
    const phase = getPhaseIndex(c.registration_status, c.sms_number_status);
    const days = daysSince(c.sms_updated_at);
    const threshold = SLA_THRESHOLDS[c.registration_status || ""] || 999;
    const dateStr = c.sms_updated_at ? new Date(c.sms_updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "unknown";
    const path = c.registration_path === "sole_proprietor" ? "Sole Prop" : "LLC/Corp";

    // ── OTP not entered (sole prop only) ──
    if (c.registration_status === "brand_otp_required") {
      const hrs = c.sms_updated_at ? Math.floor((Date.now() - new Date(c.sms_updated_at).getTime()) / 3600000) : 0;
      if (hrs >= 2 || days > threshold) {
        alerts.push({
          id: `otp-${c.contractor_id}`, severity: days > threshold ? "critical" : "warning",
          tagLabel: "Registration stalled",
          title: `${c.business_name} — OTP not entered (${days > 0 ? `${days}d` : `${hrs}h`})`,
          whatHappened: [
            `• Sole prop registration requires a 6-digit OTP code sent to ${formatPhone(c.phone)}`,
            `• Code was sent ${days > 0 ? `${days} days` : `${hrs} hours`} ago on ${dateStr}`,
            `• Contractor must enter it in Dashboard → SMS Settings`,
            `• Registration is frozen until they do`,
            days > 3 ? `• ⚠ Code likely expired — will need a resend` : "",
          ].filter(Boolean).join("\n"),
          whyItMatters: [
            `• Paying $149/mo with no SMS`,
            `• Every day = one more day to churn`,
            `• Leads during this time get zero auto-response`,
          ].join("\n"),
          steps: [
            { text: `Contact contractor at ${formatPhone(c.phone)} or ${c.email || "email"}:` },
            { text: `"Check your phone for a 6-digit code from Twilio → enter it in Dashboard → SMS Settings"` },
            { text: `If code lost → have them click "Resend Code" in SMS Settings` },
            { text: `If resend fails → check brand status in Twilio Trust Hub`, link: `${TW}/console/trust-hub/customer-profiles`, linkLabel: "Twilio Trust Hub" },
            ...(days > 3 ? [{ text: `Code expired (${days}d old) → may need to restart brand registration` }] : []),
            { text: `Ref: Profile SID ${c.customer_profile_sid || "—"}` },
          ],
        });
      }
    }

    // ── Brand pending too long ──
    if (c.registration_status === "brand_pending" && days > threshold) {
      alerts.push({
        id: `stuck-brand-${c.contractor_id}`, severity: "warning",
        tagLabel: "Brand review delayed",
        title: `${c.business_name} — brand pending ${days}d (SLA: ${threshold}d)`,
        whatHappened: [
          `• ${path} brand submitted to TCR on ${dateStr}`,
          `• TCR verifies business identity against public records`,
          `• Expected: 1-7 business days — it's been ${days}`,
          `• No approval or rejection received`,
        ].join("\n"),
        whyItMatters: [
          `• Blocks everything downstream (campaign, number, SMS)`,
          `• Contractor waiting ${days} days with zero SMS capability`,
        ].join("\n"),
        steps: [
          { text: `Check brand status → Brand SID: ${c.brand_registration_sid || "—"}`, link: `${TW}/console/trust-hub/brand-registrations`, linkLabel: "Twilio Brands" },
          { text: `If "pending" with no errors → TCR still processing (normal for ${path})` },
          { text: `If "failed/rejected" → check reason (common: name mismatch, EIN mismatch, duplicate)` },
          { text: `If stuck >10d → contact Twilio support with Profile SID: ${c.customer_profile_sid || "—"}`, link: "https://support.twilio.com/hc/en-us", linkLabel: "Twilio Support" },
        ],
      });
    }

    // ── Brand approved, no compliance URL ──
    if (c.registration_status === "brand_approved" && days > (SLA_THRESHOLDS["brand_approved"] || 1)) {
      alerts.push({
        id: `compliance-${c.contractor_id}`, severity: "warning",
        tagLabel: "Your action needed",
        title: `${c.business_name} — needs compliance URL`,
        whatHappened: [
          `• Brand approved ✓ — but campaign can't be created yet`,
          `• Missing: compliance website URL (SMS terms + privacy policy page)`,
          `• Required by carriers before campaign approval`,
          `• This is YOUR action, not the contractor's`,
        ].join("\n"),
        whyItMatters: [
          `• Registration paused — brand approved but nothing else can happen`,
          `• Waiting ${days} day${days !== 1 ? "s" : ""} since approval`,
        ].join("\n"),
        steps: [
          { text: `Go to A2P Wizard → generate compliance page`, link: "https://a2pwizard.com", linkLabel: "A2P Wizard" },
          { text: `Info needed: business name, phone, message types (lead response, missed call, reviews)` },
          { text: `Copy URL (like: compliance.a2pwizard.com/contractor-name)` },
          { text: `Paste in contractor's Dashboard → SMS Settings → save` },
          { text: `System auto-creates campaign and submits to carriers — no further action` },
        ],
      });
    }

    // ── Campaign pending too long ──
    if (c.registration_status === "campaign_pending" && days > threshold) {
      alerts.push({
        id: `stuck-campaign-${c.contractor_id}`, severity: days > threshold * 1.5 ? "critical" : "warning",
        tagLabel: "Campaign delayed",
        title: `${c.business_name} — campaign pending ${days}d (SLA: ${threshold}d)`,
        whatHappened: [
          `• Campaign submitted to carriers on ${dateStr}`,
          `• Carrier review (T-Mobile, AT&T, Verizon) typically 10-15 business days`,
          `• It's been ${days} days — no approval or rejection`,
          `• Campaign SID: ${c.campaign_sid || "—"}`,
        ].join("\n"),
        whyItMatters: [
          `• Can't provision phone number until approved`,
          `• Contractor paying $149/mo for ${days} days with no SMS`,
          `• High churn risk — may cancel before activation`,
        ].join("\n"),
        steps: [
          { text: `Check campaign status → Campaign SID: ${c.campaign_sid || "—"}`, link: `${TW}/console/sms/settings/10dlc-campaigns`, linkLabel: "Twilio Campaigns" },
          { text: `If "pending" → send contractor reassurance email: "Your number is in final carrier review. We'll notify you the moment it's approved."` },
          { text: `If rejected → note error code. Common: vague use case, missing privacy URL, opt-in mismatch` },
          { text: `If rejected → 7-day priority resubmission window. Fix and resubmit ASAP — after 7d, back of the line` },
          { text: `If >25d with no movement → escalate to Twilio support`, link: "https://support.twilio.com/hc/en-us", linkLabel: "Twilio Support" },
        ],
      });
    }

    // ── Split-brain: active number + sms_enabled false ──
    if (c.sms_number_status === "active" && !c.sms_enabled) {
      alerts.push({
        id: `splitbrain-${c.contractor_id}`, severity: "critical",
        tagLabel: "SMS silently blocked",
        title: `${c.business_name} — active number, SMS disabled`,
        whatHappened: [
          `• Number ${formatPhone(c.phone_number)} is active and CAN send texts`,
          `• But contractors.sms_enabled = false`,
          `• Auto-response checks this flag → sees "false" → skips sending`,
          `• Contractor sees green "Active" badge → thinks it's working`,
          `• Reality: zero texts being sent`,
        ].join("\n"),
        whyItMatters: [
          `• Every lead is getting NO auto-response`,
          `• Contractor has no idea — dashboard shows "Active"`,
          `• #1 silent churn risk`,
        ].join("\n"),
        steps: [
          { text: `Fix immediately — run in Supabase:`, link: SB, linkLabel: "Supabase SQL" },
          { text: `UPDATE contractors SET sms_enabled = true, updated_at = now() WHERE id = '${c.contractor_id}';` },
          { text: `Refresh this page — alert should disappear` },
          { text: `Root cause: activateSMS() updates 2 tables separately — second update failed. DB trigger (migration 043) prevents this going forward.` },
        ],
      });
    }

    // ── twilio_number not synced ──
    if (c.sms_number_status === "active" && !c.twilio_number) {
      alerts.push({
        id: `nosync-${c.contractor_id}`, severity: "critical",
        tagLabel: "TCPA compliance risk",
        title: `${c.business_name} — STOP keywords broken`,
        whatHappened: [
          `• Number ${formatPhone(c.phone_number)} is active and sending`,
          `• But contractors.twilio_number is NULL`,
          `• When homeowner texts STOP → webhook looks up contractor by this column`,
          `• Lookup fails → opt-out silently ignored`,
          `• Result: homeowner said STOP but keeps getting texts`,
        ].join("\n"),
        whyItMatters: [
          `• TCPA violation — can trigger carrier complaint`,
          `• Multiple complaints → Twilio account suspension → ALL contractors lose SMS`,
          `• Also breaks: inbound reply alerts for this contractor`,
        ].join("\n"),
        steps: [
          { text: `Fix immediately — run in Supabase:`, link: SB, linkLabel: "Supabase SQL" },
          { text: `UPDATE contractors SET twilio_number = '${c.phone_number}', updated_at = now() WHERE id = '${c.contractor_id}';` },
          { text: `Refresh this page — alert should disappear` },
          { text: `Test: send "STOP" to ${formatPhone(c.phone_number)} from any phone → check sms_opt_outs table for new row` },
          { text: `Root cause: number saved to sms_numbers but not copied to contractors. Code fix deployed today prevents this.` },
        ],
      });
    }

    // ── Failed: mobile limit (sole prop) ──
    if (c.registration_status === "failed" && c.registration_error?.toLowerCase().includes("already registered")) {
      alerts.push({
        id: `failed-mobile-${c.contractor_id}`, severity: "critical",
        tagLabel: "Registration failed — mobile limit",
        title: `${c.business_name} — phone maxed out (3 vendor limit)`,
        whatHappened: [
          `• Sole prop registration rejected by TCR`,
          `• Error: "${c.registration_error}"`,
          `• TCR limits sole props to 3 registrations across ALL SMS vendors`,
          `• This contractor's phone is already registered with 3 others (Podium, GHL, HCP, etc.)`,
        ].join("\n"),
        whyItMatters: [
          `• SMS will NEVER activate on this phone number`,
          `• Contractor paying $149/mo for a feature that can't work`,
          `• Needs resolution or refund`,
        ].join("\n"),
        steps: [
          { text: `Ask contractor: "Do you use Podium, GoHighLevel, Housecall Pro, or another texting service?"` },
          { text: `Option A: Remove a registration from another vendor → retry` },
          { text: `Option B: Use a different phone number for registration` },
          { text: `Option C: If they have an EIN → re-register as LLC (no mobile limit on standard path)` },
          { text: `To retry: delete failed row from sms_numbers → contractor clicks "Set Up Business Number" again` },
          { text: `Check details in Twilio`, link: `${TW}/console/trust-hub/customer-profiles`, linkLabel: "Twilio Trust Hub" },
        ],
      });
    }

    // ── Failed: EIN mismatch (LLC) ──
    if (c.registration_status === "failed" && (c.registration_error?.toLowerCase().includes("ein") || c.registration_error?.toLowerCase().includes("mismatch"))) {
      alerts.push({
        id: `failed-ein-${c.contractor_id}`, severity: "critical",
        tagLabel: "Registration failed — EIN mismatch",
        title: `${c.business_name} — EIN or business name doesn't match`,
        whatHappened: [
          `• LLC/Corp registration rejected by TCR`,
          `• Error: "${c.registration_error}"`,
          `• The EIN or business name provided doesn't match IRS public records`,
          `• Common causes:`,
          `  — Business name missing "LLC" or "Inc" suffix`,
          `  — Typo in EIN (must be XX-XXXXXXX format)`,
          `  — Recently formed LLC not yet in IRS database`,
        ].join("\n"),
        whyItMatters: [
          `• SMS will not activate until corrected and resubmitted`,
          `• 7-day priority resubmission window after rejection`,
        ].join("\n"),
        steps: [
          { text: `Ask contractor to verify: "What exactly is your business name on your IRS EIN letter? Including LLC, Inc, etc."` },
          { text: `Compare their answer to what's in the contractors table (business_name + ein)` },
          { text: `If name needs "LLC" suffix → update contractors.business_name in Supabase`, link: SB, linkLabel: "Supabase SQL" },
          { text: `If EIN has typo → update contractors.ein in Supabase` },
          { text: `Delete the failed sms_numbers row → contractor retries from dashboard` },
          { text: `If newly formed LLC → may need to wait 2-4 weeks for IRS database to update` },
        ],
      });
    }

    // ── Failed: generic/unknown error ──
    if (c.registration_status === "failed" && !c.registration_error?.toLowerCase().includes("already registered") && !c.registration_error?.toLowerCase().includes("ein") && !c.registration_error?.toLowerCase().includes("mismatch")) {
      alerts.push({
        id: `failed-generic-${c.contractor_id}`, severity: "critical",
        tagLabel: "Registration failed",
        title: `${c.business_name} — registration failed`,
        whatHappened: [
          `• ${path} registration rejected`,
          `• Error: "${c.registration_error || "Unknown error"}"`,
          `• Could be: data issue, duplicate registration, Twilio API error, or temporary TCR problem`,
        ].join("\n"),
        whyItMatters: [
          `• SMS blocked until resolved`,
          `• Contractor paying $149/mo with no activation path`,
        ].join("\n"),
        steps: [
          { text: `Check full error in Twilio Trust Hub → Profile SID: ${c.customer_profile_sid || "—"}`, link: `${TW}/console/trust-hub/customer-profiles`, linkLabel: "Twilio Trust Hub" },
          { text: `If temporary/API error → wait 24h and retry` },
          { text: `If data issue → fix contractor data in Supabase`, link: SB, linkLabel: "Supabase SQL" },
          { text: `If persistent → contact Twilio support with error message + Profile SID`, link: "https://support.twilio.com/hc/en-us", linkLabel: "Twilio Support" },
          { text: `To retry: delete sms_numbers row → contractor clicks "Set Up Business Number"` },
        ],
      });
    }

    // ── Profile pending too long ──
    if (c.registration_status === "profile_pending" && days > (SLA_THRESHOLDS["profile_pending"] || 5)) {
      alerts.push({
        id: `stuck-profile-${c.contractor_id}`, severity: "warning",
        tagLabel: "Profile review delayed",
        title: `${c.business_name} — profile pending ${days}d`,
        whatHappened: [
          `• Trust profile submitted ${days} days ago`,
          `• Twilio verifies business identity — usually instant to same-day`,
          `• ${days} days is abnormal`,
        ].join("\n"),
        whyItMatters: [
          `• First step of 8 — everything blocked behind this`,
        ].join("\n"),
        steps: [
          { text: `Check profile status in Twilio → Profile SID: ${c.customer_profile_sid || "—"}`, link: `${TW}/console/trust-hub/customer-profiles`, linkLabel: "Twilio Trust Hub" },
          { text: `If "in-review" → Twilio may need additional docs. Check for email from Twilio.` },
          { text: `If error → may need to delete and re-create the profile` },
        ],
      });
    }
  }

  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  return alerts;
}

// ── Demo data — every error type, LLC + sole prop mix ──────────────
const DEMO_CONTRACTORS: SmsContractor[] = [
  // CRITICAL: EIN mismatch (LLC)
  {
    contractor_id: "demo-1", business_name: "Gulf Coast Roofing LLC",
    city: "Tampa", state: "FL", tier: "pro",
    phone: "+18135550101", email: "mark@gulfcoastroofing.com",
    sms_enabled: false, twilio_number: null,
    registration_status: "failed", registration_path: "standard",
    sms_number_status: "pending_registration",
    phone_number: null, activated_at: null,
    sms_created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    compliance_website_url: null,
    brand_registration_sid: null, customer_profile_sid: "BU1111222233334444",
    campaign_sid: null,
    registration_error: "TCR rejected: EIN mismatch — business name 'Gulf Coast Roofing' does not match IRS records for EIN 59-1234567. Expected 'Gulf Coast Roofing LLC'.",
  },
  // CRITICAL: Mobile limit (sole prop)
  {
    contractor_id: "demo-2", business_name: "Dan's Roofing",
    city: "Jacksonville", state: "FL", tier: "pro",
    phone: "+19045550202", email: "dan@dansroofing.com",
    sms_enabled: false, twilio_number: null,
    registration_status: "failed", registration_path: "sole_proprietor",
    sms_number_status: "pending_registration",
    phone_number: null, activated_at: null,
    sms_created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    compliance_website_url: null,
    brand_registration_sid: null, customer_profile_sid: "BU5555666677778888",
    campaign_sid: null,
    registration_error: "TCR rejected: mobile number already registered with 3 other vendors (Podium, GoHighLevel, HCP).",
  },
  // CRITICAL: Active but twilio_number not synced (LLC)
  {
    contractor_id: "demo-3", business_name: "Bay Area Roofers LLC",
    city: "St Petersburg", state: "FL", tier: "pro",
    phone: "+17275550303", email: "lisa@bayarearoofers.com",
    sms_enabled: true, twilio_number: null,
    registration_status: "campaign_approved", registration_path: "standard",
    sms_number_status: "active",
    phone_number: "+17275558888", activated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    sms_created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    compliance_website_url: "https://compliance.a2pwizard.com/bayarea",
    brand_registration_sid: "BNaabb01", customer_profile_sid: "BUaabb01",
    campaign_sid: "CMaabb01", registration_error: null,
  },
  // CRITICAL: Active but sms_enabled false (LLC — split-brain)
  {
    contractor_id: "demo-4", business_name: "Pinnacle Roofing Inc",
    city: "Clearwater", state: "FL", tier: "pro",
    phone: "+17275550404", email: "tom@pinnacleroofing.com",
    sms_enabled: false, twilio_number: "+17275557777",
    registration_status: "campaign_approved", registration_path: "standard",
    sms_number_status: "active",
    phone_number: "+17275557777", activated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    sms_created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    compliance_website_url: "https://compliance.a2pwizard.com/pinnacle",
    brand_registration_sid: "BNccdd01", customer_profile_sid: "BUccdd01",
    campaign_sid: "CMccdd01", registration_error: null,
  },
  // WARNING: Campaign pending 22 days (LLC)
  {
    contractor_id: "demo-5", business_name: "SunCoast Roofing LLC",
    city: "Tampa", state: "FL", tier: "pro",
    phone: "+18135550505", email: "mike@suncoastroofing.com",
    sms_enabled: false, twilio_number: null,
    registration_status: "campaign_pending", registration_path: "standard",
    sms_number_status: "pending_registration",
    phone_number: "+18135559876", activated_at: null,
    sms_created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    compliance_website_url: "https://compliance.a2pwizard.com/suncoast",
    brand_registration_sid: "BNeeff01", customer_profile_sid: "BUeeff01",
    campaign_sid: "CMeeff01", registration_error: null,
  },
  // WARNING: Brand approved, needs compliance URL (LLC)
  {
    contractor_id: "demo-6", business_name: "Heritage Roofing LLC",
    city: "Sarasota", state: "FL", tier: "pro",
    phone: "+19415550606", email: "sarah@heritageroofing.com",
    sms_enabled: false, twilio_number: null,
    registration_status: "brand_approved", registration_path: "standard",
    sms_number_status: "pending_registration",
    phone_number: null, activated_at: null,
    sms_created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    compliance_website_url: null,
    brand_registration_sid: "BNgghh01", customer_profile_sid: "BUgghh01",
    campaign_sid: null, registration_error: null,
  },
  // WARNING: OTP not entered — sole prop
  {
    contractor_id: "demo-7", business_name: "Mike's Roof Repair",
    city: "Lakeland", state: "FL", tier: "pro",
    phone: "+18635550707", email: "mike@mikesroofrepair.com",
    sms_enabled: false, twilio_number: null,
    registration_status: "brand_otp_required", registration_path: "sole_proprietor",
    sms_number_status: "pending_registration",
    phone_number: null, activated_at: null,
    sms_created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    compliance_website_url: null,
    brand_registration_sid: "BNiijj01", customer_profile_sid: "BUiijj01",
    campaign_sid: null, registration_error: null,
  },
  // OK: Fully active (LLC) — no alerts
  {
    contractor_id: "demo-8", business_name: "Elite Roof Solutions LLC",
    city: "Orlando", state: "FL", tier: "pro",
    phone: "+14075550808", email: "jake@eliteroof.com",
    sms_enabled: true, twilio_number: "+14075559999",
    registration_status: "campaign_approved", registration_path: "standard",
    sms_number_status: "active",
    phone_number: "+14075559999",
    activated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    sms_created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    compliance_website_url: "https://compliance.a2pwizard.com/elite",
    brand_registration_sid: "BNkkll01", customer_profile_sid: "BUkkll01",
    campaign_sid: "CMkkll01", registration_error: null,
  },
  // OK: Fully active (sole prop) — no alerts
  {
    contractor_id: "demo-9", business_name: "Joe's Roofing",
    city: "Ocala", state: "FL", tier: "pro",
    phone: "+13525550909", email: "joe@joesroofing.com",
    sms_enabled: true, twilio_number: "+13525556666",
    registration_status: "campaign_approved", registration_path: "sole_proprietor",
    sms_number_status: "active",
    phone_number: "+13525556666",
    activated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    sms_created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    sms_updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    compliance_website_url: "https://compliance.a2pwizard.com/joes",
    brand_registration_sid: "BNmmnn01", customer_profile_sid: "BUmmnn01",
    campaign_sid: "CMmmnn01", registration_error: null,
  },
];

// ══════════════════════════════════════════════════════════════════════
export default function SmsOpsPage() {
  const [contractors, setContractors] = useState<SmsContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
    // Get all contractors that have SMS registration
    const { data: smsNumbers } = await supabase
      .from("sms_numbers")
      .select("contractor_id, registration_status, registration_path, status, phone_number, activated_at, created_at, updated_at, compliance_website_url, brand_registration_sid, customer_profile_sid, campaign_sid, registration_error")
      .order("created_at", { ascending: false });

    if (!smsNumbers || smsNumbers.length === 0) {
      setContractors([]);
      setLoading(false);
      return;
    }

    // Get contractor details for each
    const contractorIds = smsNumbers.map((n) => n.contractor_id);
    const { data: contractorData } = await supabase
      .from("contractors")
      .select("id, business_name, city, state, tier, phone, email, sms_enabled, twilio_number")
      .in("id", contractorIds);

    const contractorMap = new Map(
      (contractorData || []).map((c) => [c.id, c])
    );

    const merged: SmsContractor[] = smsNumbers.map((n) => {
      const c = contractorMap.get(n.contractor_id);
      return {
        contractor_id: n.contractor_id,
        business_name: c?.business_name || "Unknown",
        city: c?.city || "",
        state: c?.state || "",
        tier: c?.tier || "free",
        phone: c?.phone || null,
        email: c?.email || null,
        sms_enabled: c?.sms_enabled || false,
        twilio_number: c?.twilio_number || null,
        registration_status: n.registration_status,
        registration_path: n.registration_path,
        sms_number_status: n.status,
        phone_number: n.phone_number,
        activated_at: n.activated_at,
        sms_created_at: n.created_at,
        sms_updated_at: n.updated_at,
        compliance_website_url: n.compliance_website_url,
        brand_registration_sid: n.brand_registration_sid,
        customer_profile_sid: n.customer_profile_sid,
        campaign_sid: n.campaign_sid,
        registration_error: n.registration_error,
      };
    });

    // Sort worst-first: failed > stuck > in-progress > active
    merged.sort((a, b) => {
      const phaseA = getPhaseIndex(a.registration_status, a.sms_number_status);
      const phaseB = getPhaseIndex(b.registration_status, b.sms_number_status);
      if (phaseA === -2 && phaseB !== -2) return -1; // failed first
      if (phaseB === -2 && phaseA !== -2) return 1;
      if (phaseA < 7 && phaseB >= 7) return -1; // in-progress before active
      if (phaseB < 7 && phaseA >= 7) return 1;
      return phaseA - phaseB;
    });

    setContractors(merged);
    setLoading(false);
    } catch (err: any) {
      console.error("Ops SMS page load error:", err);
      setLoadError("Failed to load SMS data. Check Supabase connection.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use demo data if no real contractors or demo mode toggled
  const displayContractors = demoMode || contractors.length === 0 ? DEMO_CONTRACTORS : contractors;

  const alerts = generateAlerts(displayContractors);
  const activeCount = displayContractors.filter((c) => c.sms_number_status === "active").length;
  const inProgressCount = displayContractors.filter((c) => c.sms_number_status !== "active" && c.registration_status !== "not_started" && c.registration_status !== "failed").length;
  const failedCount = displayContractors.filter((c) => c.registration_status === "failed").length;

  // Count contractors at each phase for funnel
  const phaseCounts = PHASES.map((_, i) => {
    return displayContractors.filter((c) => getPhaseIndex(c.registration_status, c.sms_number_status) === i).length;
  });
  // "Passed" = count at or beyond this phase
  const phasePassed = PHASES.map((_, i) => {
    return displayContractors.filter((c) => getPhaseIndex(c.registration_status, c.sms_number_status) >= i).length;
  });

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="text-[13px] text-[#8E8E93]">Loading SMS data...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-6 text-center">
        <p className="text-red-400 text-[13px] mb-3">{loadError}</p>
        <button onClick={loadData} className="text-[13px] text-amber-500 hover:text-amber-400 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">
      {/* ═══ PAGE HEADER ═══ */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">SMS Command Center</h2>
          <p className="text-[13px] text-[#8E8E93] mt-1">
            Registration pipeline, system health, contractor monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              demoMode ? "bg-[#007AFF] text-white" : "bg-[#F5F5F7] text-[#8E8E93] hover:bg-[#E5E5EA]"
            }`}
          >
            {demoMode ? "Demo ON" : "Demo"}
          </button>
          <button
            onClick={loadData}
            className="text-[11px] font-semibold text-[#007AFF] hover:text-[#0056CC] transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ═══ SECTION 1: ACTION REQUIRED ═══ */}
      {alerts.length > 0 ? (
        <div className={`rounded-xl border overflow-hidden ${
          alerts.some((a) => a.severity === "critical")
            ? "bg-[#FFF5F5] border-[#EF9A9A]"
            : "bg-[#FFFEF5] border-[#FFE082]"
        }`}>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold">
                {alerts.some((a) => a.severity === "critical") ? "🚨" : "⚡"} Action Required
              </span>
            </div>
            <div className="flex gap-2">
              {alerts.filter((a) => a.severity === "critical").length > 0 && (
                <span className="text-[10px] font-semibold bg-[#FFEBEE] text-[#C62828] px-2.5 py-1 rounded-[10px]">
                  {alerts.filter((a) => a.severity === "critical").length} critical
                </span>
              )}
              {alerts.filter((a) => a.severity === "warning").length > 0 && (
                <span className="text-[10px] font-semibold bg-[#FFF8E1] text-[#F57F17] px-2.5 py-1 rounded-[10px]">
                  {alerts.filter((a) => a.severity === "warning").length} warning
                </span>
              )}
            </div>
          </div>

          <div className="px-5 pb-4 space-y-2">
            {alerts.map((alert) => {
              const isOpen = expandedAlerts.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border-l-4 overflow-hidden ${
                    alert.severity === "critical"
                      ? "bg-white border-l-[#FF3B30]"
                      : "bg-white border-l-[#FF9F0A]"
                  }`}
                >
                  {/* Collapsed header — always visible */}
                  <button
                    className="w-full px-4 py-3.5 flex justify-between items-center hover:bg-[#FAFBFC] transition-colors text-left"
                    onClick={() => {
                      const next = new Set(expandedAlerts);
                      isOpen ? next.delete(alert.id) : next.add(alert.id);
                      setExpandedAlerts(next);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.severity === "critical" ? "bg-[#FF3B30]" : "bg-[#FF9F0A]"
                      }`} />
                      <div className="text-[13px] font-bold truncate">{alert.title}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                        alert.severity === "critical"
                          ? "bg-[#FFEBEE] text-[#C62828]"
                          : "bg-[#FFF8E1] text-[#F57F17]"
                      }`}>
                        {alert.tagLabel}
                      </span>
                      <span className="text-[10px] text-[#C7C7CC]">{isOpen ? "▼" : "▶"}</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#F2F2F7]">
                      {/* What happened */}
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8E8E93] mb-1.5">
                          What happened
                        </div>
                        <div className="text-[12px] text-[#3C3C43] space-y-1">
                          {alert.whatHappened.split("\n").map((line, i) => (
                            <div key={i} className={`leading-[1.5] ${line.startsWith("  ") ? "ml-4 text-[#6D6D72]" : ""}`}>
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Why it matters */}
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8E8E93] mb-1.5">
                          Why it matters
                        </div>
                        <div className={`text-[12px] space-y-1 ${
                          alert.severity === "critical" ? "text-[#C62828]" : "text-[#6D6D72]"
                        }`}>
                          {alert.whyItMatters.split("\n").map((line, i) => (
                            <div key={i} className="leading-[1.5]">{line}</div>
                          ))}
                        </div>
                      </div>

                      {/* How to fix — step by step */}
                      <div className="mt-3 p-3.5 bg-[#F0F7FF] border border-[#BBDEFB] rounded-lg">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#1565C0] mb-2">
                          How to fix — step by step
                        </div>
                        <ol className="space-y-2.5">
                          {alert.steps.map((step, i) => (
                            <li key={i} className="flex gap-2.5 text-[12px] leading-[1.6]">
                              <span className="text-[11px] font-bold text-[#1565C0] flex-shrink-0 mt-px w-4">
                                {i + 1}.
                              </span>
                              <div>
                                <span className="text-[#1D1D1F]">{step.text}</span>
                                {step.link && (
                                  <a
                                    href={step.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 ml-1.5 text-[11px] font-semibold text-[#007AFF] hover:text-[#0056CC] transition-colors"
                                  >
                                    {step.linkLabel || "Open"} ↗
                                  </a>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#A5D6A7] bg-[#F0FFF4] px-5 py-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
          <span className="text-[13px] font-semibold text-[#2E7D32]">All systems healthy — no action required</span>
        </div>
      )}

      {/* ═══ SECTION 2: 8-PHASE REGISTRATION FUNNEL ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em]">
            10DLC Registration Pipeline
          </div>
          <div className="flex gap-2">
            {failedCount > 0 && (
              <span className="text-[10px] font-semibold bg-[#FFEBEE] text-[#C62828] px-2.5 py-1 rounded-[10px]">
                {failedCount} failed
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="text-[10px] font-semibold bg-[#FFF8E1] text-[#F57F17] px-2.5 py-1 rounded-[10px]">
                {inProgressCount} in progress
              </span>
            )}
            <span className="text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-[10px]">
              {activeCount} live
            </span>
          </div>
        </div>

        <div className="flex px-5 py-5 gap-1">
          {PHASES.map((phase, i) => {
            const count = phaseCounts[i];
            const hasPassed = phasePassed[i] > 0;
            const isActive = count > 0 && i < 7;
            const isLive = i === 7;
            const isDone = hasPassed && count === 0;

            // Determine bar color
            let barColor = "bg-[#E5E5EA]"; // pending
            let textColor = "text-[#C7C7CC]";
            let labelColor = "text-[#8E8E93]";
            let slaColor = "text-[#AEAEB2]";

            if (isLive && count > 0) {
              barColor = "bg-gradient-to-br from-[#34C759] to-[#2E7D32]";
              textColor = "text-white";
              labelColor = "text-[#2E7D32] font-bold";
            } else if (isActive) {
              barColor = "bg-[#FF9F0A] animate-pulse";
              textColor = "text-white";
              labelColor = "text-[#F57F17] font-semibold";
              slaColor = "text-[#FF9F0A]";
            } else if (isDone) {
              barColor = "bg-[#34C759]";
              textColor = "text-white";
            }

            return (
              <div key={phase.key} className="flex-1 text-center relative">
                {/* Connecting line */}
                {i > 0 && (
                  <div
                    className={`absolute top-[18px] h-[2px] z-[1] ${hasPassed ? "bg-[#34C759]" : "bg-[#E5E5EA]"}`}
                    style={{ left: "calc(-50% + 16px)", right: "calc(50% + 16px)" }}
                  />
                )}
                {/* Phase bar */}
                <div className={`h-9 rounded-md mx-1 flex items-center justify-center text-[14px] font-bold ${textColor} ${barColor} relative z-[2]`}>
                  {isDone ? "✓" : count}
                </div>
                <div className={`text-[10px] mt-2 leading-[1.3] ${labelColor}`}>
                  {phase.shortLabel}
                </div>
                <div className={`text-[9px] mt-0.5 ${slaColor}`}>
                  {phase.sla}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {displayContractors.length === 0 && (
        <div className="bg-white border border-[#E5E5EA] rounded-xl p-8 text-center">
          <div className="text-[15px] font-semibold text-[#8E8E93]">No contractors registered for SMS yet</div>
          <div className="text-[12px] text-[#AEAEB2] mt-2">
            Start your test: go to the contractor dashboard → SMS Settings → "Set Up Business Number"
          </div>
        </div>
      )}

      <div className="text-center py-6 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · SMS Command Center · Live from Supabase
      </div>
    </div>
  );
}
