// Generate a PDF estimate report.
// Called with estimate data, returns a downloadable PDF.

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { EstimateReportPDF } from "@/components/pdf/estimate-report";
import { createClient } from "@supabase/supabase-js";
import React from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractor_id,
      homeowner_name,
      homeowner_address,
      roof_area_sqft,
      pitch_degrees,
      material,
      price_low,
      price_high,
      is_satellite,
    } = body;

    // Look up contractor details
    const { data: contractor } = await supabase
      .from("contractors")
      .select("business_name, phone, city, state, license_number")
      .eq("id", contractor_id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    const element = React.createElement(EstimateReportPDF, {
      contractorName: contractor.business_name,
      contractorPhone: contractor.phone,
      contractorCity: contractor.city,
      contractorState: contractor.state,
      contractorLicense: contractor.license_number,
      homeownerName: homeowner_name || "Homeowner",
      homeownerAddress: homeowner_address || null,
      roofAreaSqft: roof_area_sqft || 0,
      pitchDegrees: pitch_degrees || 0,
      material: material || "asphalt",
      priceLow: price_low || 0,
      priceHigh: price_high || 0,
      isSatellite: is_satellite ?? true,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const buffer = await renderToBuffer(element as any);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RoofReady-Estimate-${homeowner_name || "Report"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
