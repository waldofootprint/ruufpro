// High-level SMS workflows — these are the functions you call from API routes.
// Each one handles the full flow: look up data, build the message, send it, log it.

import { nanoid } from "nanoid";
import { createServerSupabase } from "./supabase-server";
import { sendSMS, getContractorNumber } from "./twilio";

// ---------------------------------------------------------------------------
// sendReviewRequest — asks a customer to leave a Google review after a job
// ---------------------------------------------------------------------------

/**
 * Send a review request SMS to a lead after their job is done.
 * Looks up the lead and contractor, builds a tracked review link,
 * sends the text, and logs it in review_requests.
 */
export async function sendReviewRequest(
  contractorId: string,
  leadId: string
): Promise<{ success: boolean; reviewRequestId?: string; error?: string }> {
  const supabase = createServerSupabase();

  // Look up the lead's contact info
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("name, phone")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead not found" };
  }

  if (!lead.phone) {
    return { success: false, error: "Lead has no phone number" };
  }

  // Look up the contractor's business name and Google review URL
  const { data: contractor, error: contractorError } = await supabase
    .from("contractors")
    .select("business_name, google_review_url")
    .eq("id", contractorId)
    .single();

  if (contractorError || !contractor) {
    return { success: false, error: "Contractor not found" };
  }

  // Figure out which phone number to send from
  const fromNumber = await getContractorNumber(contractorId);
  if (!fromNumber) {
    return { success: false, error: "SMS not provisioned for this contractor" };
  }

  // Generate a unique tracking token so we can track clicks
  const trackingToken = nanoid(12);

  // Build the tracked review URL — this route will redirect to Google Reviews
  // and record the click in our database
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";
  const reviewUrl = `${siteUrl}/api/reviews/track/${trackingToken}`;

  // Build the SMS body — keep it short and friendly
  const firstName = lead.name.split(" ")[0]; // Use first name only
  const smsBody =
    `Hi ${firstName}, thanks for choosing ${contractor.business_name}! ` +
    `We'd love your feedback on our work. Share your experience here:\n\n` +
    `${reviewUrl}\n\n` +
    `Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`;

  // Send it
  const smsResult = await sendSMS({
    to: lead.phone,
    from: fromNumber,
    body: smsBody,
    contractorId,
    leadId,
    messageType: "review_request",
  });

  if (!smsResult.success) {
    return { success: false, error: smsResult.error };
  }

  // Look up the sms_messages record by Twilio SID to get our DB UUID
  let smsMessageId: string | null = null;
  if (smsResult.messageSid) {
    const { data: smsMsg } = await supabase
      .from("sms_messages")
      .select("id")
      .eq("twilio_message_sid", smsResult.messageSid)
      .single();
    smsMessageId = smsMsg?.id || null;
  }

  // Log the review request in our database for tracking
  const { data: reviewRequest, error: insertError } = await supabase
    .from("review_requests")
    .insert({
      contractor_id: contractorId,
      lead_id: leadId,
      tracking_token: trackingToken,
      google_review_url: contractor.google_review_url,
      sms_message_id: smsMessageId,
      channel: "sms",
      status: "sms_sent",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to log review request:", insertError);
    // SMS was sent successfully even if logging failed
    return { success: true, error: "SMS sent but failed to log review request" };
  }

  return { success: true, reviewRequestId: reviewRequest.id };
}

// ---------------------------------------------------------------------------
// sendMissedCallTextback — auto-reply when a contractor misses a call
// ---------------------------------------------------------------------------

/**
 * Send a friendly text to someone who called but didn't get through.
 * Tries to match the caller to an existing lead in the database.
 */
export async function sendMissedCallTextback(
  contractorId: string,
  callerPhone: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabase();

  // Look up the contractor's business name
  const { data: contractor, error: contractorError } = await supabase
    .from("contractors")
    .select("business_name")
    .eq("id", contractorId)
    .single();

  if (contractorError || !contractor) {
    return { success: false, error: "Contractor not found" };
  }

  // Get the sending number
  const fromNumber = await getContractorNumber(contractorId);
  if (!fromNumber) {
    return { success: false, error: "SMS not provisioned for this contractor" };
  }

  // Build a friendly missed-call message
  const smsBody =
    `Hey, this is ${contractor.business_name} — sorry I missed your call! ` +
    `I'm on a job right now. Can I call you back within the hour? ` +
    `Or reply here with what you need.\n\n` +
    `Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`;

  // Try to match the caller to an existing lead (by phone number)
  const { data: matchedLead } = await supabase
    .from("leads")
    .select("id")
    .eq("contractor_id", contractorId)
    .eq("phone", callerPhone)
    .limit(1)
    .single();

  const smsResult = await sendSMS({
    to: callerPhone,
    from: fromNumber,
    body: smsBody,
    contractorId,
    leadId: matchedLead?.id || undefined,
    messageType: "missed_call_textback",
  });

  if (!smsResult.success) {
    return { success: false, error: smsResult.error };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// sendLeadAutoResponse — instant SMS when a homeowner submits a contact form
// ---------------------------------------------------------------------------

/**
 * Send an immediate auto-response SMS when a lead comes in via contact form.
 * Research: 5-min response = 391% higher qualification. First to respond = 238%
 * more likely to win. This fires in <10 seconds — before any human sees the lead.
 *
 * Only sends if:
 * - Lead provided a phone number
 * - Contractor has SMS enabled + a provisioned number
 * - Phone isn't in the opt-out list
 */
export async function sendLeadAutoResponse(
  contractorId: string,
  leadPhone: string,
  leadName: string,
  estimate?: { estimateLow: number | null; estimateHigh: number | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabase();

  // Look up the contractor
  const { data: contractor, error: contractorError } = await supabase
    .from("contractors")
    .select("business_name, sms_enabled")
    .eq("id", contractorId)
    .single();

  if (contractorError || !contractor) {
    return { success: false, error: "Contractor not found" };
  }

  if (!contractor.sms_enabled) {
    return { success: false, error: "SMS not enabled for this contractor" };
  }

  // Get the sending number
  const fromNumber = await getContractorNumber(contractorId);
  if (!fromNumber) {
    return { success: false, error: "SMS not provisioned for this contractor" };
  }

  // Check opt-out list
  const { data: optOut } = await supabase
    .from("sms_opt_outs")
    .select("id")
    .eq("phone", leadPhone)
    .eq("contractor_id", contractorId)
    .limit(1)
    .single();

  if (optOut) {
    return { success: false, error: "Phone number has opted out" };
  }

  // Try to match to an existing lead and check SMS consent
  const { data: matchedLead } = await supabase
    .from("leads")
    .select("id, sms_consent, living_estimate_id")
    .eq("contractor_id", contractorId)
    .eq("phone", leadPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Look up living estimate link if available
  let estimateLink: string | null = null;
  if (matchedLead?.living_estimate_id) {
    const { data: le } = await supabase
      .from("living_estimates")
      .select("share_token")
      .eq("id", matchedLead.living_estimate_id)
      .single();
    if (le?.share_token) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";
      estimateLink = `${siteUrl}/estimate/${le.share_token}`;
    }
  }

  // Build the auto-response — includes estimate link + price range when available
  const firstName = leadName.split(" ")[0];
  const hasEstimate = estimate?.estimateLow && estimate?.estimateHigh;
  const priceRange = hasEstimate
    ? `$${Math.round(estimate.estimateLow!).toLocaleString()}–$${Math.round(estimate.estimateHigh!).toLocaleString()}`
    : null;

  let smsBody: string;
  if (estimateLink && priceRange) {
    smsBody =
      `Hi ${firstName}! This is ${contractor.business_name}. Your estimate is ready — ` +
      `${priceRange} for your roof.\n\n` +
      `View your full estimate here: ${estimateLink}\n\n` +
      `We'll call you shortly to discuss. Reply here if you need us sooner!`;
  } else if (estimateLink) {
    smsBody =
      `Hi ${firstName}! This is ${contractor.business_name}. Your estimate is ready!\n\n` +
      `View it here: ${estimateLink}\n\n` +
      `We'll call you shortly to discuss. Reply here if you need us sooner!`;
  } else {
    smsBody =
      `Hi ${firstName}! This is ${contractor.business_name} — we just got your request and will call you shortly. ` +
      `If you need us sooner, reply here or call us back. Talk soon!`;
  }
  smsBody += `\n\nReply STOP to opt out or HELP for assistance. Msg & data rates may apply.`;

  // TCPA: only send auto-response if lead explicitly consented to SMS
  if (!matchedLead?.sms_consent) {
    console.log(`Lead auto-response skipped — no SMS consent for ${leadPhone}`);
    return { success: false, error: "No SMS consent" };
  }

  const smsResult = await sendSMS({
    to: leadPhone,
    from: fromNumber,
    body: smsBody,
    contractorId,
    leadId: matchedLead?.id || undefined,
    messageType: "lead_auto_response",
  });

  if (!smsResult.success) {
    return { success: false, error: smsResult.error };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// scheduleReviewEmailFollowup — send email if they didn't click the SMS link
// ---------------------------------------------------------------------------

/**
 * Placeholder for a cron/scheduled function that follows up on review requests.
 * Checks if the SMS review link was never clicked after 3 days,
 * then sends a follow-up email via Resend.
 *
 * This will be called by a Vercel cron job or scheduled function.
 */
export async function scheduleReviewEmailFollowup(
  reviewRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabase();

  // Look up the review request
  const { data: request, error: reqError } = await supabase
    .from("review_requests")
    .select("*, leads(name, email), contractors(business_name, google_review_url)")
    .eq("id", reviewRequestId)
    .single();

  if (reqError || !request) {
    return { success: false, error: "Review request not found" };
  }

  // Only follow up if: status is still 'sms_sent', no click recorded, and 3+ days old
  if (request.status !== "sms_sent") {
    return { success: false, error: "Review request already actioned" };
  }

  if (request.clicked_at) {
    return { success: false, error: "Link was already clicked" };
  }

  const sentAt = new Date(request.sent_at);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  if (sentAt > threeDaysAgo) {
    return { success: false, error: "Too soon — wait at least 3 days after SMS" };
  }

  // Make sure we have a lead email to send to
  const lead = request.leads as any;
  const contractor = request.contractors as any;

  if (!lead?.email) {
    return { success: false, error: "Lead has no email address" };
  }

  // Send the follow-up email via Resend
  // Using dynamic import so this file doesn't force-load Resend at build time
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const firstName = lead.name?.split(" ")[0] || "there";

  try {
    const { error: emailError } = await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: lead.email,
      subject: `How was your experience with ${contractor.business_name}?`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 16px; color: #111827; line-height: 1.6;">
            Hi ${firstName},
          </p>
          <p style="font-size: 16px; color: #111827; line-height: 1.6;">
            We hope your recent work with <strong>${contractor.business_name}</strong> went well!
            If you have a minute, a quick review would really help them out.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${request.google_review_url}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Leave a Review
            </a>
          </div>
          <p style="font-size: 13px; color: #9ca3af; text-align: center;">
            Sent by RuufPro on behalf of ${contractor.business_name}
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Review follow-up email error:", emailError);
      return { success: false, error: "Email send failed" };
    }
  } catch (err: any) {
    console.error("Review follow-up email caught error:", err);
    return { success: false, error: err.message || "Email send failed" };
  }

  // Update the review request record
  await supabase
    .from("review_requests")
    .update({
      status: "email_sent",
      email_followup_sent_at: new Date().toISOString(),
    })
    .eq("id", reviewRequestId);

  console.log(`Review email follow-up sent for request ${reviewRequestId}`);
  return { success: true };
}
