// Regional pricing defaults.
//
// When a roofer first configures their estimate widget, we suggest
// $/sqft rates based on their region. These are MATERIALS + LABOR ONLY
// rates — waste, accessories, penetrations, and overhead are calculated
// separately by the estimate engine. This avoids double-counting.
//
// The _low and _high values define the range for the ±band display.
// The midpoint ((low + high) / 2) is used as the best estimate.
//
// Sources: RSMeans material+labor rates, HomeAdvisor contractor surveys,
// Instant Roofer/Roofr reverse-engineered rates (2024-2026)
//
// PRICING.1 recalibration (2026-04-23): rates raised ~1.85× to reflect
// ALL-IN installed cost (materials + labor + overhead + profit + typical
// pitch + typical waste) BEFORE the size/shape multiplier in
// `calculateEstimate`. Previously these were materials+labor only, which
// undershot Roofle/Roofr published demos by 30-40% in the southeast.
// Back-calibrated from D.5 bench: Roofle implied $6.46-$8.26/sqft for FL
// asphalt (small simple → large complex); our rate × size/shape multiplier
// (1.00× → 1.35×) must land in that envelope. See
// decisions/pricing-market-defaults-scoping.md.

export interface RegionalRates {
  asphalt_low: number;
  asphalt_high: number;
  metal_low: number;
  metal_high: number;
  tile_low: number;
  tile_high: number;
  flat_low: number;
  flat_high: number;
}

// Regional pricing by broad US region (materials + labor, NOT all-in).
// Overhead/profit markup is applied separately in the estimate engine.
//
// IMPORTANT: Keep low/high spread under 20% so the output band stays tight.
// Old defaults had 30-45% spread which compounded into 85% output ranges.
// These tightened rates reflect 2025-2026 market midpoints with ±10% spread.
const REGIONAL_DEFAULTS: Record<string, RegionalRates> = {
  // Southeast / Sun Belt — lower labor costs, high storm demand.
  // PRICING.1c-corrected (2026-04-24): asphalt band raised to ±4% around
  // Roofle small-simple anchor $6.46 per scoping §0 Q1=c. Preserves
  // homeowner-facing band signal without re-anchoring the mid.
  southeast: {
    asphalt_low: 6.20, asphalt_high: 6.72,
    metal_low: 11.00,  metal_high: 13.00,
    tile_low: 13.00,   tile_high: 15.75,
    flat_low: 5.55,    flat_high: 6.95,
  },
  // Northeast — higher labor costs, seasonal demand
  northeast: {
    asphalt_low: 6.50, asphalt_high: 7.85,
    metal_low: 12.95,  metal_high: 15.75,
    tile_low: 15.75,   tile_high: 19.45,
    flat_low: 6.95,    flat_high: 8.80,
  },
  // Midwest — moderate costs, storm and winter demand
  midwest: {
    asphalt_low: 5.55, asphalt_high: 6.95,
    metal_low: 12.05,  metal_high: 14.80,
    tile_low: 13.90,   tile_high: 17.60,
    flat_low: 6.00,    flat_high: 7.85,
  },
  // West — higher costs, fire and earthquake building codes
  west: {
    asphalt_low: 6.95, asphalt_high: 8.80,
    metal_low: 13.90,  metal_high: 17.60,
    tile_low: 16.65,   tile_high: 21.30,
    flat_low: 7.40,    flat_high: 9.70,
  },
  // Southwest — moderate, high tile demand
  southwest: {
    asphalt_low: 5.40, asphalt_high: 6.50,
    metal_low: 12.05,  metal_high: 14.80,
    tile_low: 13.90,   tile_high: 18.50,
    flat_low: 5.55,    flat_high: 7.40,
  },
};

// Map US states to regions
const STATE_REGIONS: Record<string, string> = {
  // Southeast
  AL: "southeast", FL: "southeast", GA: "southeast", SC: "southeast",
  NC: "southeast", TN: "southeast", MS: "southeast", LA: "southeast",
  AR: "southeast", VA: "southeast",
  // Southwest
  TX: "southwest", OK: "southwest", NM: "southwest", AZ: "southwest",
  // West
  CA: "west", OR: "west", WA: "west", NV: "west", CO: "west",
  UT: "west", ID: "west", MT: "west", WY: "west", HI: "west", AK: "west",
  // Northeast
  NY: "northeast", NJ: "northeast", PA: "northeast", CT: "northeast",
  MA: "northeast", RI: "northeast", NH: "northeast", VT: "northeast",
  ME: "northeast", MD: "northeast", DE: "northeast", DC: "northeast",
  WV: "northeast",
  // Midwest
  OH: "midwest", MI: "midwest", IN: "midwest", IL: "midwest",
  WI: "midwest", MN: "midwest", IA: "midwest", MO: "midwest",
  KS: "midwest", NE: "midwest", SD: "midwest", ND: "midwest",
  KY: "midwest",
};

// Get suggested pricing for a roofer based on their state
export function getRegionalDefaults(state: string): RegionalRates {
  const region = STATE_REGIONS[state.toUpperCase()] || "southeast";
  return REGIONAL_DEFAULTS[region];
}

// Get the region name for display
export function getRegionName(state: string): string {
  const region = STATE_REGIONS[state.toUpperCase()] || "southeast";
  const names: Record<string, string> = {
    southeast: "Southeast / Sun Belt",
    northeast: "Northeast",
    midwest: "Midwest",
    west: "West Coast / Mountain",
    southwest: "Southwest / Texas",
  };
  return names[region] || "your area";
}

// Enhanced pricing: uses BLS metro-level data when city/ZIP available,
// falls back to 5-region defaults otherwise.
export { getMetroDefaults, getMetroName } from "./metro-pricing";
