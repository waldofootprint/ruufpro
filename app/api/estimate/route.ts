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
import { getRoofData, type RoofData } from "@/lib/solar-api";
import { getBuildingFootprintArea } from "@/lib/footprints-api";
import { buildRoofOverlayUrl } from "@/lib/mapbox-static";
import {
  runMeasurementPipeline,
  prodAdapters,
} from "@/lib/measurement-pipeline";
import type { PipelineResult } from "@/lib/measurement-pipeline.types";
import { geometryForEstimate } from "@/lib/estimate-geometry-policy";
import { getCachedProperty, fetchPropertyData } from "@/lib/rentcast-api";
import {
  calculateEstimate,
  formatEstimate,
  resolveShapeClass,
  type RoofMaterial,
  type ContractorRates,
  type RoofShapeClass,
} from "@/lib/estimate";
import { getWeatherSurge } from "@/lib/weather-surge";

// Pitch-category → multiplier on horizontal footprint area to get installed
// roof area. Mirrors the values used in the V1 fallback elsewhere; consumed
// by the Footprints-direct branch when Solar returns null.
const FOOTPRINT_PITCH_MULT: Record<string, number> = {
  flat: 1.02,
  low: 1.10,
  moderate: 1.20,
  steep: 1.35,
};
const FOOTPRINT_PITCH_DEGREES: Record<string, number> = {
  flat: 5,
  low: 18,
  moderate: 22,
  steep: 38,
};

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

const DEFAULT_LABELS: Record<string, string> = {
  asphalt: MATERIAL_META.asphalt.label,
  metal: MATERIAL_META.metal.label,
  tile: MATERIAL_META.tile.label,
  flat: MATERIAL_META.flat.label,
};

// Mode B (Session AZ, extended Phase 1 2026-05-01): when a guardrail or
// upstream measurement source refuses the address, write a lead anyway so
// the roofer can follow up. Phase 1 dropped the name+email gate per
// decisions/2026-05-01-phase-1-shippable-calculator.md Step 6 — every
// estimate request that reaches this function produces a leads row.
// When contact info is missing, status flips to 'address_only_followup' so
// the kanban dashboard can sort those into their own queue.
async function writeManualQuoteLead(
  supabase: ReturnType<typeof getSupabase>,
  contractor_id: string,
  fields: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    timeline?: string;
    financing_interest?: string;
    sms_consent?: boolean;
    trip_reason: string;
  }
) {
  const hasContact = Boolean(fields.name) && Boolean(fields.email);
  const { error } = await supabase.from("leads").insert({
    contractor_id,
    name: fields.name || null,
    email: fields.email || null,
    phone: fields.phone || null,
    address: fields.address || null,
    source: "estimate_widget",
    status: hasContact ? "new" : "address_only_followup",
    measurement_status: "needs_manual_quote",
    message: `Satellite measurement refused (${fields.trip_reason}). Homeowner needs an on-site quote.`,
    timeline: fields.timeline || null,
    financing_interest: fields.financing_interest || null,
    sms_consent: fields.sms_consent ?? false,
  });
  if (error) console.error("[estimate] needs_manual_quote lead insert failed:", error);
}

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
      // Mode B (Session AZ): contact fields passed up front so we can write a
      // `needs_manual_quote` lead if a guardrail refuses the measurement.
      name, email, phone, sms_consent,
      // PRICING.1 (2026-04-23): market-default rate mode. When true, bypass
      // estimate_settings lookup and synthesize rates from metro/regional
      // defaults. Used by bench harness + demo pages + un-configured widgets.
      use_market_defaults, state: reqState,
      // PRICING.1c-corrected (2026-04-24): optional widget-supplied shape class.
      // When absent or "not_sure", pipeline auto-classifies from geometry.
      shape_class: reqShapeClass,
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
    // PRICING.1: if use_market_defaults=true, synthesize from metro/regional
    // defaults instead of loading contractor-configured rates. Metro from
    // city+state (parsed out of address when available) using BLS wage data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings: any = null;
    let rates: ContractorRates;

    if (use_market_defaults) {
      // Parse city from "street, CITY, STATE ZIP" address; state from reqState or address tail.
      let city: string | undefined;
      let state: string = reqState || "";
      if (address && typeof address === "string") {
        const parts = address.split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          city = parts[parts.length - 2];
          const tail = parts[parts.length - 1]; // "FL 32256"
          const stateMatch = tail.match(/^([A-Z]{2})\b/);
          if (stateMatch && !state) state = stateMatch[1];
        }
      }
      const { getMetroDefaults } = await import("@/lib/metro-pricing");
      const { rates: marketRates } = getMetroDefaults(state || "FL", city);
      rates = {
        asphalt_low: marketRates.asphalt_low,
        asphalt_high: marketRates.asphalt_high,
        metal_low: marketRates.metal_low,
        metal_high: marketRates.metal_high,
        tile_low: marketRates.tile_low,
        tile_high: marketRates.tile_high,
        flat_low: marketRates.flat_low,
        flat_high: marketRates.flat_high,
      };
      settings = { minimum_job_price: 0 }; // no contractor floor in market-default mode
    } else {
      const { data: loaded, error: settingsErr } = await supabase
        .from("estimate_settings")
        .select("*")
        .eq("contractor_id", contractor_id)
        .single();

      if (settingsErr || !loaded) {
        return NextResponse.json(
          {
            error: "Estimates aren't available yet.",
            error_code: "setup_incomplete",
          },
          { status: 400 }
        );
      }
      settings = loaded;

      rates = {
        asphalt_low: loaded.asphalt_low || 0,
        asphalt_high: loaded.asphalt_high || 0,
        metal_low: loaded.metal_low || 0,
        metal_high: loaded.metal_high || 0,
        tile_low: loaded.tile_low || 0,
        tile_high: loaded.tile_high || 0,
        flat_low: loaded.flat_low || 0,
        flat_high: loaded.flat_high || 0,
      };
    }

    // Custom tier labels — fall back to hardcoded defaults when null.
    const materialLabels: Record<string, string> = {
      asphalt: settings?.asphalt_label || DEFAULT_LABELS.asphalt,
      metal: settings?.metal_label || DEFAULT_LABELS.metal,
      tile: settings?.tile_label || DEFAULT_LABELS.tile,
      flat: settings?.flat_label || DEFAULT_LABELS.flat,
    };
    const showRoofDetails: boolean = settings?.show_roof_details ?? true;

    // Step 2: Get roof data + weather surge (parallel to avoid latency)
    let roofData: RoofData | null = null;
    let geometry = null;

    const preCoords = lat && lng ? { lat, lng } : undefined;
    const getRoofDataStart = Date.now();
    const [roofResult, weatherSurge] = await Promise.all([
      address ? getRoofData(address, preCoords) : Promise.resolve({ data: null, geocoded: null, invalid: undefined as string | undefined }),
      getWeatherSurge(lat, lng),
    ]);
    const getRoofDataElapsedMs = Date.now() - getRoofDataStart;

    roofData = roofResult.data;

    // Resolved coordinates: explicit body lat/lng, else whatever
    // getRoofData's geocoder produced. Used by the Footprints fallback so
    // requests without preCoords (e.g., the bench curl loop) still hit the
    // fallback path.
    const resolvedLat = lat ?? roofResult.geocoded?.lat ?? null;
    const resolvedLng = lng ?? roofResult.geocoded?.lng ?? null;

    // Phase 1 (2026-05-01): per-response confidence flag, surfaced separately
    // from the trip/refusal system. "high" by default; downgrades on signals
    // that historically caused refusals (LOW Solar imagery, ≥12 segments,
    // Footprints-derived synthesis) — those now flag instead of refuse.
    let confidence: "high" | "low" = "high";

    // Always look up the building footprint when we have coords, regardless of
    // whether Solar succeeded. Two callers:
    //   1. Phase 1 fallback below — when Solar returns null, we synthesize roofData
    //      from the footprint area.
    //   2. The roof_overlay attached to the response — needs the polygon GeoJSON
    //      for the Mapbox overlay on the results page.
    // Failure is silent and degrades to no overlay (footprintResult stays null).
    let footprintResult: Awaited<ReturnType<typeof getBuildingFootprintArea>> = null;
    if (resolvedLat != null && resolvedLng != null) {
      try {
        footprintResult = await getBuildingFootprintArea(resolvedLat, resolvedLng);
      } catch (err) {
        console.warn("[estimate] footprint lookup errored:", err);
      }
    }

    // Phase 1 / Step 7: Footprints-direct fallback when Solar returns null.
    // Solar is the primary measurement source; when it has no buildingInsights
    // for an address (often newer FL construction missing from Google's
    // satellite-derived dataset), we previously fell through to V1 manual
    // estimates from bedroom counts. That path was inaccurate and homeowners
    // got a generic "couldn't measure" error. Now we synthesize a roof area
    // from the MS Footprints polygon × pitch factor and feed it into the
    // same calculateEstimate path with confidence flagged "low".
    if (
      roofData == null &&
      footprintResult &&
      footprintResult.areaSqft > 0 &&
      !roofResult.invalid
    ) {
      const pitchFactor =
        FOOTPRINT_PITCH_MULT[pitch_category] ?? 1.20;
      const synthSqft = Math.round(footprintResult.areaSqft * pitchFactor);
      roofData = {
        roofAreaSqft: synthSqft,
        pitchDegrees: FOOTPRINT_PITCH_DEGREES[pitch_category] ?? 22,
        numSegments: 2,
        segments: [],
        source: "ms_footprints" as const,
      };
      confidence = "low";
      console.log(
        `[estimate] footprints fallback hit: ${footprintResult.areaSqft}sqft footprint × ${pitchFactor} = ${synthSqft}sqft synth (building_id=${footprintResult.buildingId ?? "?"})`
      );
    }

    // Build the Mapbox static-image URL once, reused across success + error
    // responses where lat/lng resolved. Returns null when MAPBOX_TOKEN is
    // unset (during the period before the Mapbox token is provisioned).
    const roofOverlay =
      resolvedLat != null && resolvedLng != null
        ? {
            url: buildRoofOverlayUrl({
              lat: resolvedLat,
              lng: resolvedLng,
              polygon: footprintResult?.polygon ?? null,
            }),
            has_polygon: !!footprintResult?.polygon,
          }
        : null;

    // Track D.5 Option-A 2026-04-23: promote measurement pipeline from
    // waitUntil (telemetry-only) to in-band await so LiDAR output can feed
    // the sync price path. Q1-A1: LiDAR-primary when outcome=ok AND gate=strong;
    // Solar fallback otherwise (including borderline, no_class_6, mode_b, crash).
    // Q2-B1: guardrails automatically read LiDAR segs+sqft via overwritten
    // roofData below. Q3-C1: no_class_6 → Solar fallback, counts normally.
    // Outer budget bounded by TIMEOUTS_MS.hardWall (45s) inside the harness.
    let pipelineResult: PipelineResult | null = null;
    if (address && lat != null && lng != null && roofData) {
      const cachedRoofData = roofData;
      try {
        pipelineResult = await runMeasurementPipeline(
          {
            contractorId: contractor_id ?? null,
            leadId: null,
            widgetEventId: null,
            address,
            lat,
            lng,
            widgetShapeClass: reqShapeClass ?? null,
          },
          {
            ...prodAdapters,
            runSolar: async () => ({
              available: true,
              horizSqft: cachedRoofData.roofAreaSqft,
              // Solar API returns pitch in degrees (verified lib/solar-api.ts:240).
              // Pipeline schema stores rise/run ratio (migration 082). Convert.
              pitch: Math.tan((cachedRoofData.pitchDegrees * Math.PI) / 180),
              segmentCount: cachedRoofData.numSegments,
              elapsedMs: getRoofDataElapsedMs,
            }),
          }
        );
      } catch (err) {
        console.error("[measurement-pipeline] in-band run failed", err);
        pipelineResult = null;
      }
    }

    // Q1-A1 gate: LiDAR-primary iff `pipeline=lidar` AND gate=strong AND
    // all three measurement fields populated. Anything else → Solar path
    // untouched. Borderline/fail/no_class_6/pipeline_crash all fall to Solar.
    const useLidar =
      pipelineResult?.pipeline === "lidar" &&
      pipelineResult.lidarGateStatus === "strong" &&
      pipelineResult.horizSqft != null &&
      pipelineResult.pitch != null &&
      pipelineResult.segmentCount != null;

    if (useLidar && pipelineResult) {
      // Convert LiDAR result (rise/run pitch, horizontal sqft) to RoofData
      // shape so calculateEstimate consumes LiDAR values without any math
      // changes. Preserves imageryQuality flags from Solar fetch so downstream
      // gates that reference them still have signal when available.
      const lidarPitchDegrees =
        (Math.atan(pipelineResult.pitch!) * 180) / Math.PI;
      const lidarRoofData: RoofData = {
        roofAreaSqft: pipelineResult.horizSqft!,
        pitchDegrees: lidarPitchDegrees,
        numSegments: pipelineResult.segmentCount!,
        segments: roofData?.segments ?? [],
        source: roofData?.source ?? ("google_solar" as const),
        imageryQuality: roofData?.imageryQuality,
        imageryDate: roofData?.imageryDate,
        imageryProcessedDate: roofData?.imageryProcessedDate,
      };
      roofData = lidarRoofData;
    }

    // Track A.7 policy wired (was locked to null per A.7 scope): LiDAR-win
    // returns undefined from geometryForEstimate so itemized mode falls back
    // to materialCost * 0.10; Solar-win preserves today's inferred geometry.
    //
    // pipelineUsed reflects the actual price-path data source, not the harness
    // winner. Borderline-LiDAR rows fall through to Solar data at Q1-A1 gate,
    // so response.pipeline must read "solar" to keep the G2 cross-layer
    // assertion consistent with §0 post-mortem (telemetry/price-path parity).
    const pipelineUsed = useLidar
      ? ("lidar" as const)
      : roofData
      ? ("solar" as const)
      : null;
    geometry = geometryForEstimate(pipelineUsed, roofData);

    // Geocoding sanity: reject non-residential place types (park, bare
    // route, intersection, commercial POIs) before running cost/guardrail.
    // Phase 1 (Step 5): differentiated error codes so the widget can show
    // the right copy. `commercial_or_high_rise` covers parks/schools/malls/
    // hospitals/etc. that aren't residential rooftops; `address_unrecognized`
    // covers intersections and missing-street-number geocodes the homeowner
    // can fix by re-typing the address.
    if (roofResult.invalid) {
      console.warn(
        `[estimate] geocode rejected (${roofResult.invalid}) for "${address}"`
      );
      const invalidStr = roofResult.invalid;
      const isCommercial =
        invalidStr.startsWith("non_residential_place:") &&
        /(?:^|,|:)(?:park|natural_feature|airport|cemetery|church|school|university|hospital|shopping_mall|stadium)(?:,|$)/.test(
          invalidStr
        );
      const errorCode = isCommercial
        ? "commercial_or_high_rise"
        : "address_unrecognized";
      await writeManualQuoteLead(supabase, contractor_id, {
        name, email, phone, address, timeline, financing_interest, sms_consent,
        trip_reason: `geocode_${invalidStr}`,
      });
      return NextResponse.json(
        {
          error:
            isCommercial
              ? "This address looks like a commercial property or high-rise — our calculator only handles single-family roofs. Your details were sent over for a free on-site quote."
              : "We couldn't recognize that address. Try re-typing the full street address, or your details were sent over for a free on-site quote.",
          error_code: errorCode,
          measurement_status: "needs_manual_quote",
          confidence,
          roof_overlay: roofOverlay,
        },
        { status: 422 }
      );
    }

    // Phase 1 / Step 7: when an address geocoded fine but neither Solar nor
    // Footprints could produce roof data, refuse instead of silently falling
    // through to V1 bedroom-based estimates (which produce wildly inaccurate
    // prices from a default bedrooms=3). We still write a lead so the roofer
    // sees the address.
    if (address && !roofData) {
      console.warn(
        `[estimate] no roof data from Solar or Footprints for "${address}" (resolvedLat=${resolvedLat}, resolvedLng=${resolvedLng})`
      );
      await writeManualQuoteLead(supabase, contractor_id, {
        name, email, phone, address, timeline, financing_interest, sms_consent,
        trip_reason: "no_roof_data_solar_or_footprints",
      });
      return NextResponse.json(
        {
          error:
            "We couldn't measure this roof from satellite. Your details were sent over for a free on-site quote.",
          error_code: "measurement_unavailable",
          measurement_status: "needs_manual_quote",
          confidence,
          roof_overlay: roofOverlay,
        },
        { status: 422 }
      );
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
        {
          error: "No materials priced. Please configure pricing first.",
        },
        { status: 400 }
      );
    }

    // PRICING.1c-corrected (2026-04-24): resolve shape class for pricing.
    // Pipeline writes its own resolution to measurement_runs; this fallback
    // covers route-level pricing when pipeline didn't run (no address/coords,
    // or pipeline errored). Widget input wins, else auto from whatever
    // geometry is available, else safe-middle hip default.
    const pricingShapeClass: RoofShapeClass = pipelineResult
      ? pipelineResult.shapeClass
      : resolveShapeClass(
          reqShapeClass ?? null,
          roofData?.roofAreaSqft ?? null,
          null,
          null,
        ).shapeClass;

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
      bufferPercent: settings.buffer_percent ?? 10,
      roofShapeClass: pricingShapeClass,
      // Mode A: per-contractor minimum job price floor (Session AZ)
      minimumJobPrice: settings.minimum_job_price || undefined,
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
          label: materialLabels[mat] || meta.label,
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

      // Story-count pitch conflict: 2-story flat-roof residential is
      // ~nonexistent in FL. If homeowner picked "flat" or "low" but
      // property records show 2+ stories, they likely misread the form.
      const stories = cachedProp?.stories || 0;
      if (
        stories >= 2 &&
        (pitch_category === "flat" || pitch_category === "low")
      ) {
        console.warn(
          `[estimate] pitch conflict: ${stories}-story home with pitch=${pitch_category} at "${address}"`
        );
        // No manual-quote lead here — this is a user input error we want them
        // to correct, not a guardrail refusal.
        return NextResponse.json(
          {
            error:
              "The pitch you picked doesn't match what we see for this property. A flat or low-slope roof on a multi-story home is unusual — please re-check the pitch question or contact us for a manual quote.",
            error_code: "pitch_conflict_recheck",
            confidence,
            roof_overlay: roofOverlay,
          },
          { status: 422 }
        );
      }

      if (sqft < 600) trip = `under_600_sqft:${sqft}`;
      else if (sqft > 10000) trip = `over_10k_sqft:${sqft}`;
      else if (segs >= 8) {
        // Phase 1 (Step 4): bumped from 1.75× to 2.5× — bench validation
        // (scripts/bench-addresses.json D.2 green band 1.3–2.0×) showed the
        // 1.75× gate was tripping legitimate complex roofs. 2.5× sits above
        // the green band so only true neighbor-grab cases trip.
        const living = cachedProp?.square_footage || 0;
        if (living > 0 && sqft > living * 2.5) {
          trip = `segment_heuristic:${segs}segs_${sqft}sqft_vs_${living}living`;
        }
      }

      // Phase 1 (Step 3): ≥12 segments and LOW Solar imagery quality used to
      // trip the guardrail and return an error. Now they downgrade confidence
      // instead — homeowner still gets a price, just flagged as low confidence.
      if (segs >= 12) confidence = "low";
      if (
        !useLidar &&
        roofData?.source === "google_solar" &&
        roofData.imageryQuality === "LOW"
      ) {
        confidence = "low";
      }
      // Phase 1 (Step 1): the stale-imagery trip block was deleted entirely.
      // Imagery age (>2 years processed) is no longer a refusal signal —
      // construction on a roof would change the area meaningfully and that
      // would surface via the over_10k_sqft / under_600_sqft / segment
      // heuristic gates. Old imagery alone is not informative enough to refuse.

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
                label: materialLabels[mat] || meta.label,
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
          // Phase 1 (Step 5 + Step 7): differentiated error codes.
          // over_10k_sqft → commercial_or_high_rise (residential roofs in FL
          // top out around 8-9k installed; >10k is almost always a commercial
          // building or neighbor-grab on a commercial parcel).
          // Everything else → measurement_unavailable.
          const isOverSize = trip.startsWith("over_10k_sqft");
          const errorCode = isOverSize
            ? "commercial_or_high_rise"
            : "measurement_unavailable";
          await writeManualQuoteLead(supabase, contractor_id, {
            name, email, phone, address, timeline, financing_interest, sms_consent,
            trip_reason: trip,
          });
          return NextResponse.json(
            {
              error: isOverSize
                ? "This roof measures larger than our calculator handles — usually a commercial building or multi-unit property. Your details were sent over for a free on-site quote."
                : "We couldn't get an exact satellite measurement on this roof. Your details were sent over for a free on-site quote.",
              error_code: errorCode,
              measurement_status: "needs_manual_quote",
              confidence,
              roof_overlay: roofOverlay,
            },
            { status: 422 }
          );
        }
      }
    }

    const detailDisplay = isFallback
      ? `Estimated from property records · ${firstEstFinal.roof_area_sqft.toLocaleString()} sqft roof (less precise — satellite view was unclear)`
      : `Based on ${firstEstFinal.roof_area_sqft.toLocaleString()} sqft roof · ${firstEstFinal.is_satellite ? "satellite-measured" : "estimated"}`;

    // Step 5: Return full response.
    // Track D.5 Option-A §0 post-mortem: cross-layer fields surfaced so Gate-2
    // G2 can assert `measurement_runs.horiz_sqft === sqft_used_for_estimate`
    // and `pipeline` response field matches the actual data source feeding
    // calculateEstimate (not just telemetry winner).
    return NextResponse.json({
      estimates,
      show_roof_details: showRoofDetails,
      roof_data: {
        roof_area_sqft: firstEst.roof_area_sqft,
        pitch_degrees: firstEst.pitch_degrees,
        num_segments: firstEst.num_segments,
        is_satellite: firstEst.is_satellite,
        detail_display: detailDisplay,
      },
      pipeline: pipelineUsed,
      confidence,
      roof_overlay: roofOverlay,
      sqft_used_for_estimate: firstEst.roof_area_sqft,
      lidar_gate_status: pipelineResult?.lidarGateStatus ?? null,
      measurement_run_id: pipelineResult?.telemetryRowId ?? null,
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
