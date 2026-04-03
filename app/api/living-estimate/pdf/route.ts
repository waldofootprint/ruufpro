// Generate a signed estimate PDF for records.
// Fetches the living estimate by share_token, verifies it's signed,
// and renders a professional PDF with the signature and frozen snapshot.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { SignedEstimatePDF } from "@/components/pdf/signed-estimate";
import React from "react";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const { data: estimate, error } = await supabase
    .from("living_estimates")
    .select("*, contractors(business_name, phone, city, state, license_number)")
    .eq("share_token", token)
    .single();

  if (error || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (estimate.status !== "signed" || !estimate.signature_data) {
    return NextResponse.json({ error: "This estimate has not been signed" }, { status: 400 });
  }

  const snapshot = estimate.signed_estimate_snapshot || {};
  const contractor = (estimate as any).contractors;
  const material = snapshot.material || {};

  const element = React.createElement(SignedEstimatePDF, {
    contractorName: contractor?.business_name || "Contractor",
    contractorPhone: contractor?.phone || "",
    contractorCity: contractor?.city || "",
    contractorState: contractor?.state || "",
    contractorLicense: contractor?.license_number || null,
    homeownerName: estimate.homeowner_name,
    homeownerAddress: estimate.homeowner_address || null,
    roofAreaSqft: estimate.roof_area_sqft || 0,
    materialLabel: material.label || material.material || "Selected Material",
    materialWarranty: material.warranty || "",
    materialLifespan: material.lifespan || "",
    priceLow: material.price_low || 0,
    priceHigh: material.price_high || 0,
    addons: (snapshot.addons || []).map((a: any) => ({ name: a.name, price: a.price })),
    addonsTotal: snapshot.addons_total || 0,
    totalLow: snapshot.total_low || 0,
    totalHigh: snapshot.total_high || 0,
    signatureDataUrl: estimate.signature_data,
    signerName: estimate.signer_name || "",
    signerEmail: estimate.signer_email || null,
    signerIp: estimate.signer_ip || "unknown",
    signedAt: estimate.signed_at
      ? new Date(estimate.signed_at).toLocaleString("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  try {
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RuufPro-Signed-Estimate-${estimate.homeowner_name || "Report"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Signed PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
