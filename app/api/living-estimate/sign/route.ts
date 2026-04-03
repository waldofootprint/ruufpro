// Sign a living estimate — records the homeowner's electronic signature.
// ESIGN Act / UETA compliance: captures signer name, email, IP, timestamp,
// and freezes a snapshot of exactly what was agreed to (material, add-ons, totals).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { share_token, signature_data, signer_name, signer_email } = body;

    if (!share_token || !signature_data || !signer_name) {
      return NextResponse.json(
        { error: "share_token, signature_data, and signer_name are required" },
        { status: 400 }
      );
    }

    // Validate signature is a base64 PNG
    if (!signature_data.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
    }

    // Look up the estimate with contractor info
    const { data: estimate, error: fetchErr } = await supabase
      .from("living_estimates")
      .select("id, status, estimates, available_addons, selected_material, selected_addons, homeowner_name, homeowner_address, roof_area_sqft, contractor_id, contractors(business_name, email, phone)")
      .eq("share_token", share_token)
      .single();

    if (fetchErr || !estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.status === "signed") {
      return NextResponse.json({ error: "This estimate has already been signed" }, { status: 409 });
    }

    // Build the frozen snapshot of what the signer agreed to
    const selectedEst = (estimate.estimates as any[]).find(
      (e: any) => e.material === estimate.selected_material
    ) || (estimate.estimates as any[])[0];

    const selectedAddonDetails = (estimate.available_addons as any[]).filter(
      (a: any) => (estimate.selected_addons || []).includes(a.id)
    );
    const addonsTotal = selectedAddonDetails.reduce((sum: number, a: any) => sum + a.price, 0);

    const snapshot = {
      material: selectedEst,
      addons: selectedAddonDetails,
      addons_total: addonsTotal,
      total_low: selectedEst.price_low + addonsTotal,
      total_high: selectedEst.price_high + addonsTotal,
      homeowner_name: estimate.homeowner_name,
      homeowner_address: estimate.homeowner_address,
      roof_area_sqft: estimate.roof_area_sqft,
      signed_at_display: new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    // Capture signer IP for ESIGN Act compliance
    const signerIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Update the living estimate with signature data
    const { error: updateErr } = await supabase
      .from("living_estimates")
      .update({
        signature_data,
        signed_at: new Date().toISOString(),
        signer_name,
        signer_email: signer_email || null,
        signer_ip: signerIp,
        signed_estimate_snapshot: snapshot,
        status: "signed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", estimate.id);

    if (updateErr) {
      console.error("Signature update error:", updateErr);
      return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
    }

    // Notify the contractor via email
    const contractor = (estimate as any).contractors;
    if (contractor?.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
        const estimateUrl = `${baseUrl}/estimate/${share_token}`;

        await resend.emails.send({
          from: "RuufPro <noreply@ruufpro.com>",
          to: contractor.email,
          subject: `${signer_name} signed their roofing estimate!`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: #ecfdf5; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="color: #059669; font-weight: 700; font-size: 15px; margin: 0;">
                  Estimate Signed
                </p>
              </div>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
                <strong>${signer_name}</strong> just signed their roofing estimate for
                <strong>${estimate.homeowner_address || "their property"}</strong>.
              </p>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Selected: ${selectedEst.label} — $${snapshot.total_low.toLocaleString()} – $${snapshot.total_high.toLocaleString()}
                ${selectedAddonDetails.length > 0 ? ` + ${selectedAddonDetails.length} add-on${selectedAddonDetails.length > 1 ? "s" : ""}` : ""}
              </p>
              <a href="${estimateUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
                View Signed Estimate
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                Tip: Follow up within 1 hour while they&apos;re engaged.
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin-top: 32px;">
                Powered by RuufPro
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Don't fail the sign operation if email fails
        console.error("Signature notification email error:", emailErr);
      }
    }

    return NextResponse.json({ success: true, signed_at: new Date().toISOString() });
  } catch (err) {
    console.error("Sign endpoint error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
