// Public API endpoint for the estimate widget.
//
// When a homeowner fills out the widget on a roofer's site, the widget
// calls this endpoint. It:
// 1. Looks up the roofer's pricing from their estimate_settings
// 2. Calls the Solar API (or cache) to get roof measurements
// 3. Runs the geometric inference for ridge/hip/valley lengths
// 4. Calculates estimates for ALL priced materials (Good/Better/Best)
// 5. Returns the full set of price ranges sorted low → high
//
// This endpoint is PUBLIC — no auth required. Anyone visiting a roofer's
// site can get an estimate. The Google API key stays server-side here,
// never exposed to the browser.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRoofData } from "@/lib/solar-api";
import { inferRoofGeometry } from "@/lib/roof-geometry";
import { getCachedProperty, fetchPropertyData } from "@/lib/rentcast-api";
import {
  calculateEstimate,
  formatEstimate,
  type RoofMaterial,
  type ContractorRates,
} from "@/lib/estimate";
import { getWeatherSurge } from "@/lib/weather-surge";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Material display metadata
const MATERIAL_META: Record<string, { label: string; warranty: string; windRating: string; lifespan: string; description: string }> = {
  asphalt: {
    label: "Asphalt Shingles",
    warranty: "25–50 years",
    windRating: "50–130 mph",
    lifespan: "20–30 years",
    description: "The most popular roofing material in North America. Affordable, durable, and available in a wide range of colors and styles.",
  },
  metal: {
    label: "Standing Seam Metal",
    warranty: "40–50 years",
    windRating: "140–150+ mph",
    lifespan: "40–70 years",
    description: "Premium roofing known for exceptional durability, energy efficiency, and a modern aesthetic. Resists fire, wind, and impact.",
  },
  tile: {
    label: "Tile (Clay/Concrete)",
    warranty: "50+ years",
    windRating: "125–150+ mph",
    lifespan: "50–100 years",
    description: "A timeless, premium material offering unmatched longevity and classic beauty. Excellent insulation and fire resistance.",
  },
  flat: {
    label: "Flat / TPO / EPDM",
    warranty: "15–25 years",
    windRating: "Up to 100 mph",
    lifespan: "15–30 years",
    description: "Single-ply membrane systems ideal for flat or low-slope roofs. Energy-efficient and cost-effective for commercial-style applications.",
  },
};

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();

    const {
      contractor_id, address,
      pitch_category, current_material, shingle_layers,
      timeline, financing_interest,
      material, // optional: if provided, also return a single-material response for backward compat
      lat, lng, // optional: pre-resolved coords from Places API (skips server-side geocoding)
    } = body;

    if (!contractor_id) {
      return NextResponse.json(
        { error: "contractor_id is required" },
        { status: 400 }
      );
    }

    // V1 fallback fields
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

    // Step 2: Get roof data + weather surge (parallel to avoid latency)
    let roofData = null;
    let geometry = null;

    const preCoords = lat && lng ? { lat, lng } : undefined;
    const [roofResult, weatherSurge] = await Promise.all([
      address ? getRoofData(address, preCoords) : Promise.resolve({ data: null }),
      getWeatherSurge(lat, lng),
    ]);

    roofData = roofResult.data;
    if (roofData) {
      geometry = inferRoofGeometry(roofData);
    }

    // Step 3: Determine which materials the contractor has priced
    const allMaterials: RoofMaterial[] = ["asphalt", "metal", "tile", "flat"];
    const pricedMaterials = allMaterials.filter((m) => {
      const low = rates[`${m}_low` as keyof ContractorRates];
      const high = rates[`${m}_high` as keyof ContractorRates];
      return low > 0 && high > 0;
    });

    if (pricedMaterials.length === 0) {
      return NextResponse.json(
        { error: "No materials priced. Please configure pricing first." },
        { status: 400 }
      );
    }

    // Step 4: Calculate estimates for all priced materials
    const sharedInput = {
      roofData: roofData || undefined,
      geometry: geometry || undefined,
      bedrooms: bedrooms || 3,
      roofType: roof_type || "gable",
      pitchCategory: pitch_category,
      currentMaterial: current_material,
      shingleLayers: shingle_layers || "not_sure",
      timeline,
      financingInterest: financing_interest,
      rates,
      bufferPercent: settings.buffer_percent || 0,
      // Weather surge — only applied when roofer has opted in AND not expired.
      weatherSurgeMultiplier: (() => {
        if (!settings.weather_surge_enabled) return undefined;
        // Check if auto-expire has passed
        if (settings.weather_surge_auto_expire && settings.weather_surge_expires_at) {
          if (new Date(settings.weather_surge_expires_at) < new Date()) return undefined;
        }
        return settings.weather_surge_multiplier || weatherSurge.multiplier;
      })(),
    };

    // Assign Good/Better/Best tier labels based on price order
    const tierLabels = ["Good", "Better", "Best", "Premium"];

    const estimates = pricedMaterials
      .map((mat) => {
        const result = calculateEstimate({ ...sharedInput, material: mat });
        const display = formatEstimate(result);
        const meta = MATERIAL_META[mat];
        return {
          material: mat,
          label: meta.label,
          description: meta.description,
          warranty: meta.warranty,
          wind_rating: meta.windRating,
          lifespan: meta.lifespan,
          price_low: result.priceLow,
          price_high: result.priceHigh,
          range_display: display.range,
          roof_area_sqft: result.roofAreaSqft,
          pitch_degrees: result.pitchDegrees,
          num_segments: result.numSegments,
          is_satellite: result.isFromSatellite,
          breakdown: result.breakdown,
          tier: "", // assigned after sort
        };
      })
      .sort((a, b) => a.price_low - b.price_low)
      .map((est, i) => ({ ...est, tier: tierLabels[i] || "Premium" }));

    // Build detail display from the first estimate (shared roof data)
    const firstEst = estimates[0];

    // Sanity guardrail (Session AV). Three trip conditions:
    //   1. < 600 sqft  — pin off-structure, vacant lot, fragment
    //   2. > 10,000 sqft — neighbor-grab, commercial parcel
    //   3. > 8 segments AND roof > 2× living_sqft — dense-suburbia over-select
    // When trip fires AND cached RentCast living_sqft exists, synthesize a
    // bounded estimate from property records instead of returning error.
    let isFallback = false;
    let estimatesFinal = estimates;
    let firstEstFinal = firstEst;

    if (firstEst.is_satellite) {
      const sqft = firstEst.roof_area_sqft;
      const segs = firstEst.num_segments || 0;
      let trip: string | null = null;

      let cachedProp = address
        ? await getCachedProperty(address).catch(() => null)
        : null;

      // Server-side pre-warm fallback. If cache is cold (widget prewarm
      // skipped or widget isn't V4) AND we're in the over-select risk zone,
      // synchronously fetch RentCast with a 3s timeout so the segment
      // heuristic has living_sqft to compare against. One fetch per unique
      // address — subsequent requests hit cache.
      if (!cachedProp && address && segs >= 8) {
        cachedProp = await Promise.race([
          fetchPropertyData(address).catch(() => null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
      }

      if (sqft < 600) trip = `under_600_sqft:${sqft}`;
      else if (sqft > 10000) trip = `over_10k_sqft:${sqft}`;
      else if (segs >= 12) trip = `too_many_segments:${segs}segs_${sqft}sqft`;
      else if (segs >= 8) {
        const living = cachedProp?.square_footage || 0;
        if (living > 0 && sqft > living * 1.75) {
          trip = `segment_heuristic:${segs}segs_${sqft}sqft_vs_${living}living`;
        }
      }

      // Google Solar confidence gates — only run on fresh fetches (cache hits
      // don't carry these fields; segment heuristics already cover over-selects).
      if (!trip && roofData?.source === "google_solar") {
        if (roofData.imageryQuality === "LOW") {
          trip = `low_imagery_quality:${sqft}sqft`;
        } else if (roofData.imageryProcessedDate) {
          const processed = Date.parse(roofData.imageryProcessedDate);
          const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
          if (!isNaN(processed) && processed < twoYearsAgo) {
            trip = `stale_imagery:${roofData.imageryProcessedDate}`;
          }
        }
      }

      if (trip) {
        const living = cachedProp?.square_footage || 0;
        // Try fallback synthesis from cached property records
        if (living > 0 && roofData) {
          const PITCH_MULT: Record<string, number> = {
            flat: 1.02,
            low: 1.10,
            moderate: 1.20,
            steep: 1.35,
          };
          const pitchMult = PITCH_MULT[pitch_category] || 1.18;
          const stories = cachedProp?.stories || 0;
          const storyFactor = stories >= 2 ? 0.55 : 1.0;
          const synthArea = Math.round(living * storyFactor * pitchMult);

          const synthRoofData = {
            roofAreaSqft: synthArea,
            pitchDegrees: roofData.pitchDegrees ?? 22,
            numSegments: 2,
            segments: roofData.segments,
            source: roofData.source,
          };

          const synthInput = { ...sharedInput, roofData: synthRoofData };
          estimatesFinal = pricedMaterials
            .map((mat) => {
              const result = calculateEstimate({ ...synthInput, material: mat });
              const display = formatEstimate(result);
              const meta = MATERIAL_META[mat];
              return {
                material: mat,
                label: meta.label,
                description: meta.description,
                warranty: meta.warranty,
                wind_rating: meta.windRating,
                lifespan: meta.lifespan,
                price_low: result.priceLow,
                price_high: result.priceHigh,
                range_display: display.range,
                roof_area_sqft: result.roofAreaSqft,
                pitch_degrees: result.pitchDegrees,
                num_segments: result.numSegments,
                is_satellite: false, // synthesized, not satellite-measured
                breakdown: result.breakdown,
                tier: "",
              };
            })
            .sort((a, b) => a.price_low - b.price_low)
            .map((est, i) => ({ ...est, tier: tierLabels[i] || "Premium" }));

          firstEstFinal = estimatesFinal[0];
          isFallback = true;
          console.warn(
            `[estimate] guardrail tripped (${trip}) → fallback synth: ${synthArea} sqft from ${living} living × ${storyFactor} × ${pitchMult}`
          );
        } else {
          console.warn(
            `[estimate] guardrail tripped (${trip}) → no cache, rejecting: address="${address}"`
          );
          return NextResponse.json(
            {
              error:
                "We couldn't measure your roof accurately from satellite. Please contact us for a manual quote.",
              error_code: "couldnt_measure_accurately",
            },
            { status: 422 }
          );
        }
      }
    }

    const detailDisplay = isFallback
      ? `Estimated from property records · ${firstEstFinal.roof_area_sqft.toLocaleString()} sqft roof (less precise — satellite view was unclear)`
      : `Based on ${firstEstFinal.roof_area_sqft.toLocaleString()} sqft roof · ${firstEstFinal.is_satellite ? "satellite-measured" : "estimated"}`;

    // Step 5: Return full response
    return NextResponse.json({
      estimates,
      roof_data: {
        roof_area_sqft: firstEst.roof_area_sqft,
        pitch_degrees: firstEst.pitch_degrees,
        num_segments: firstEst.num_segments,
        is_satellite: firstEst.is_satellite,
        detail_display: detailDisplay,
      },
      // Weather surge: "detected" = NOAA sees alerts, "active" = roofer opted in
      weather_surge: weatherSurge.isSurged
        ? {
            detected: true,
            active: !!settings.weather_surge_enabled,
            multiplier: weatherSurge.multiplier,
            alerts: weatherSurge.alerts,
            severity: weatherSurge.highestSeverity,
          }
        : null,
      // Backward compatibility: if a single material was requested, include flat response
      ...(material && estimates.find((e) => e.material === material)
        ? {
            estimate: {
              price_low: estimates.find((e) => e.material === material)!.price_low,
              price_high: estimates.find((e) => e.material === material)!.price_high,
              range_display: estimates.find((e) => e.material === material)!.range_display,
              detail_display: detailDisplay,
              roof_area_sqft: firstEst.roof_area_sqft,
              pitch_degrees: firstEst.pitch_degrees,
              num_segments: firstEst.num_segments,
              is_satellite: firstEst.is_satellite,
            },
            breakdown: estimates.find((e) => e.material === material)!.breakdown,
          }
        : {}),
    });
  } catch (err) {
    console.error("Estimate API error:", err);
    return NextResponse.json(
      { error: "Something went wrong calculating the estimate." },
      { status: 500 }
    );
  }
}
