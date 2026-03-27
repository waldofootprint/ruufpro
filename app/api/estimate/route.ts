// Public API endpoint for the estimate widget.
//
// When a homeowner fills out the widget on a roofer's site, the widget
// calls this endpoint. It:
// 1. Looks up the roofer's pricing from their estimate_settings
// 2. Calls the Solar API (or cache) to get roof measurements
// 3. Runs the geometric inference for ridge/hip/valley lengths
// 4. Calculates the full estimate with all factors
// 5. Returns the price range
//
// This endpoint is PUBLIC — no auth required. Anyone visiting a roofer's
// site can get an estimate. The Google API key stays server-side here,
// never exposed to the browser.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRoofData } from "@/lib/solar-api";
import { inferRoofGeometry } from "@/lib/roof-geometry";
import {
  calculateEstimate,
  formatEstimate,
  type RoofMaterial,
  type ContractorRates,
} from "@/lib/estimate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { contractor_id, address, material, stories, shingle_layers } = body;

    if (!contractor_id || !material) {
      return NextResponse.json(
        { error: "contractor_id and material are required" },
        { status: 400 }
      );
    }

    // V1 fallback fields (only needed if no address provided or Solar API misses)
    const { bedrooms, roof_type } = body;

    // Step 1: Look up the roofer's pricing
    const { data: settings, error: settingsErr } = await supabase
      .from("estimate_settings")
      .select("*")
      .eq("contractor_id", contractor_id)
      .single();

    if (settingsErr || !settings) {
      return NextResponse.json(
        { error: "Contractor estimate settings not found. Please configure pricing first." },
        { status: 404 }
      );
    }

    // Build the rates object from the contractor's settings
    const rates: ContractorRates = {
      asphalt_low: settings.asphalt_low || 0,
      asphalt_high: settings.asphalt_high || 0,
      metal_low: settings.metal_low || 0,
      metal_high: settings.metal_high || 0,
      tile_low: settings.tile_low || 0,
      tile_high: settings.tile_high || 0,
      flat_low: settings.flat_low || 0,
      flat_high: settings.flat_high || 0,
    };

    // Step 2: Try to get roof data from Solar API (if address provided)
    let roofData = null;
    let geometry = null;
    let needsFallback = false;

    if (address) {
      const result = await getRoofData(address);
      roofData = result.data;

      if (roofData) {
        // Step 3: Run geometric inference on the segment data
        geometry = inferRoofGeometry(roofData);
      } else {
        // Solar API didn't have data for this address
        needsFallback = true;
      }
    } else {
      // No address provided — go straight to V1 fallback
      needsFallback = true;
    }

    // Step 4: Calculate the estimate
    const result = calculateEstimate({
      roofData: roofData || undefined,
      geometry: geometry || undefined,
      bedrooms: bedrooms || 3,
      roofType: roof_type || "gable",
      stories: stories || 1,
      shingleLayers: shingle_layers || "not_sure",
      material: material as RoofMaterial,
      rates,
    });

    // Step 5: Format and return
    const display = formatEstimate(result);

    return NextResponse.json({
      estimate: {
        price_low: result.priceLow,
        price_high: result.priceHigh,
        range_display: display.range,
        detail_display: display.detail,
        roof_area_sqft: result.roofAreaSqft,
        pitch_degrees: result.pitchDegrees,
        is_satellite: result.isFromSatellite,
        needs_fallback: needsFallback,
      },
      breakdown: result.breakdown,
    });
  } catch (err) {
    console.error("Estimate API error:", err);
    return NextResponse.json(
      { error: "Something went wrong calculating the estimate." },
      { status: 500 }
    );
  }
}
