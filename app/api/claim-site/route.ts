// Claim site endpoint — called when a prospect fills out the "Claim This Site" form.
// Sends Hannah an email notification via Resend with the prospect's contact info.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Hannah's email for claim notifications
const NOTIFY_EMAIL = "hannah@ruufpro.com";

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, phone, slug, site_id, business_name } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    const previewUrl = `${request.nextUrl.origin}/preview/${slug}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius: 12px 12px 0 0; padding: 20px 24px;">
          <h1 style="margin: 0; font-size: 18px; color: white; font-weight: 600;">
            🎯 Prospect Claimed Their Site!
          </h1>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <h2 style="margin: 0 0 4px; font-size: 20px; color: #111827;">${business_name}</h2>
          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">Claimed by: ${name}</p>

          ${phone ? `
          <a href="tel:${phone.replace(/\D/g, "")}" style="display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; color: #2563eb; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 12px;">
            📞 Call: ${phone}
          </a>
          ` : ""}

          <div style="margin-top: 12px; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <p style="margin: 4px 0;">✉️ ${email}</p>
            ${phone ? `<p style="margin: 4px 0;">📞 ${phone}</p>` : ""}
          </div>

          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
            <a href="${previewUrl}" style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
              View Their Site →
            </a>
          </div>
        </div>

        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
          RuufPro Prospect Claim · Follow up ASAP — this is a hot lead!
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: NOTIFY_EMAIL,
      subject: `🎯 ${business_name} claimed their site! — ${name}`,
      html,
    });

    if (error) {
      console.error("Claim email error:", JSON.stringify(error));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Claim site error:", err);
    return NextResponse.json({ error: "Failed to process claim" }, { status: 500 });
  }
}
