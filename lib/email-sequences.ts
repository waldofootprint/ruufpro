// Email sequence engine — schedules and sends onboarding + upsell emails.
// Called by: (1) handlePublish to kick off onboarding, (2) cron to send pending emails.

import { createServerSupabase } from "@/lib/supabase-server";
import { Resend } from "resend";
import {
  ONBOARDING_EMAILS,
  UPSELL_EMAILS,
  type EmailData,
  type UpsellData,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "RuufPro <hello@ruufpro.com>";

// Schedule the full onboarding sequence for a new contractor.
// Called once after publish.
export async function scheduleOnboardingSequence(contractorId: string) {
  const supabase = createServerSupabase();
  const now = new Date();

  const rows = ONBOARDING_EMAILS.map((email, i) => ({
    contractor_id: contractorId,
    sequence: "onboarding",
    email_number: i + 1,
    subject: `onboarding_${i + 1}`,
    scheduled_for: new Date(now.getTime() + email.day * 24 * 60 * 60 * 1000).toISOString(),
  }));

  await supabase.from("email_sequence_events").insert(rows);
}

// Schedule the upsell sequence. Called by cron 14 days after publish.
export async function scheduleUpsellSequence(contractorId: string) {
  const supabase = createServerSupabase();
  const now = new Date();

  const rows = UPSELL_EMAILS.map((email, i) => ({
    contractor_id: contractorId,
    sequence: "upsell",
    email_number: i + 1,
    subject: `upsell_${i + 1}`,
    scheduled_for: new Date(now.getTime() + (email.day - 14) * 24 * 60 * 60 * 1000).toISOString(),
  }));

  await supabase.from("email_sequence_events").insert(rows);
}

// Process all pending emails (called by cron).
export async function processPendingEmails() {
  const supabase = createServerSupabase();

  // Get all emails that are due and haven't been sent
  const { data: pending } = await supabase
    .from("email_sequence_events")
    .select("*, contractors(email, business_name, city, phone, user_id, tier)")
    .is("sent_at", null)
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (!pending || pending.length === 0) return { sent: 0 };

  // Get unsubscribed contractor IDs
  const { data: unsubs } = await supabase
    .from("email_unsubscribes")
    .select("contractor_id");
  const unsubSet = new Set((unsubs || []).map((u) => u.contractor_id));

  let sent = 0;

  for (const event of pending) {
    const contractor = event.contractors as any;
    if (!contractor?.email) continue;
    if (unsubSet.has(event.contractor_id)) continue;

    // Skip upsell emails if contractor has upgraded
    if (event.sequence === "upsell" && contractor.tier && contractor.tier !== "free") {
      await supabase
        .from("email_sequence_events")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", event.id);
      continue;
    }

    // Get the site slug for URLs
    const { data: site } = await supabase
      .from("sites")
      .select("slug")
      .eq("contractor_id", event.contractor_id)
      .eq("published", true)
      .single();

    const slug = site?.slug || "";
    const baseData: EmailData = {
      businessName: contractor.business_name,
      city: contractor.city,
      siteUrl: `https://${slug}.ruufpro.com`,
      dashboardUrl: "https://ruufpro.com/dashboard",
      unsubscribeUrl: `https://ruufpro.com/api/email/unsubscribe?cid=${event.contractor_id}`,
    };

    // Pick the right template
    let emailContent: { subject: string; html: string } | null = null;

    if (event.sequence === "onboarding") {
      const template = ONBOARDING_EMAILS[event.email_number - 1];
      if (template) {
        emailContent = template.fn(baseData);
      }
    } else if (event.sequence === "upsell") {
      const template = UPSELL_EMAILS[event.email_number - 1];
      if (template) {
        // Get analytics for upsell personalization
        const { count: leadCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("contractor_id", event.contractor_id);

        const upsellData: UpsellData = {
          ...baseData,
          siteVisits: 0, // TODO: wire up analytics tracking
          formFills: leadCount || 0,
          callClicks: 0,
          reviewCount: 0,
        };
        emailContent = template.fn(upsellData);
      }
    }

    if (!emailContent) continue;

    // Send via Resend
    try {
      await resend.emails.send({
        from: FROM,
        to: contractor.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      await supabase
        .from("email_sequence_events")
        .update({ sent_at: new Date().toISOString(), subject: emailContent.subject })
        .eq("id", event.id);

      sent++;
    } catch (err) {
      console.error(`Failed to send email ${event.id}:`, err);
    }
  }

  return { sent };
}
