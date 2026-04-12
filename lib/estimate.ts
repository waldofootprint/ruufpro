// Full estimate calculation engine.
//
// This is the brain of the estimate widget. It takes roof data (from Solar API
// or manual input) and a contractor's pricing, then calculates a best estimate
// with an itemized breakdown, displayed as a ±15% range.
//
// How it works:
// 1. Compute a midpoint estimate using the average of low/high rates
// 2. Apply itemized adjustments (waste, accessories, pitch, tear-off, penetrations)
// 3. Display as midpoint ±15% (or ±10% when contractor has set their own rate)
//
// This approach avoids the "low-everything vs high-everything" compounding
// problem that made the old range 85% wide. The ±band is tight enough to be
// useful to homeowners while honest about inspection-level unknowns.

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

  // Lead qualification (doesn't affect price, captured for the roofer)
  timeline?: "no_timeline" | "1_3_months" | "now";
  financingInterest?: "yes" | "no" | "maybe";

  // From contractor's dashboard settings
  rates: ContractorRates;
  bufferPercent?: number; // contractor's safety buffer (0-20%)

  // Weather surge (from NOAA monitoring, if active)
  weatherSurgeMultiplier?: number;
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
    weatherSurge: number;
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

// Waste factor: more complex roofs (more segments) need more extra material
// because of cuts at hips, valleys, and edges
export function getWasteFactor(numSegments: number): number {
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

// Default uncertainty band: ±10% for regional defaults, ±8% for contractor-set rates.
// Old values (15/10) produced ranges too wide vs competitors (Roofr ±5%, Instant Roofer ±9%).
// ±10% matches industry standard for satellite estimates per insurance/contractor surveys.
const DEFAULT_BAND_PERCENT = 10;
const CONTRACTOR_BAND_PERCENT = 8;

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
  const wasteFactor = getWasteFactor(numSegments);
  const penetrationCost = getPenetrationCost(roofAreaSqft);
  const weatherSurge = input.weatherSurgeMultiplier || 1.0;

  // Get contractor's rates — use MIDPOINT for the best estimate
  const rateLow = input.rates[`${input.material}_low` as keyof ContractorRates] || 0;
  const rateHigh = input.rates[`${input.material}_high` as keyof ContractorRates] || 0;
  const rateMid = (rateLow + rateHigh) / 2;

  // Detect if contractor has set custom rates (not using regional defaults).
  // A contractor who KNOWS their pricing sets a tight spread (e.g. $3.10-$3.30 = 1.065 ratio).
  // Regional defaults have wider spreads (1.15-1.33 ratio).
  // Threshold 1.15: tighter = contractor-configured (itemized), wider = defaults (bundled).
  const isContractorConfigured = rateHigh > 0 && rateLow > 0 && (rateHigh / rateLow) < 1.15;
  const bandPercent = isContractorConfigured ? CONTRACTOR_BAND_PERCENT : DEFAULT_BAND_PERCENT;

  // Material cost at midpoint (area × waste × $/sqft)
  const materialSqft = roofAreaSqft * wasteFactor;
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
  // Accessories and penetrations are less affected by pitch
  const pitchAdjustedMaterial = materialCost * pitchMultiplier;
  const pitchAdjustedTearoff = tearoffCost * pitchMultiplier;
  const pitchAdjustedPenetrations = effectivePenetrationCost * pitchMultiplier;

  // Subtotal before overhead
  const subtotal = pitchAdjustedMaterial + accessoryCost + pitchAdjustedTearoff + pitchAdjustedPenetrations;

  // Apply weather surge (no overhead markup — rate already includes it)
  const midEstimate = Math.round(subtotal * weatherSurge);

  // Apply ±band to get the range
  const priceLow = Math.round(midEstimate * (1 - bandPercent / 100));
  const priceHigh = Math.round(midEstimate * (1 + bandPercent / 100));

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
      pitchMultiplier,
      wasteFactor,
      bufferPercent: bandPercent,
      accessoryCost: Math.round(accessoryCost),
      tearoffCost: Math.round(tearoffCost),
      penetrationCost: Math.round(effectivePenetrationCost),
      weatherSurge,
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
