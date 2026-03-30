// Email notification system — sends instant alerts to roofers when new leads come in.
// Uses Resend for email delivery (free tier: 3,000 emails/month).

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface LeadNotificationData {
  contractorEmail: string;
  contractorName: string;
  leadName: string;
  leadPhone: string | null;
  leadEmail: string | null;
  leadAddress: string | null;
  leadMessage: string | null;
  source: string;
  estimateLow: number | null;
  estimateHigh: number | null;
  estimateMaterial: string | null;
  estimateRoofSqft: number | null;
}

export async function sendLeadNotificationEmail(data: LeadNotificationData) {
  const {
    contractorEmail,
    contractorName,
    leadName,
    leadPhone,
    leadEmail,
    leadAddress,
    leadMessage,
    source,
    estimateLow,
    estimateHigh,
    estimateMaterial,
    estimateRoofSqft,
  } = data;

  const sourceLabel = source === "estimate_widget" ? "Estimate Widget" : "Contact Form";
  const hasEstimate = estimateLow && estimateHigh;

  const estimateSection = hasEstimate
    ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Ballpark Estimate</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">$${estimateLow.toLocaleString()} – $${estimateHigh.toLocaleString()}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${estimateMaterial || "Asphalt"} · ${estimateRoofSqft?.toLocaleString() || "—"} sqft</p>
        </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #2563eb; border-radius: 12px 12px 0 0; padding: 20px 24px;">
        <h1 style="margin: 0; font-size: 18px; color: white; font-weight: 600;">🔔 New Lead from ${sourceLabel}</h1>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">${leadName}</h2>

        ${leadPhone ? `
        <a href="tel:${leadPhone.replace(/\D/g, "")}" style="display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; color: #2563eb; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 12px;">
          📞 Call: ${leadPhone}
        </a>
        ` : ""}

        <div style="margin-top: 12px; font-size: 14px; color: #4b5563; line-height: 1.6;">
          ${leadEmail ? `<p style="margin: 4px 0;">✉️ ${leadEmail}</p>` : ""}
          ${leadAddress ? `<p style="margin: 4px 0;">📍 ${leadAddress}</p>` : ""}
          ${leadMessage ? `<p style="margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 8px; font-style: italic;">"${leadMessage}"</p>` : ""}
        </div>

        ${estimateSection}

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
          <a href="https://ruufpro.com/dashboard/leads" style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
            View in Dashboard →
          </a>
        </div>
      </div>

      <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
        Sent by RuufPro · You're receiving this because someone submitted a lead on your site.
      </p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "RuufPro <onboarding@resend.dev>",
      to: contractorEmail,
      subject: `New lead: ${leadName}${hasEstimate ? ` — $${estimateLow!.toLocaleString()}-$${estimateHigh!.toLocaleString()}` : ""}`,
      html,
    });

    if (error) {
      console.error("Email send error:", JSON.stringify(error));
      return false;
    }

    console.log("Email sent successfully to:", contractorEmail);
    return true;
  } catch (err) {
    console.error("Email send caught error:", err);
    return false;
  }
}
