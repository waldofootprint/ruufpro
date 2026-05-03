// Full estimate calculation engine.
//
// This is the brain of the estimate widget. It takes roof data (from Solar API
// or manual input) and a contractor's pricing, then calculates a best estimate
// with an itemized breakdown, displayed as a ±15% range.
//
// How it works:
// 1. Compute a midpoint estimate using the average of low/high rates
// 2. Apply itemized adjustments (waste, accessories, pitch, tear-off, penetrations)
// 3. Display as midpoint ± a roofer-set symmetric range (default 10%)
//
// This approach avoids the "low-everything vs high-everything" compounding
// problem that made the old range 85% wide. The ±range is tight enough to be
// useful to homeowners while honest about inspection-level unknowns.

// Shared disclaimer — used across estimate widget, chat estimate card, PDFs, and system prompt.
// Keep this in ONE place so all surfaces stay consistent for legal protection.
export const ESTIMATE_DISCLAIMER = "Ballpark estimate based on satellite measurements — not a binding quote. A free on-site inspection will give you exact numbers.";

import type { RoofData } from "./solar-api";
import type { RoofGeometry } from "./roof-geometry";

// ----- TYPES -----

export type RoofMaterial = "asphalt" | "metal" | "tile" | "flat";

export interface ContractorRates {
  asphalt_low: number;
  asphalt_high: number;
  metal_low: number;
  metal_high: number;
  tile_low: number;
  tile_high: number;
  flat_low: number;
  flat_high: number;
}

export type PitchCategory = "flat" | "low" | "moderate" | "steep";

export interface EstimateInput {
  // From Solar API (V2 path)
  roofData?: RoofData;
  geometry?: RoofGeometry;

  // From homeowner (V1 fallback path)
  bedrooms?: number;
  roofType?: "gable" | "hip" | "flat";

  // From homeowner (both paths)
  pitchCategory?: PitchCategory; // homeowner's cross-check of Solar API pitch
  currentMaterial?: RoofMaterial; // what's currently on the roof (affects tear-off)
  shingleLayers: 1 | 2 | "not_sure";
  material: RoofMaterial; // desired material

  // PRICING.1c-corrected (2026-04-24): resolved roof shape class drives the
  // complexity multiplier in calculateEstimate. Resolver lives in
  // /api/estimate/route.ts (widget input wins, else auto from Pipeline A).
  // Required input — calculateEstimate no longer derives complexity from
  // numSegments (HARD RULE per feedback_no_segcount_pricing_signal.md).
  roofShapeClass: RoofShapeClass;

  // Lead qualification (doesn't affect price, captured for the roofer)
  timeline?: "no_timeline" | "1_3_months" | "now";
  financingInterest?: "yes" | "no" | "maybe";

  // From contractor's dashboard settings
  rates: ContractorRates;
  bufferPercent?: number; // contractor's safety buffer (0-20%)

  // Minimum job price floor. If the computed midpoint comes in below this,
  // we lift the midpoint to the floor before applying the ±band. Matches how
  // Roofle handles small roofs (they won't quote a 2,000 sqft roof at $12K
  // because no roofer will show up to do it for that price).
  minimumJobPrice?: number;
}

export interface EstimateResult {
  priceLow: number;
  priceHigh: number;
  roofAreaSqft: number;
  pitchDegrees: number;
  numSegments: number;
  isFromSatellite: boolean; // true = Solar API, false = manual estimate

  // Breakdown (useful for debugging and for showing the homeowner)
  breakdown: {
    materialCostLow: number;
    materialCostHigh: number;
    pitchMultiplier: number;
    wasteFactor: number;
    bufferPercent: number;
    accessoryCost: number;
    tearoffCost: number;
    penetrationCost: number;
  };
}

// ----- LOOKUP TABLES -----

// Pitch multiplier: steeper roofs cost more in labor (harder to walk on,
// need safety equipment, take longer)
export function getPitchMultiplier(pitchDegrees: number): number {
  if (pitchDegrees <= 18) return 1.0; // Low slope — easy to walk
  if (pitchDegrees <= 22) return 1.05;
  if (pitchDegrees <= 26) return 1.1; // Standard walkable
  if (pitchDegrees <= 30) return 1.15;
  if (pitchDegrees <= 34) return 1.25; // Steep — harness required
  if (pitchDegrees <= 40) return 1.35;
  return 1.5; // Very steep — specialized equipment
}

// Cross-check: if the homeowner's pitch category disagrees significantly
// with the Solar API pitch, use the more conservative (higher) value.
// This catches cases where satellite data underestimates steepness.
const PITCH_CATEGORY_DEGREES: Record<string, number> = {
  flat: 5,
  low: 18,
  moderate: 28,
  steep: 38,
};

function crossCheckPitch(
  solarPitchDegrees: number,
  homeownerCategory?: string
): number {
  if (!homeownerCategory) return solarPitchDegrees;
  const homeownerPitch = PITCH_CATEGORY_DEGREES[homeownerCategory] || solarPitchDegrees;
  // Use the higher of the two — more conservative = safer for contractor
  return Math.max(solarPitchDegrees, homeownerPitch);
}

export type RoofShapeClass = "simple_gable" | "hip" | "complex_multiplane";

// PRICING.1c-corrected (2026-04-24): replaces PRICING.1b segs-keyed design.
// Segment count is a Pipeline-A-drift-prone signal (±4–10% run-to-run at
// fixed hash) — banned from pricing path per feedback_no_segcount_pricing_signal.
// Shape class is a stable fixture/widget/auto-resolver input; size is a
// discrete runtime `sqft` bucket. Multiplicative, not additive. Compound
// range 1.00× (small simple_gable) → 1.32× (large hip). Calibrated against
// Roofle D.5 bench implied rates ($6.46 small-simple → $8.26 large-complex,
// with hip > complex_multiplane per back-calc in
// memory/project_pricing_1c_corrected_direction.md).
export function getSizeShapeMultiplier(
  sqft: number,
  shapeClass: RoofShapeClass,
): number {
  const sizeMult =
    sqft < 2000 ? 1.00 :
    sqft <= 4000 ? 1.02 :
    1.10;
  const complexityMult =
    shapeClass === "simple_gable" ? 1.00 :
    shapeClass === "complex_multiplane" ? 1.05 :
    1.20; // hip
  return sizeMult * complexityMult;
}

// Shape-class resolver — widget input wins, else auto-classify from Pipeline A
// geometry. Returns both the resolved class and the source for telemetry
// (written to measurement_runs.shape_class_source per migration 084).
//
// alphaHullRatio (roof_alpha_area_sqft / roof_horiz_sqft, threshold <0.85)
// is specified in scoping §3.4 but Pipeline A @ 8695096 does not plumb
// alpha_area_sqft through services/lidar-measure/app.py → LidarResult
// (Modal-deployed code frozen per scoping §5.1). Until a future Pipeline A
// re-open exposes alphaAreaSqft, the resolver degrades gracefully to
// compactness-only. Safe-middle default is hip when auto has insufficient
// signal.
export type ShapeClassSource = "widget" | "auto_complex" | "auto_hip_default";

export function resolveShapeClass(
  widgetShapeClass: RoofShapeClass | "not_sure" | null | undefined,
  horizSqft: number | null | undefined,
  alphaAreaSqft: number | null | undefined,
  perimeterFt: number | null | undefined,
): { shapeClass: RoofShapeClass; source: ShapeClassSource } {
  if (widgetShapeClass && widgetShapeClass !== "not_sure") {
    return { shapeClass: widgetShapeClass, source: "widget" };
  }

  // Auto-classify from stable Pipeline A fields.
  const alphaHullOk =
    alphaAreaSqft != null &&
    alphaAreaSqft > 0 &&
    horizSqft != null &&
    horizSqft > 0;
  const compactnessOk =
    horizSqft != null &&
    horizSqft > 0 &&
    perimeterFt != null &&
    perimeterFt > 0;

  const alphaHullRatio = alphaHullOk ? alphaAreaSqft! / horizSqft! : null;
  const compactness = compactnessOk
    ? (4 * Math.PI * horizSqft!) / (perimeterFt! * perimeterFt!)
    : null;

  const alphaFlagsComplex = alphaHullRatio != null && alphaHullRatio < 0.85;
  const compactFlagsComplex = compactness != null && compactness < 0.5;

  if (alphaFlagsComplex || compactFlagsComplex) {
    return { shapeClass: "complex_multiplane", source: "auto_complex" };
  }
  return { shapeClass: "simple_gable", source: "auto_hip_default" };
}

// Waste factor: more complex roofs (more segments) need more extra material
// because of cuts at hips, valleys, and edges. When the roof area came from
// the MS Footprints fallback (no segment count available — synthesized from
// a polygon × pitch factor), pick the middle 18% so we don't systematically
// under-price complex roofs that the Footprints path can't see.
export function getWasteFactor(
  numSegments: number,
  source?: RoofData["source"]
): number {
  if (source === "ms_footprints") return 1.18;
  if (numSegments <= 2) return 1.1; // Simple gable: 10% waste
  if (numSegments <= 4) return 1.15; // Moderate: 15%
  if (numSegments <= 6) return 1.18; // Complex: 18%
  return 1.22; // Very complex hip: 22%
}

// Penetration cost estimate: chimneys, vents, skylights add flashing labor
function getPenetrationCost(roofAreaSqft: number): number {
  if (roofAreaSqft < 1500) return 400;
  if (roofAreaSqft < 2500) return 600;
  return 800;
}

// Tear-off cost per sqft when there are 2 existing layers
const TEAROFF_RATE = 1.25; // $/sqft midpoint

// Accessory costs per linear foot (midpoints)
const RIDGE_CAP_RATE = 3.25;
const HIP_FLASH_RATE = 4.0;
const VALLEY_FLASH_RATE = 5.0;
const STARTER_STRIP_RATE = 2.0;

// No separate overhead markup — the contractor's $/sqft rate already includes
// their overhead and profit. Adding a markup on top would double-count.
// The add-ons (waste, accessories, penetrations, pitch) are quantity-based
// adjustments, not pricing markups.

// V1 fallback: estimate home sqft from bedroom count
const BEDROOM_SQFT_MAP: Record<number, number> = {
  1: 750,
  2: 1100,
  3: 1500,
  4: 2000,
  5: 2800,
};

// V1 fallback: roof area multiplier by roof type
const ROOF_TYPE_FACTOR: Record<string, number> = {
  gable: 1.3,
  hip: 1.4,
  flat: 1.05,
};

// ----- MAIN CALCULATION -----

export function calculateEstimate(input: EstimateInput): EstimateResult {
  let roofAreaSqft: number;
  let pitchDegrees: number;
  let numSegments: number;
  let isFromSatellite: boolean;

  // Determine roof area and pitch from either Solar API or manual input
  if (input.roofData) {
    // V2 path: satellite data + homeowner cross-check
    roofAreaSqft = input.roofData.roofAreaSqft;
    // Cross-check: use the more conservative of Solar API pitch vs homeowner input
    pitchDegrees = crossCheckPitch(input.roofData.pitchDegrees, input.pitchCategory);
    numSegments = input.roofData.numSegments;
    isFromSatellite = true;
  } else {
    // V1 fallback: estimate from bedroom count + roof type
    const bedrooms = input.bedrooms || 3;
    const homeSqft = BEDROOM_SQFT_MAP[bedrooms] || 1500;
    const roofTypeFactor = ROOF_TYPE_FACTOR[input.roofType || "gable"] || 1.3;
    roofAreaSqft = homeSqft * roofTypeFactor;
    // Use homeowner's pitch category if available, otherwise assume moderate
    pitchDegrees = PITCH_CATEGORY_DEGREES[input.pitchCategory || "moderate"] || 22;
    numSegments = input.roofType === "hip" ? 4 : 2;
    isFromSatellite = false;
  }

  // Get all multipliers
  const pitchMultiplier = getPitchMultiplier(pitchDegrees);
  const wasteFactor = getWasteFactor(numSegments, input.roofData?.source);
  const penetrationCost = getPenetrationCost(roofAreaSqft);

  // Get contractor's rates — use MIDPOINT for the best estimate
  const rateLow = input.rates[`${input.material}_low` as keyof ContractorRates] || 0;
  const rateHigh = input.rates[`${input.material}_high` as keyof ContractorRates] || 0;
  const rateBaseMid = (rateLow + rateHigh) / 2;

  // PRICING.1c-corrected (2026-04-24): size + shape-class multiplier on the
  // effective $/sqft rate. Replaces PRICING.1b segs-keyed design — segs
  // drifts run-to-run at fixed Pipeline A hash (±4–10%), so pricing on it
  // produces non-deterministic prices. shapeClass is resolved in the route
  // (widget input wins, else auto). Hip > complex_multiplane > simple_gable
  // per back-calc against Roofle D.5 bench implied rates.
  const sizeShapeMultiplier = getSizeShapeMultiplier(roofAreaSqft, input.roofShapeClass);
  const rateMid = rateBaseMid * sizeShapeMultiplier;

  // Detect if contractor has set custom rates (not using regional defaults).
  // A contractor who KNOWS their pricing sets a tight spread (e.g. $3.10-$3.30 = 1.065 ratio).
  // Regional defaults have wider spreads (1.15-1.33 ratio).
  // Threshold 1.15: tighter = contractor-configured (itemized), wider = defaults (bundled).
  // (Phase-2 deferred per decisions/2026-05-01-phase-1-shippable-calculator.md:
  //  replace this heuristic with an explicit pricing_mode setting.)
  const isContractorConfigured = rateHigh > 0 && rateLow > 0 && (rateHigh / rateLow) < 1.15;

  // In BUNDLED MODE the $/sqft rate is already an all-in installed price that
  // typical waste and typical pitch are baked into. Applying the multipliers on
  // top double-counts and inflates homeowner-facing prices ~40% vs competitors
  // like Roofle. In ITEMIZED MODE the rate is material+labor only, so waste and
  // pitch are legitimate line items.
  const effectiveWasteFactor = isContractorConfigured ? wasteFactor : 1.0;
  const effectivePitchMultiplier = isContractorConfigured ? pitchMultiplier : 1.0;

  // Material cost at midpoint (area × waste × $/sqft)
  const materialSqft = roofAreaSqft * effectiveWasteFactor;
  const materialCost = materialSqft * rateMid;

  // --- BUNDLED vs ITEMIZED MODE ---
  // When using regional defaults, the $/sqft rate is an all-in industry average
  // that already includes accessories, penetrations, and typical tear-off costs.
  // Adding them separately would double-count and inflate the estimate.
  //
  // When a contractor has configured their own rates, those are material+labor
  // rates and we SHOULD add accessories/penetrations/tear-off separately for
  // a transparent, itemized breakdown — that's our differentiator.

  let accessoryCost: number;
  let tearoffCost = 0;
  let effectivePenetrationCost: number;

  if (isContractorConfigured) {
    // ITEMIZED MODE: contractor's rates are specific — add real line items

    // Accessory costs (from geometric inference or estimate)
    if (input.geometry) {
      accessoryCost =
        input.geometry.ridgeLengthFt * RIDGE_CAP_RATE +
        input.geometry.hipLengthFt * HIP_FLASH_RATE +
        input.geometry.valleyLengthFt * VALLEY_FLASH_RATE +
        input.geometry.perimeterFt * STARTER_STRIP_RATE;
    } else {
      // No geometry data — accessories are roughly 10% of material cost
      accessoryCost = materialCost * 0.10;
    }

    // Tear-off cost (only when homeowner says they have 2 layers)
    if (input.shingleLayers === 2) {
      tearoffCost = roofAreaSqft * TEAROFF_RATE;
    } else if (input.shingleLayers === "not_sure") {
      tearoffCost = roofAreaSqft * TEAROFF_RATE * 0.4;
    }

    effectivePenetrationCost = penetrationCost;
  } else {
    // BUNDLED MODE: regional defaults are all-in — skip separate adders
    // The $/sqft rate already accounts for typical accessories, penetrations,
    // and single-layer tear-off. Only add tear-off for confirmed 2-layer roofs.
    accessoryCost = 0;
    effectivePenetrationCost = 0;

    if (input.shingleLayers === 2) {
      // Confirmed 2-layer = extra tear-off beyond what's in the regional rate
      tearoffCost = roofAreaSqft * TEAROFF_RATE;
    }
    // "not_sure" gets no adder in bundled mode — regional rate covers typical case
  }

  // Pitch multiplier applies to labor-intensive costs (material install + tear-off)
  // Accessories and penetrations are less affected by pitch.
  // Skipped in bundled mode — see effectivePitchMultiplier note above.
  const pitchAdjustedMaterial = materialCost * effectivePitchMultiplier;
  const pitchAdjustedTearoff = tearoffCost * effectivePitchMultiplier;
  const pitchAdjustedPenetrations = effectivePenetrationCost * effectivePitchMultiplier;

  // Subtotal — no overhead markup (rate already includes it).
  const rawMid = Math.round(pitchAdjustedMaterial + accessoryCost + pitchAdjustedTearoff + pitchAdjustedPenetrations);

  // Mode A (Session AZ): minimum job price floor. If the contractor has set
  // a floor and our computed midpoint is below it, lift the midpoint up.
  // Small roofs that formulaically come in at $13K on a $5.50/sqft rate get
  // pulled up to the roofer's realistic minimum (e.g. $20K). Applied
  // before the ±band so the whole range moves together.
  const floor = input.minimumJobPrice || 0;
  const midEstimate = floor > 0 && rawMid < floor ? floor : rawMid;

  // Apply roofer-set symmetric range (Phase 1 collapse: was buffer + band,
  // now a single ± value owned by the contractor in Settings → Estimates).
  const range = input.bufferPercent ?? 10;
  const priceLow = Math.round(midEstimate * (1 - range / 100));
  const priceHigh = Math.round(midEstimate * (1 + range / 100));

  return {
    priceLow,
    priceHigh,
    roofAreaSqft: Math.round(roofAreaSqft),
    pitchDegrees: Math.round(pitchDegrees * 10) / 10,
    numSegments,
    isFromSatellite,
    breakdown: {
      materialCostLow: Math.round(materialCost),
      materialCostHigh: Math.round(materialCost), // same — midpoint-based now
      pitchMultiplier: effectivePitchMultiplier,
      wasteFactor: effectiveWasteFactor,
      bufferPercent: range,
      accessoryCost: Math.round(accessoryCost),
      tearoffCost: Math.round(tearoffCost),
      penetrationCost: Math.round(effectivePenetrationCost),
    },
  };
}

// ----- HELPER: Format price for display -----

export function formatEstimate(result: EstimateResult): {
  range: string;
  detail: string;
} {
  const low = result.priceLow.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const high = result.priceHigh.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const source = result.isFromSatellite ? "satellite-measured" : "estimated";
  const pitchDisplay =
    Math.round(Math.tan((result.pitchDegrees * Math.PI) / 180) * 12) + "/12";

  return {
    range: `${low} - ${high}`,
    detail: `Based on ${result.roofAreaSqft.toLocaleString()} sqft roof · ${pitchDisplay} pitch · ${source}`,
  };
}
