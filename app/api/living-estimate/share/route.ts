// Share a living estimate via email (magic link for spouse/partner).
// Generates a separate magic_link_token and sends via Resend.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { Resend } from "resend";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await request.json();
    const { share_token, recipient_email, sender_name } = body;

    if (!share_token || !recipient_email) {
      return NextResponse.json({ error: "share_token and recipient_email required" }, { status: 400 });
    }

    // Look up the estimate
    const { data: estimate, error } = await supabase
      .from("living_estimates")
      .select("id, homeowner_name, homeowner_address, share_token, magic_link_token, contractor_id, contractors(business_name)")
      .eq("share_token", share_token)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Generate or reuse magic link token
    let magicToken = estimate.magic_link_token;
    if (!magicToken) {
      magicToken = nanoid(16);
      await supabase
        .from("living_estimates")
        .update({ magic_link_token: magicToken })
        .eq("id", estimate.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
    const estimateUrl = `${baseUrl}/estimate/${share_token}`;
    const contractorName = (estimate as any).contractors?.business_name || "Your roofer";

    // Send email via Resend
    await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: recipient_email,
      subject: `${sender_name || estimate.homeowner_name} shared a roofing estimate with you`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Roofing Estimate</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
            ${sender_name || estimate.homeowner_name} shared a roofing estimate from <strong>${contractorName}</strong> with you.
          </p>
          ${estimate.homeowner_address ? `<p style="color: #94a3b8; font-size: 13px;">${estimate.homeowner_address}</p>` : ""}
          <a href="${estimateUrl}" style="display: inline-block; background: #1e293b; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
            View Estimate
          </a>
          <p style="color: #cbd5e1; font-size: 11px; margin-top: 32px;">
            Powered by RuufPro
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Share email error:", err);
    return NextResponse.json({ error: "Failed to send share email" }, { status: 500 });
  }
}
