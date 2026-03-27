// Regional pricing defaults.
//
// When a roofer first configures their estimate widget, we suggest
// $/sqft rates based on their region. This prevents two problems:
// 1. New roofers who don't know what to enter
// 2. Roofers who enter wildly wrong numbers (corrupting their estimates)
//
// These are industry averages — the roofer adjusts to match their actual pricing.
// Over time, we'll improve these from anonymized data from our own roofers.
//
// Sources: RSMeans, HomeAdvisor, Angi cost guides (2024-2026 averages)

interface RegionalRates {
  asphalt_low: number;
  asphalt_high: number;
  metal_low: number;
  metal_high: number;
  tile_low: number;
  tile_high: number;
  flat_low: number;
  flat_high: number;
}

// Regional pricing by broad US region.
// In V2.1 we can make this per-state or per-ZIP using ATTOM data.
const REGIONAL_DEFAULTS: Record<string, RegionalRates> = {
  // Southeast / Sun Belt — lower labor costs, high storm demand
  southeast: {
    asphalt_low: 3.25, asphalt_high: 4.75,
    metal_low: 6.50,   metal_high: 9.50,
    tile_low: 7.50,    tile_high: 11.00,
    flat_low: 3.75,    flat_high: 5.50,
  },
  // Northeast — higher labor costs, seasonal demand
  northeast: {
    asphalt_low: 4.00, asphalt_high: 6.00,
    metal_low: 7.50,   metal_high: 11.00,
    tile_low: 9.00,    tile_high: 13.00,
    flat_low: 4.50,    flat_high: 6.50,
  },
  // Midwest — moderate costs, storm and winter demand
  midwest: {
    asphalt_low: 3.50, asphalt_high: 5.25,
    metal_low: 7.00,   metal_high: 10.00,
    tile_low: 8.00,    tile_high: 12.00,
    flat_low: 4.00,    flat_high: 6.00,
  },
  // West — higher costs, fire and earthquake building codes
  west: {
    asphalt_low: 4.25, asphalt_high: 6.50,
    metal_low: 8.00,   metal_high: 12.00,
    tile_low: 9.50,    tile_high: 14.00,
    flat_low: 5.00,    flat_high: 7.50,
  },
  // Southwest — moderate, high tile demand
  southwest: {
    asphalt_low: 3.50, asphalt_high: 5.00,
    metal_low: 7.00,   metal_high: 10.50,
    tile_low: 8.50,    tile_high: 12.50,
    flat_low: 4.00,    flat_high: 6.00,
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
