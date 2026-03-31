// Full estimate calculation engine.
//
// This is the brain of the estimate widget. It takes roof data (from Solar API
// or manual input) and a contractor's pricing, then calculates a price range
// accounting for: materials, labor (pitch-adjusted), waste, accessories
// (ridge cap, hip/valley flashing, starter strip), tear-off, and penetrations.
//
// The output is always a LOW-HIGH range, never a single number. This is
// intentional — it sets expectations that an inspection is needed for exact
// pricing, which is the CTA that converts the estimate into a lead.

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
function getPenetrationCost(roofAreaSqft: number): { low: number; high: number } {
  if (roofAreaSqft < 1500) return { low: 300, high: 500 };
  if (roofAreaSqft < 2500) return { low: 450, high: 750 };
  return { low: 600, high: 1000 };
}

// Tear-off cost per sqft when there are 2 existing layers
const TEAROFF_RATE_LOW = 1.0; // $/sqft
const TEAROFF_RATE_HIGH = 1.5; // $/sqft

// Accessory costs per linear foot
const RIDGE_CAP_LOW = 2.5;
const RIDGE_CAP_HIGH = 4.0;
const HIP_FLASH_LOW = 3.0;
const HIP_FLASH_HIGH = 5.0;
const VALLEY_FLASH_LOW = 4.0;
const VALLEY_FLASH_HIGH = 6.0;
const STARTER_STRIP_LOW = 1.5;
const STARTER_STRIP_HIGH = 2.5;

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
  const penetration = getPenetrationCost(roofAreaSqft);
  const weatherSurge = input.weatherSurgeMultiplier || 1.0;

  // Get contractor's rates for the selected material
  const rateLow = input.rates[`${input.material}_low` as keyof ContractorRates] || 0;
  const rateHigh = input.rates[`${input.material}_high` as keyof ContractorRates] || 0;

  // Material cost (area × waste × $/sqft)
  const materialSqft = roofAreaSqft * wasteFactor;
  const materialCostLow = materialSqft * rateLow;
  const materialCostHigh = materialSqft * rateHigh;

  // Accessory costs (from geometric inference)
  let accessoryCostLow = 0;
  let accessoryCostHigh = 0;

  if (input.geometry) {
    accessoryCostLow =
      input.geometry.ridgeLengthFt * RIDGE_CAP_LOW +
      input.geometry.hipLengthFt * HIP_FLASH_LOW +
      input.geometry.valleyLengthFt * VALLEY_FLASH_LOW +
      input.geometry.perimeterFt * STARTER_STRIP_LOW;

    accessoryCostHigh =
      input.geometry.ridgeLengthFt * RIDGE_CAP_HIGH +
      input.geometry.hipLengthFt * HIP_FLASH_HIGH +
      input.geometry.valleyLengthFt * VALLEY_FLASH_HIGH +
      input.geometry.perimeterFt * STARTER_STRIP_HIGH;
  } else {
    // No geometry data — rough estimate based on roof area
    // Average accessory cost is roughly 8-12% of material cost
    accessoryCostLow = materialCostLow * 0.08;
    accessoryCostHigh = materialCostHigh * 0.12;
  }

  // Tear-off cost (only when homeowner says they have 2 layers)
  let tearoffCostLow = 0;
  let tearoffCostHigh = 0;

  if (input.shingleLayers === 2) {
    tearoffCostLow = roofAreaSqft * TEAROFF_RATE_LOW;
    tearoffCostHigh = roofAreaSqft * TEAROFF_RATE_HIGH;
  } else if (input.shingleLayers === "not_sure") {
    // Widen the range to account for possible tear-off
    tearoffCostHigh = roofAreaSqft * TEAROFF_RATE_HIGH * 0.5; // 50% chance factored in
  }

  // Contractor buffer: widens the HIGH end only, giving the contractor
  // a safety margin for unknowns found during inspection
  const bufferMultiplier = 1 + (input.bufferPercent || 0) / 100;

  // Assemble final price
  // Pitch multiplier applies to material, tear-off, and penetration costs
  // (steep roofs make all labor harder, not just shingle installation)
  const priceLow = Math.round(
    (materialCostLow * pitchMultiplier +
      accessoryCostLow +
      tearoffCostLow * pitchMultiplier +
      penetration.low * pitchMultiplier) *
      weatherSurge
  );

  const priceHigh = Math.round(
    (materialCostHigh * pitchMultiplier +
      accessoryCostHigh +
      tearoffCostHigh * pitchMultiplier +
      penetration.high * pitchMultiplier) *
      weatherSurge *
      bufferMultiplier // buffer only affects the high end
  );

  return {
    priceLow,
    priceHigh,
    roofAreaSqft: Math.round(roofAreaSqft),
    pitchDegrees: Math.round(pitchDegrees * 10) / 10,
    numSegments,
    isFromSatellite,
    breakdown: {
      materialCostLow: Math.round(materialCostLow),
      materialCostHigh: Math.round(materialCostHigh),
      pitchMultiplier,
      wasteFactor,
      bufferPercent: input.bufferPercent || 0,
      accessoryCost: Math.round((accessoryCostLow + accessoryCostHigh) / 2),
      tearoffCost: Math.round((tearoffCostLow + tearoffCostHigh) / 2),
      penetrationCost: Math.round((penetration.low + penetration.high) / 2),
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
