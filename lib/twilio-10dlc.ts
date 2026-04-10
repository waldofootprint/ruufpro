// 10DLC ISV Registration — automates the full brand + campaign registration
// flow for each contractor via Twilio's Trust Hub and Messaging APIs.
//
// Two paths: Sole Proprietor (no EIN, OTP required) and Standard (EIN required).
// Uses lazy Twilio client initialization (same pattern as lib/twilio.ts).

import { createServerSupabase } from "./supabase-server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RegistrationPath = "sole_proprietor" | "standard";

export type RegistrationStatus =
  | "not_started"
  | "profile_pending"      // Trust Hub profile submitted
  | "profile_approved"     // Trust Hub profile approved
  | "brand_pending"        // Brand submitted to TCR
  | "brand_otp_required"   // Sole prop — waiting for contractor to verify OTP
  | "brand_approved"       // Brand approved by TCR
  | "campaign_pending"     // Campaign submitted, waiting 10-15 biz days
  | "campaign_approved"    // Campaign approved — SMS is ACTIVE
  | "failed";              // Something failed — check error fields

interface ContractorRegistrationData {
  contractorId: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;            // business phone (E.164)
  mobilePhone?: string;     // personal mobile for OTP (sole prop only, E.164)
  street: string;
  city: string;
  state: string;            // 2-letter code
  zip: string;
  legalEntityType: "sole_proprietor" | "llc" | "corporation" | "partnership";
  ein?: string;             // required for standard path
  ssnLast4?: string;        // last 4 of SSN (sole prop only, passed to TCR, NOT stored)
  websiteUrl: string;       // their RuufPro site URL
}

interface RegistrationResult {
  success: boolean;
  status: RegistrationStatus;
  error?: string;
  brandRegistrationSid?: string;
  customerProfileSid?: string;
  trustProductSid?: string;
  messagingServiceSid?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Twilio Trust Hub policy SIDs (hardcoded by Twilio, never change)
const POLICY_SECONDARY_CUSTOMER_PROFILE = "RNdfbf3fae0e1107f8aded0e7cead80bf5";
const POLICY_SOLE_PROP_STARTER = "RN806dd6cd175f314e1f96a9727ee271f4";

// RuufPro's Primary Customer Profile SID (set after one-time ISV setup in Twilio Console)
const PRIMARY_PROFILE_SID = process.env.TWILIO_PRIMARY_PROFILE_SID || "";

// Webhook base URL
const WEBHOOK_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";

// ---------------------------------------------------------------------------
// Lazy Twilio client (same pattern as lib/twilio.ts)
// ---------------------------------------------------------------------------

let twilioClient: any = null;

async function getClient() {
  if (twilioClient) return twilioClient;
  const twilio = (await import("twilio")).default;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio credentials not configured");
  }
  twilioClient = twilio(sid, token);
  return twilioClient;
}

// ---------------------------------------------------------------------------
// Main entry point — starts the full registration flow
// ---------------------------------------------------------------------------

/**
 * Kicks off the 10DLC registration process for a contractor.
 * Determines sole prop vs standard path based on legalEntityType + EIN.
 * Runs steps 1-9 synchronously, then returns — remaining steps
 * (brand approval, campaign approval) happen via webhooks/polling.
 */
export async function startRegistration(
  data: ContractorRegistrationData
): Promise<RegistrationResult> {
  const isSoleProp = data.legalEntityType === "sole_proprietor" || !data.ein;
  const supabase = createServerSupabase();

  try {
    if (isSoleProp) {
      return await registerSoleProprietor(data, supabase);
    } else {
      return await registerStandardBrand(data, supabase);
    }
  } catch (err: any) {
    console.error("10DLC registration error:", err.message || err);

    // Save the failure to the database
    await supabase
      .from("sms_numbers")
      .upsert({
        contractor_id: data.contractorId,
        registration_status: "failed",
        registration_error: err.message || "Unknown error",
        updated_at: new Date().toISOString(),
      }, { onConflict: "contractor_id" });

    return { success: false, status: "failed", error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Sole Proprietor Path (no EIN, OTP verification)
// ---------------------------------------------------------------------------

async function registerSoleProprietor(
  data: ContractorRegistrationData,
  supabase: any
): Promise<RegistrationResult> {
  const client = await getClient();
  const mobilePhone = data.mobilePhone || data.phone;

  // Step 1: Create Starter Customer Profile
  const profile = await client.trusthub.v1.customerProfiles.create({
    friendlyName: `${data.businessName} Starter Profile`,
    email: process.env.RUUFPRO_COMPLIANCE_EMAIL || "compliance@ruufpro.com",
    policySid: POLICY_SOLE_PROP_STARTER,
    statusCallback: `${WEBHOOK_BASE}/api/sms/webhook/trusthub-status`,
  });

  // Step 2: Create EndUser — starter profile info
  const endUser = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.firstName} ${data.lastName}`,
    type: "starter_customer_profile_information",
    attributes: {
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phone,
      email: data.email,
    },
  });

  // Step 3: Create Supporting Document — address
  const addressDoc = await client.trusthub.v1.supportingDocuments.create({
    friendlyName: `${data.businessName} Address`,
    type: "customer_profile_address",
    attributes: {
      customer_name: data.businessName,
      street: data.street,
      city: data.city,
      region: data.state,
      postal_code: data.zip,
      iso_country: "US",
    },
  });

  // Step 4: Attach components to Starter Profile
  // Attach EndUser
  await client.trusthub.v1
    .customerProfiles(profile.sid)
    .customerProfilesEntityAssignments.create({ objectSid: endUser.sid });

  // Attach Address document
  await client.trusthub.v1
    .customerProfiles(profile.sid)
    .customerProfilesEntityAssignments.create({ objectSid: addressDoc.sid });

  // Attach Primary ISV Profile
  if (PRIMARY_PROFILE_SID) {
    await client.trusthub.v1
      .customerProfiles(profile.sid)
      .customerProfilesEntityAssignments.create({ objectSid: PRIMARY_PROFILE_SID });
  }

  // Step 5: Evaluate + Submit Starter Profile
  await client.trusthub.v1
    .customerProfiles(profile.sid)
    .customerProfilesEvaluations.create({ policySid: POLICY_SOLE_PROP_STARTER });

  await client.trusthub.v1.customerProfiles(profile.sid).update({
    status: "pending-review",
  });

  // Wait 30s for Twilio to process (per Twilio docs for sole prop flow)
  await delay(30000);

  // Step 6: Create Sole Proprietor A2P Trust Bundle
  const trustProduct = await client.trusthub.v1.trustProducts.create({
    friendlyName: `${data.businessName} A2P Profile`,
    email: process.env.RUUFPRO_COMPLIANCE_EMAIL || "compliance@ruufpro.com",
    policySid: POLICY_SOLE_PROP_STARTER,
    statusCallback: `${WEBHOOK_BASE}/api/sms/webhook/trusthub-status`,
  });

  // Step 7: Create EndUser — sole proprietor info
  const solePropEndUser = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.firstName} ${data.lastName} Sole Prop`,
    type: "sole_proprietor_information",
    attributes: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phone,
      mobile_phone_number: mobilePhone,
      brand_name: data.businessName,
      vertical: "CONSTRUCTION",
      ...(data.ssnLast4 ? { last_4_digits_ssn: data.ssnLast4 } : {}),
    },
  });

  // Step 8: Attach components to Trust Bundle
  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEntityAssignments.create({ objectSid: solePropEndUser.sid });

  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEntityAssignments.create({ objectSid: profile.sid });

  // Step 9: Evaluate + Submit Trust Bundle
  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEvaluations.create({ policySid: POLICY_SOLE_PROP_STARTER });

  await client.trusthub.v1.trustProducts(trustProduct.sid).update({
    status: "pending-review",
  });

  // Save progress to database — brand will be auto-created by Twilio,
  // OTP will be sent to the contractor's mobile phone
  await supabase
    .from("sms_numbers")
    .upsert({
      contractor_id: data.contractorId,
      registration_path: "sole_proprietor",
      registration_status: "brand_otp_required",
      customer_profile_sid: profile.sid,
      trust_product_sid: trustProduct.sid,
      updated_at: new Date().toISOString(),
    }, { onConflict: "contractor_id" });

  return {
    success: true,
    status: "brand_otp_required",
    customerProfileSid: profile.sid,
    trustProductSid: trustProduct.sid,
  };
}

// ---------------------------------------------------------------------------
// Standard Brand Path (EIN required)
// ---------------------------------------------------------------------------

async function registerStandardBrand(
  data: ContractorRegistrationData,
  supabase: any
): Promise<RegistrationResult> {
  const client = await getClient();

  // Map our entity types to Twilio's expected values
  const businessTypeMap: Record<string, string> = {
    llc: "LLC",
    corporation: "Corporation",
    partnership: "Partnership",
  };
  const twilioBusinessType = businessTypeMap[data.legalEntityType] || "LLC";

  // Step 1: Create Secondary Customer Profile
  const profile = await client.trusthub.v1.customerProfiles.create({
    friendlyName: `${data.businessName} Customer Profile`,
    email: process.env.RUUFPRO_COMPLIANCE_EMAIL || "compliance@ruufpro.com",
    policySid: POLICY_SECONDARY_CUSTOMER_PROFILE,
    statusCallback: `${WEBHOOK_BASE}/api/sms/webhook/trusthub-status`,
  });

  // Step 2: Create EndUser — business information
  const businessEndUser = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.businessName} Business Info`,
    type: "customer_profile_business_information",
    attributes: {
      business_name: data.businessName,
      business_identity: "direct_customer",
      business_type: twilioBusinessType,
      business_industry: "CONSTRUCTION",
      business_registration_identifier: "EIN",
      business_registration_number: data.ein,
      business_regions_of_operation: "USA_AND_CANADA",
      website_url: data.websiteUrl,
      social_media_profile_urls: "",
    },
  });

  // Step 3: Create EndUser — authorized representative 1
  const authRep1 = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.firstName} ${data.lastName} Auth Rep 1`,
    type: "authorized_representative_1",
    attributes: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      business_title: "Owner",
      job_position: "CEO",
      phone_number: data.phone,
    },
  });

  // Step 4: Create EndUser — authorized representative 2
  // For small contractors with one person, reuse same person with different title
  const authRep2 = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.firstName} ${data.lastName} Auth Rep 2`,
    type: "authorized_representative_2",
    attributes: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      business_title: "Manager",
      job_position: "Other",
      phone_number: data.phone,
    },
  });

  // Step 5: Create Address
  const address = await client.addresses.create({
    customerName: data.businessName,
    street: data.street,
    city: data.city,
    region: data.state,
    postalCode: data.zip,
    isoCountry: "US",
  });

  // Step 6: Create Supporting Document
  const supportDoc = await client.trusthub.v1.supportingDocuments.create({
    friendlyName: `${data.businessName} Address Doc`,
    type: "customer_profile_address",
    attributes: {
      address_sids: address.sid,
    },
  });

  // Step 7: Attach all components to Customer Profile
  const entitiesToAttach = [
    businessEndUser.sid,
    authRep1.sid,
    authRep2.sid,
    supportDoc.sid,
  ];

  // Attach ISV Primary Profile if configured
  if (PRIMARY_PROFILE_SID) {
    entitiesToAttach.push(PRIMARY_PROFILE_SID);
  }

  for (const objectSid of entitiesToAttach) {
    await client.trusthub.v1
      .customerProfiles(profile.sid)
      .customerProfilesEntityAssignments.create({ objectSid });
  }

  // Step 8: Evaluate Customer Profile
  const evaluation = await client.trusthub.v1
    .customerProfiles(profile.sid)
    .customerProfilesEvaluations.create({
      policySid: POLICY_SECONDARY_CUSTOMER_PROFILE,
    });

  if (evaluation.status === "noncompliant") {
    throw new Error(`Profile evaluation failed: ${JSON.stringify(evaluation.results)}`);
  }

  // Step 9: Submit Customer Profile
  await client.trusthub.v1.customerProfiles(profile.sid).update({
    status: "pending-review",
  });

  // Step 10: Create A2P Trust Product
  const trustProduct = await client.trusthub.v1.trustProducts.create({
    friendlyName: `${data.businessName} A2P Profile`,
    email: process.env.RUUFPRO_COMPLIANCE_EMAIL || "compliance@ruufpro.com",
    policySid: POLICY_SECONDARY_CUSTOMER_PROFILE,
    statusCallback: `${WEBHOOK_BASE}/api/sms/webhook/trusthub-status`,
  });

  // Step 11: Create A2P EndUser
  const a2pEndUser = await client.trusthub.v1.endUsers.create({
    friendlyName: `${data.businessName} A2P Info`,
    type: "us_a2p_messaging_profile_information",
    attributes: {
      company_type: "private",
      skip_automatic_sec_vet: true,
    },
  });

  // Step 12: Attach to Trust Product
  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEntityAssignments.create({ objectSid: a2pEndUser.sid });

  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEntityAssignments.create({ objectSid: profile.sid });

  // Step 13: Evaluate + Submit Trust Product
  await client.trusthub.v1
    .trustProducts(trustProduct.sid)
    .trustProductsEvaluations.create({
      policySid: POLICY_SECONDARY_CUSTOMER_PROFILE,
    });

  await client.trusthub.v1.trustProducts(trustProduct.sid).update({
    status: "pending-review",
  });

  // Save progress — wait for Trust Hub approval via webhook
  await supabase
    .from("sms_numbers")
    .upsert({
      contractor_id: data.contractorId,
      registration_path: "standard",
      registration_status: "profile_pending",
      customer_profile_sid: profile.sid,
      trust_product_sid: trustProduct.sid,
      updated_at: new Date().toISOString(),
    }, { onConflict: "contractor_id" });

  return {
    success: true,
    status: "profile_pending",
    customerProfileSid: profile.sid,
    trustProductSid: trustProduct.sid,
  };
}

// ---------------------------------------------------------------------------
// Post-approval steps — called by webhook or polling cron
// ---------------------------------------------------------------------------

/**
 * Called when Trust Hub bundles are approved.
 * Registers the brand with TCR.
 */
export async function registerBrand(contractorId: string): Promise<RegistrationResult> {
  const client = await getClient();
  const supabase = createServerSupabase();

  // Get stored SIDs from database
  const { data: record, error } = await supabase
    .from("sms_numbers")
    .select("*")
    .eq("contractor_id", contractorId)
    .single();

  if (error || !record) {
    return { success: false, status: "failed", error: "No registration record found" };
  }

  const isSoleProp = record.registration_path === "sole_proprietor";

  const brand = await client.messaging.v1.brandRegistrations.create({
    customerProfileBundleSid: record.customer_profile_sid,
    a2PProfileBundleSid: record.trust_product_sid,
    brandType: isSoleProp ? "SOLE_PROPRIETOR" : "STANDARD",
    skipAutomaticSecVet: true,
    mock: false,
  });

  await supabase
    .from("sms_numbers")
    .update({
      brand_registration_sid: brand.sid,
      registration_status: isSoleProp ? "brand_otp_required" : "brand_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  return {
    success: true,
    status: isSoleProp ? "brand_otp_required" : "brand_pending",
    brandRegistrationSid: brand.sid,
  };
}

/**
 * Called when brand is approved.
 * Creates Messaging Service, buys local number, registers campaign.
 */
export async function completeCampaignRegistration(
  contractorId: string
): Promise<RegistrationResult> {
  const client = await getClient();
  const supabase = createServerSupabase();

  const { data: record, error } = await supabase
    .from("sms_numbers")
    .select("*, contractors!inner(business_name, phone, city, state, google_review_url)")
    .eq("contractor_id", contractorId)
    .single();

  if (error || !record) {
    return { success: false, status: "failed", error: "No registration record found" };
  }

  const contractor = record.contractors;
  const isSoleProp = record.registration_path === "sole_proprietor";

  // Create Messaging Service
  const messagingService = await client.messaging.v1.services.create({
    friendlyName: `${contractor.business_name} SMS`.slice(0, 64),
    inboundRequestUrl: `${WEBHOOK_BASE}/api/sms/webhook`,
    statusCallback: `${WEBHOOK_BASE}/api/sms/webhook/delivery-status`,
    stickySender: true,
    useInboundWebhookOnNumber: false,
  });

  // Buy local number — try contractor's area code first, then fall back
  const areaCode = extractAreaCode(contractor.phone);
  const available = await findAvailableNumber(client, areaCode, contractor.state);

  if (!available) {
    throw new Error(`No numbers available in area code ${areaCode} or state ${contractor.state}. Contact support.`);
  }

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available.phoneNumber,
    friendlyName: `${contractor.business_name} 10DLC`,
    smsMethod: "POST",
    smsUrl: `${WEBHOOK_BASE}/api/sms/webhook`,
    voiceMethod: "POST",
    voiceUrl: `${WEBHOOK_BASE}/api/sms/voice-webhook`,
  });

  // Add number to Messaging Service
  await client.messaging.v1
    .services(messagingService.sid)
    .phoneNumbers.create({ phoneNumberSid: purchased.sid });

  // Register campaign
  // LOW_VOLUME_MIXED gives best deliverability for both sole props and LLCs
  // SOLE_PROPRIETOR is the brand type, not campaign type
  const campaignUseCase = "LOW_VOLUME_MIXED";

  // A2P Wizard compliance website — must be set before campaign registration
  const complianceUrl = record.compliance_website_url;
  if (!complianceUrl) {
    return {
      success: false,
      status: "failed",
      error: "Missing compliance website URL. Run A2P Wizard for this contractor first, then paste the URL in SMS settings.",
    };
  }
  const privacyUrl = `${complianceUrl}/privacy`;
  const termsUrl = `${complianceUrl}/terms`;

  const campaign = await client.messaging.v1
    .services(messagingService.sid)
    .usAppToPerson.create({
      brandRegistrationSid: record.brand_registration_sid,
      description: `${contractor.business_name} sends non-promotional SMS messages to customers regarding inspection results, project milestones, and estimate follow-ups. Customers may also optionally opt in to receive promotional notifications, including roof care tips, upgrade options, and protection plans. Promotional messages are only sent to users who provide separate, explicit consent via an online form. Message frequency varies, up to 4 messages per month. Message & data rates may apply. Recipients can reply STOP to opt out at any time. Users can review our Privacy Policy at ${privacyUrl} and Terms of Service at ${termsUrl} .`,
      messageSamples: [
        `Hi {FirstName}, this is {RepName} from ${contractor.business_name}. Thank you for reaching out to us! We received your inquiry and a team member will be in touch within the next 24 hours. Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`,
        `Hi {FirstName}, thanks for choosing ${contractor.business_name}! We'd love your feedback on our work. Share your experience here: {ReviewLink}. Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`,
        `Hi {FirstName}, sorry we missed your call! This is ${contractor.business_name}. We'll get back to you shortly. Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`,
        `Hi {FirstName}, this is ${contractor.business_name}. Just following up on your roofing estimate. Have any questions? We're happy to help. Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.`,
      ],
      usAppToPersonUsecase: campaignUseCase,
      messageFlow: `Users opt in by submitting their mobile phone number and actively selecting one or both unchecked consent checkboxes on the contact form at ${complianceUrl}. Each checkbox clearly describes the category of messages the user will receive (non-promotional or promotional). Consent is optional and not required to use the service. After submitting the form and selecting consent, users receive a confirmation SMS message. Please refer to ${complianceUrl} for the most up-to-date version of the business website and opt-in form.`,
      hasEmbeddedLinks: true,
      hasEmbeddedPhone: false,
      subscriberOptIn: true,
      ageGated: false,
      directLending: false,
      optInKeywords: ["START", "YES"],
      optOutKeywords: ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"],
      helpKeywords: ["HELP", "INFO"],
      optOutMessage: `You have been unsubscribed from ${contractor.business_name} messages. You will no longer receive texts. Reply HELP for help.`,
      helpMessage: `${contractor.business_name}: For help, call ${contractor.phone}. Reply STOP to unsubscribe.`,
    });

  // Save everything to database
  await supabase
    .from("sms_numbers")
    .update({
      phone_number: purchased.phoneNumber,
      twilio_sid: purchased.sid,
      messaging_service_sid: messagingService.sid,
      campaign_sid: campaign.sid,
      registration_status: "campaign_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  return {
    success: true,
    status: "campaign_pending",
    messagingServiceSid: messagingService.sid,
  };
}

/**
 * Called when campaign is approved (via webhook or polling).
 * Activates SMS for the contractor.
 */
export async function activateSMS(contractorId: string): Promise<void> {
  const supabase = createServerSupabase();

  // Get the provisioned phone number so we can sync it to the contractors table
  const { data: smsNumber } = await supabase
    .from("sms_numbers")
    .select("phone_number")
    .eq("contractor_id", contractorId)
    .single();

  await supabase
    .from("sms_numbers")
    .update({
      status: "active",
      registration_status: "campaign_approved",
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  // Sync twilio_number + sms_enabled to contractors table.
  // Without twilio_number, inbound SMS webhooks can't match this contractor,
  // which means STOP keywords silently fail (TCPA compliance risk).
  await supabase
    .from("contractors")
    .update({
      sms_enabled: true,
      twilio_number: smsNumber?.phone_number || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractorId);

  // Send activation email to the contractor so they know SMS is live
  try {
    const { data: contractor } = await supabase
      .from("contractors")
      .select("email, business_name")
      .eq("id", contractorId)
      .single();

    if (contractor?.email) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const phoneDisplay = smsNumber?.phone_number
        ? smsNumber.phone_number.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")
        : "your new number";

      await resend.emails.send({
        from: "RuufPro <noreply@ruufpro.com>",
        to: contractor.email,
        subject: `🎉 Your business number is live — ${phoneDisplay}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 12px;">Your SMS is live!</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Great news — your dedicated business number <strong>${phoneDisplay}</strong> has been approved and activated for ${contractor.business_name}.
            </p>
            <p style="font-size:15px;line-height:1.6;margin:0 0 8px;font-weight:600;">Here's what's now active:</p>
            <ul style="color:#6b7280;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 20px;">
              <li><strong>Lead auto-response</strong> — instant text when a homeowner submits a form</li>
              <li><strong>Missed-call text-back</strong> — automatic text when you miss a call</li>
              <li><strong>Review requests</strong> — one-tap SMS asking customers for Google reviews</li>
            </ul>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
              No setup needed — everything runs automatically. You can manage settings in your dashboard.
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/sms"
               style="display:inline-block;background:#1D1D1F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
              View SMS Dashboard →
            </a>
            <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:24px;">RuufPro · Your leads, faster.</p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    // Don't let email failure block activation — SMS is already live
    console.error("Activation email failed (non-blocking):", emailErr);
  }

  // Alert Hannah in Slack + email that a contractor just went live
  try {
    const { sendAlert } = await import("@/lib/alerts");
    await sendAlert({
      title: "SMS activated",
      message: `Contractor ${contractorId} is now live with number ${smsNumber?.phone_number || "unknown"}`,
      severity: "info",
    });
  } catch {
    // Non-blocking
  }

  console.log(`SMS activated for contractor ${contractorId} — number: ${smsNumber?.phone_number || "unknown"}`);
}

// ---------------------------------------------------------------------------
// Status checking — used by polling cron as backup for webhooks
// ---------------------------------------------------------------------------

/**
 * Checks registration status for all contractors with pending registrations
 * and advances them to the next step if approved.
 * Called by /api/cron/check-10dlc-status (Vercel Cron, daily).
 */
export async function checkAllPendingRegistrations(): Promise<void> {
  const client = await getClient();
  const supabase = createServerSupabase();

  const { data: pending } = await supabase
    .from("sms_numbers")
    .select("*")
    .in("registration_status", [
      "profile_pending",
      "brand_pending",
      "brand_otp_required",
      "brand_approved",
      "campaign_pending",
    ]);

  if (!pending || pending.length === 0) return;

  for (const record of pending) {
    try {
      if (record.registration_status === "profile_pending" && record.customer_profile_sid) {
        const profile = await client.trusthub.v1
          .customerProfiles(record.customer_profile_sid)
          .fetch();

        if (profile.status === "twilio-approved") {
          await registerBrand(record.contractor_id);
        }
      }

      if (
        (record.registration_status === "brand_pending" ||
          record.registration_status === "brand_otp_required") &&
        record.brand_registration_sid
      ) {
        const brand = await client.messaging.v1
          .brandRegistrations(record.brand_registration_sid)
          .fetch();

        if (brand.status === "APPROVED") {
          // Check if compliance URL is set before attempting campaign registration
          if (!record.compliance_website_url) {
            // Notify admin — A2P Wizard submission needed for this contractor
            await notifyA2PWizardNeeded(record.contractor_id, supabase);
            // Update status so we know brand is approved but waiting on compliance URL
            await supabase
              .from("sms_numbers")
              .update({ registration_status: "brand_approved" })
              .eq("contractor_id", record.contractor_id);
          } else {
            await completeCampaignRegistration(record.contractor_id);
          }
        }
      }

      // Brand approved but waiting on compliance URL — retry if URL was added
      if (record.registration_status === "brand_approved") {
        if (record.compliance_website_url) {
          await completeCampaignRegistration(record.contractor_id);
        }
        // If still no URL, do nothing — Hannah will get notified again next check
      }

      if (record.registration_status === "campaign_pending" && record.campaign_sid && record.messaging_service_sid) {
        const campaigns = await client.messaging.v1
          .services(record.messaging_service_sid)
          .usAppToPerson(record.campaign_sid)
          .fetch();

        if (campaigns.campaignStatus === "VERIFIED") {
          await activateSMS(record.contractor_id);
        }
      }
    } catch (err: any) {
      console.error(`10DLC status check failed for ${record.contractor_id}:`, err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// OTP retry — for sole proprietors who missed the verification text
// ---------------------------------------------------------------------------

/**
 * Retriggers the OTP verification SMS for a sole proprietor.
 * Called from the dashboard when contractor clicks "Resend verification code."
 */
export async function resendOTP(contractorId: string): Promise<{ success: boolean; error?: string }> {
  const client = await getClient();
  const supabase = createServerSupabase();

  const { data: record } = await supabase
    .from("sms_numbers")
    .select("brand_registration_sid")
    .eq("contractor_id", contractorId)
    .single();

  if (!record?.brand_registration_sid) {
    return { success: false, error: "No brand registration found" };
  }

  try {
    await client.messaging.v1
      .brandRegistrations(record.brand_registration_sid)
      .brandRegistrationOtps.create();

    // Track when OTP was sent for rate limiting
    await supabase
      .from("sms_numbers")
      .update({ last_otp_sent_at: new Date().toISOString() })
      .eq("contractor_id", contractorId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Notify admin (Hannah) that a contractor's brand was approved and needs
 * an A2P Wizard compliance website before campaign registration can proceed.
 */
async function notifyA2PWizardNeeded(
  contractorId: string,
  supabase: ReturnType<typeof createServerSupabase>
): Promise<void> {
  const { data: contractor } = await supabase
    .from("contractors")
    .select("business_name, email, city, state")
    .eq("id", contractorId)
    .single();

  if (!contractor) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: "admin@getruufpro.com",
      subject: `A2P Wizard needed: ${contractor.business_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Brand Approved — A2P Wizard Needed</h2>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            <strong>${contractor.business_name}</strong> (${contractor.city}, ${contractor.state}) just got their brand approved by TCR.
          </p>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Before their campaign can be registered, you need to:
          </p>
          <ol style="font-size: 15px; color: #374151; line-height: 1.8;">
            <li>Go to <a href="https://www.a2pwizard.com" style="color: #2563eb;">A2P Wizard</a></li>
            <li>Generate a compliance website for <strong>${contractor.business_name}</strong></li>
            <li>Paste the compliance URL into their SMS settings in the dashboard</li>
          </ol>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Once the URL is saved, the system will automatically submit their campaign registration on the next daily check.
          </p>
          <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">
            Contractor ID: ${contractorId}
          </p>
        </div>
      `,
    });

    console.log(`A2P Wizard notification sent for ${contractor.business_name}`);
  } catch (err: any) {
    console.error(`Failed to send A2P Wizard notification for ${contractorId}:`, err.message);
  }
}

/**
 * Try to find an available local number — falls back through:
 * 1. Contractor's area code (ideal — matches their business phone)
 * 2. Same state, any area code
 * 3. Any US local number
 */
async function findAvailableNumber(
  client: any,
  areaCode: string,
  state: string
): Promise<{ phoneNumber: string } | null> {
  // Attempt 1: exact area code
  if (areaCode) {
    const exact = await client.availablePhoneNumbers("US").local.list({
      areaCode,
      smsEnabled: true,
      voiceEnabled: true,
      limit: 1,
    });
    if (exact && exact.length > 0) return exact[0];
  }

  // Attempt 2: same state
  if (state) {
    const sameState = await client.availablePhoneNumbers("US").local.list({
      inRegion: state,
      smsEnabled: true,
      voiceEnabled: true,
      limit: 1,
    });
    if (sameState && sameState.length > 0) return sameState[0];
  }

  // Attempt 3: any US number
  const anyUS = await client.availablePhoneNumbers("US").local.list({
    smsEnabled: true,
    voiceEnabled: true,
    limit: 1,
  });
  if (anyUS && anyUS.length > 0) return anyUS[0];

  return null;
}

function extractAreaCode(phone: string): string {
  // Remove +1 prefix and grab first 3 digits
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return cleaned.slice(1, 4);
  }
  return cleaned.slice(0, 3);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
