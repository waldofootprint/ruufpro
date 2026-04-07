// Generate a PDF estimate report with full details.
// Public endpoint: called from the estimate widget when a homeowner
// downloads their estimate (visitors are not logged in).
// Validates contractor_id exists before generating.
//
// V2: Accepts pre-calculated G/B/B estimates from the widget instead of
// recomputing rough estimates from rates. Falls back to the old method
// if all_estimates is not provided (backward compatibility).

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { EstimateReportPDF } from "@/components/pdf/estimate-report";
import { createClient } from "@supabase/supabase-js";
import React from "react";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const body = await request.json();
    const {
      contractor_id,
      homeowner_name,
      homeowner_address,
      homeowner_phone,
      homeowner_email,
      roof_area_sqft,
      pitch_degrees,
      num_segments,
      material,
      price_low,
      price_high,
      is_satellite,
      all_estimates, // G/B/B array from the widget (new in V2)
      lat, lng, // pre-resolved coords from widget
    } = body;

    // Look up contractor details
    const { data: contractor } = await supabase
      .from("contractors")
      .select("business_name, phone, city, state, license_number, is_insured, years_in_business, gaf_master_elite, owens_corning_preferred, certainteed_select")
      .eq("id", contractor_id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Build material options for comparison table
    let materialOptions: { name: string; description: string; priceLow: number; priceHigh: number; warranty: string; windRating: string; lifespan: string }[] = [];

    if (all_estimates && Array.isArray(all_estimates) && all_estimates.length > 0) {
      // V2: Use real calculated values from the G/B/B API response
      materialOptions = all_estimates.map((est: { label: string; description: string; price_low: number; price_high: number; warranty: string; wind_rating: string; lifespan: string }) => ({
        name: est.label,
        description: est.description,
        priceLow: est.price_low,
        priceHigh: est.price_high,
        warranty: est.warranty,
        windRating: est.wind_rating,
        lifespan: est.lifespan,
      }));
    } else {
      // V1 fallback: Look up contractor's pricing and compute rough estimates
      const { data: settings } = await supabase
        .from("estimate_settings")
        .select("*")
        .eq("contractor_id", contractor_id)
        .single();

      const roofArea = roof_area_sqft || 2000;

      if (settings?.asphalt_low && settings?.asphalt_high) {
        materialOptions.push({
          name: "Asphalt Shingles",
          description: "The most popular roofing material in North America. Asphalt shingles are affordable, durable, and available in a wide range of colors and styles. Ideal for most residential homes.",
          priceLow: Math.round(roofArea * settings.asphalt_low * 1.15),
          priceHigh: Math.round(roofArea * settings.asphalt_high * 1.15),
          warranty: "25-50 years",
          windRating: "50-130 mph",
          lifespan: "20-30 years",
        });
      }
      if (settings?.metal_low && settings?.metal_high) {
        materialOptions.push({
          name: "Standing Seam Metal",
          description: "A premium roofing system known for exceptional durability, energy efficiency, and a modern aesthetic. Metal roofs resist fire, wind, and impact damage — making them ideal for storm-prone areas.",
          priceLow: Math.round(roofArea * settings.metal_low * 1.15),
          priceHigh: Math.round(roofArea * settings.metal_high * 1.15),
          warranty: "40-50 years",
          windRating: "140-150+ mph",
          lifespan: "40-70 years",
        });
      }
      if (settings?.tile_low && settings?.tile_high) {
        materialOptions.push({
          name: "Tile (Clay/Concrete)",
          description: "A timeless, premium roofing material offering unmatched longevity and classic beauty. Tile roofs provide excellent insulation and are fire-resistant — popular in Mediterranean and Southwest-style homes.",
          priceLow: Math.round(roofArea * settings.tile_low * 1.15),
          priceHigh: Math.round(roofArea * settings.tile_high * 1.15),
          warranty: "50+ years",
          windRating: "125-150+ mph",
          lifespan: "50-100 years",
        });
      }
    }

    // Fetch estimate settings for PDF toggles + financing
    const { data: pdfSettings } = await supabase
      .from("estimate_settings")
      .select("property_protection_enabled, change_order_enabled, financing_enabled, financing_provider, financing_term_months, financing_apr, financing_note")
      .eq("contractor_id", contractor_id)
      .single();

    // Repair option — estimated at roughly 5-8% of replacement cost
    const roofArea = roof_area_sqft || 2000;
    const repairOption = {
      priceLow: Math.round(roofArea * 0.35),
      priceHigh: Math.round(roofArea * 0.55),
      description: "Don't replace it when you can repair it! A certified roofing technician will inspect your roof, identify issues, and make targeted repairs to extend its lifetime. Includes leak repair, shingle replacement, flashing repair, and preventive maintenance.",
    };

    // Build certifications list
    const certs: string[] = [];
    if (contractor.gaf_master_elite) certs.push("GAF Master Elite");
    if (contractor.owens_corning_preferred) certs.push("Owens Corning Preferred");
    if (contractor.certainteed_select) certs.push("CertainTeed SELECT");

    // Generate satellite image URL if we have coords
    const MAPS_KEY = process.env.GOOGLE_API_KEY;
    let satelliteImageUrl: string | null = null;
    if (lat && lng && MAPS_KEY) {
      satelliteImageUrl =
        `https://maps.googleapis.com/maps/api/staticmap` +
        `?center=${lat},${lng}` +
        `&zoom=19&size=600x300&scale=2&maptype=satellite` +
        `&key=${MAPS_KEY}`;
    } else if (homeowner_address && MAPS_KEY) {
      satelliteImageUrl =
        `https://maps.googleapis.com/maps/api/staticmap` +
        `?center=${encodeURIComponent(homeowner_address)}` +
        `&zoom=19&size=600x300&scale=2&maptype=satellite` +
        `&key=${MAPS_KEY}`;
    }

    const element = React.createElement(EstimateReportPDF, {
      contractorName: contractor.business_name,
      contractorPhone: contractor.phone,
      contractorCity: contractor.city,
      contractorState: contractor.state,
      contractorLicense: contractor.license_number,
      contractorInsured: contractor.is_insured || false,
      contractorYears: contractor.years_in_business,
      contractorCertifications: certs,
      homeownerName: homeowner_name || "Homeowner",
      homeownerAddress: homeowner_address || null,
      homeownerPhone: homeowner_phone || null,
      homeownerEmail: homeowner_email || null,
      roofAreaSqft: roof_area_sqft || 0,
      pitchDegrees: pitch_degrees || 0,
      numSegments: num_segments || 4,
      selectedMaterial: (material as string) || "asphalt",
      priceLow: price_low || 0,
      priceHigh: price_high || 0,
      materialOptions,
      repairOption,
      isSatellite: is_satellite ?? true,
      satelliteImageUrl,
      propertyProtectionEnabled: pdfSettings?.property_protection_enabled ?? false,
      changeOrderEnabled: pdfSettings?.change_order_enabled ?? false,
      financingEnabled: pdfSettings?.financing_enabled ?? false,
      financingProvider: pdfSettings?.financing_provider || null,
      financingTermMonths: pdfSettings?.financing_term_months || null,
      financingApr: pdfSettings?.financing_apr || null,
      financingNote: pdfSettings?.financing_note || null,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RuufPro-Estimate-${homeowner_name || "Report"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
