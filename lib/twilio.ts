// Twilio SMS wrapper — handles sending texts, number provisioning, and opt-out management.
// Uses lazy initialization so the Twilio client is only created when needed
// (importing at the top level crashes Vercel builds).

import { NextRequest } from "next/server";
import { createServerSupabase } from "./supabase-server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageType =
  | "review_request"
  | "missed_call_textback"
  | "lead_notification"
  | "lead_auto_response"
  | "general";

interface SendSMSParams {
  to: string;
  from: string;
  body: string;
  contractorId?: string;
  leadId?: string;
  messageType: MessageType;
}

interface SendSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

interface SMSNumber {
  id: string;
  contractor_id: string;
  phone_number: string;
  status: "active" | "pending_registration" | "released";
}

// ---------------------------------------------------------------------------
// Lazy Twilio client — only created once, only when first needed
// ---------------------------------------------------------------------------

let twilioClient: any = null;

async function getOrCreateTwilioClient() {
  if (twilioClient) return twilioClient;

  // Dynamic import so the twilio package is never loaded at build time
  const twilio = (await import("twilio")).default;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env");
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

// ---------------------------------------------------------------------------
// Webhook signature validation — prevents forged requests to public endpoints
// ---------------------------------------------------------------------------

/**
 * Validate that a webhook request actually came from Twilio.
 * Uses Twilio's request signing — checks the x-twilio-signature header
 * against a hash of the auth token + URL + params.
 *
 * On Vercel, we reconstruct the public URL from x-forwarded-proto/host
 * since request.url contains the internal hostname.
 *
 * Skips validation in development so local testing works without ngrok.
 */
export async function validateTwilioWebhook(
  request: NextRequest,
  params: Record<string, string>
): Promise<boolean> {
  if (process.env.NODE_ENV === "development") {
    console.warn("Twilio webhook validation skipped in development");
    return true;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not set — cannot validate webhook");
    return false;
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) {
    console.warn("Twilio webhook: missing x-twilio-signature header");
    return false;
  }

  // Reconstruct the URL Twilio actually called (Vercel proxy rewrites it)
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const url = `${proto}://${host}${request.nextUrl.pathname}`;

  const twilio = await import("twilio");
  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Parse FormData into a plain Record<string, string> for Twilio validation.
 * Twilio sends URL-encoded form data — we need a flat object.
 */
export function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  return params;
}

// ---------------------------------------------------------------------------
// sendSMS — the main function everything else calls
// ---------------------------------------------------------------------------

/**
 * Send an SMS message via Twilio.
 * Checks opt-outs first, sends the message, then logs it to sms_messages.
 */
export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { to, from, body, contractorId, leadId, messageType } = params;
  const supabase = createServerSupabase();

  // If we know which contractor this is for, respect opt-outs
  if (contractorId) {
    const optedOut = await isOptedOut(to, contractorId);
    if (optedOut) {
      console.log(`SMS skipped — ${to} opted out for contractor ${contractorId}`);
      return { success: true, messageSid: undefined, error: "opted_out" };
    }
  }

  try {
    const client = await getOrCreateTwilioClient();

    // statusCallback tells Twilio to POST delivery updates (sent/delivered/failed)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";
    const message = await client.messages.create({
      to,
      from,
      body,
      statusCallback: `${siteUrl}/api/sms/status-callback`,
    });

    // Log the message to our database for tracking
    await supabase.from("sms_messages").insert({
      twilio_sid: message.sid,
      contractor_id: contractorId || null,
      lead_id: leadId || null,
      to_number: to,
      from_number: from,
      body,
      message_type: messageType,
      status: message.status,
      sent_at: new Date().toISOString(),
    });

    console.log(`SMS sent to ${to} — SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (err: any) {
    console.error("Twilio sendSMS error:", err.message || err);
    return { success: false, error: err.message || "Unknown Twilio error" };
  }
}

// ---------------------------------------------------------------------------
// getContractorNumber — figure out which phone number to send from
// ---------------------------------------------------------------------------

/**
 * Returns the phone number to use for a contractor's outbound SMS.
 * - Active dedicated 10DLC number → use it
 * - Pending 10DLC registration → return null (SMS not yet available)
 * - No record → return null (SMS not provisioned for this contractor)
 *
 * No toll-free fallback — we use 10DLC per contractor only.
 * Contractors wait 5-15 business days for campaign approval after signup.
 */
export async function getContractorNumber(contractorId: string): Promise<string | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("sms_numbers")
    .select("phone_number, status")
    .eq("contractor_id", contractorId)
    .single();

  if (error || !data) {
    return null;
  }

  const record = data as SMSNumber;

  if (record.status === "active") {
    return record.phone_number;
  }

  // pending_registration or released — SMS not available yet
  return null;
}

// ---------------------------------------------------------------------------
// provisionNumber — buy a local number for a contractor
// ---------------------------------------------------------------------------

/**
 * Search Twilio for an available local number in the given area code,
 * buy it, and save it to sms_numbers with status 'pending_registration'.
 */
export async function provisionNumber(
  contractorId: string,
  areaCode: string
): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
  try {
    const client = await getOrCreateTwilioClient();
    const supabase = createServerSupabase();

    // Search for available local numbers in the requested area code
    const available = await client.availablePhoneNumbers("US").local.list({
      areaCode,
      smsEnabled: true,
      limit: 1,
    });

    if (!available || available.length === 0) {
      return { success: false, error: `No numbers available in area code ${areaCode}` };
    }

    const numberToBuy = available[0].phoneNumber;

    // Purchase the number
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: numberToBuy,
      smsMethod: "POST",
      // The webhook URL will be configured once we build the inbound SMS handler
      // smsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/inbound`,
    });

    // Save to our database
    const { error: dbError } = await supabase.from("sms_numbers").insert({
      contractor_id: contractorId,
      phone_number: purchased.phoneNumber,
      twilio_sid: purchased.sid,
      status: "pending_registration",
      provisioned_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to save provisioned number to DB:", dbError);
      // The number is bought but DB insert failed — log it so we can fix manually
    }

    console.log(`Provisioned ${purchased.phoneNumber} for contractor ${contractorId}`);
    return { success: true, phoneNumber: purchased.phoneNumber };
  } catch (err: any) {
    console.error("provisionNumber error:", err.message || err);
    return { success: false, error: err.message || "Failed to provision number" };
  }
}

// ---------------------------------------------------------------------------
// Opt-out management — TCPA compliance
// ---------------------------------------------------------------------------

/**
 * Record that a phone number has opted out of SMS from a specific contractor.
 * This is required for TCPA compliance when someone replies STOP.
 */
export async function handleOptOut(
  phoneNumber: string,
  contractorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabase();

  const { error } = await supabase.from("sms_opt_outs").insert({
    phone_number: phoneNumber,
    contractor_id: contractorId,
    opted_out_at: new Date().toISOString(),
  });

  if (error) {
    // If it's a duplicate, that's fine — they're already opted out
    if (error.code === "23505") {
      return { success: true };
    }
    console.error("handleOptOut error:", error);
    return { success: false, error: error.message };
  }

  console.log(`Opt-out recorded: ${phoneNumber} for contractor ${contractorId}`);
  return { success: true };
}

/**
 * Check if a phone number has opted out of SMS from a specific contractor.
 */
export async function isOptedOut(
  phoneNumber: string,
  contractorId: string
): Promise<boolean> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("sms_opt_outs")
    .select("id")
    .eq("phone_number", phoneNumber)
    .eq("contractor_id", contractorId)
    .limit(1);

  if (error) {
    console.error("isOptedOut check FAILED — blocking SMS to be safe:", error);
    // Fail closed: if we can't verify opt-out status, do NOT send.
    // TCPA violation risk is worse than a missed message.
    return true;
  }

  return (data?.length ?? 0) > 0;
}
