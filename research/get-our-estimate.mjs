/**
 * Calculate RuufPro's estimate for a test address
 * Uses the same calculation engine as the live widget
 */

// Simulate what our calculator produces for a ~2000 sqft Tampa home
// Using Southeast regional defaults since it's Tampa, FL

const SOUTHEAST_RATES = {
  asphalt_low: 4.00, asphalt_high: 6.50,
  metal_low: 8.50,   metal_high: 13.00,
  tile_low: 10.00,   tile_high: 16.00,
  flat_low: 4.50,    flat_high: 7.00,
};

// Simulate a typical Tampa home
// ~2000 sqft living space → ~2600 sqft roof area (gable, 1.3x factor)
// Or if Solar API returns data: let's use realistic numbers
const scenarios = [
  {
    name: 'V2 (Solar API) — Moderate complexity',
    roofAreaSqft: 2400,
    pitchDegrees: 22,
    numSegments: 4,
    isFromSatellite: true,
  },
  {
    name: 'V1 (Manual) — 3 bedroom gable',
    roofAreaSqft: 1500 * 1.3, // 1950 sqft
    pitchDegrees: 28, // moderate
    numSegments: 2,
    isFromSatellite: false,
  },
];

function getPitchMultiplier(degrees) {
  if (degrees <= 18) return 1.0;
  if (degrees <= 22) return 1.05;
  if (degrees <= 26) return 1.1;
  if (degrees <= 30) return 1.15;
  if (degrees <= 34) return 1.25;
  if (degrees <= 40) return 1.35;
  return 1.5;
}

function getWasteFactor(segments) {
  if (segments <= 2) return 1.10;
  if (segments <= 4) return 1.15;
  if (segments <= 6) return 1.18;
  return 1.22;
}

function getPenetrationCost(area) {
  if (area < 1500) return { low: 300, high: 500 };
  if (area < 2500) return { low: 450, high: 750 };
  return { low: 600, high: 1000 };
}

const materials = ['asphalt', 'metal', 'tile', 'flat'];

console.log('=== RuufPro Estimate — Tampa, FL Test Address ===\n');
console.log('Test: ~2000 sqft home, 1 layer shingles, moderate pitch\n');

for (const scenario of scenarios) {
  console.log(`\n--- ${scenario.name} ---`);
  console.log(`  Roof area: ${scenario.roofAreaSqft} sqft`);
  console.log(`  Pitch: ${scenario.pitchDegrees}°`);
  console.log(`  Segments: ${scenario.numSegments}`);
  console.log(`  Satellite: ${scenario.isFromSatellite}`);

  const pitchMult = getPitchMultiplier(scenario.pitchDegrees);
  const wasteFact = getWasteFactor(scenario.numSegments);
  const pen = getPenetrationCost(scenario.roofAreaSqft);

  console.log(`  Pitch multiplier: ${pitchMult}`);
  console.log(`  Waste factor: ${wasteFact}`);

  for (const mat of materials) {
    const rateLow = SOUTHEAST_RATES[`${mat}_low`];
    const rateHigh = SOUTHEAST_RATES[`${mat}_high`];

    const materialSqft = scenario.roofAreaSqft * wasteFact;
    const materialCostLow = materialSqft * rateLow;
    const materialCostHigh = materialSqft * rateHigh;

    // Accessory estimate (no geometry = 8-12% of material)
    const accLow = materialCostLow * 0.08;
    const accHigh = materialCostHigh * 0.12;

    // No tear-off (1 layer)
    const tearLow = 0;
    const tearHigh = 0;

    // Weather surge = 1.0 (no active storms)
    const weather = 1.0;

    // No contractor buffer for this test
    const buffer = 1.0;

    const priceLow = Math.round(
      (materialCostLow * pitchMult + accLow + tearLow * pitchMult + pen.low * pitchMult) * weather
    );
    const priceHigh = Math.round(
      (materialCostHigh * pitchMult + accHigh + tearHigh * pitchMult + pen.high * pitchMult) * weather * buffer
    );

    console.log(`  ${mat.toUpperCase()}: $${priceLow.toLocaleString()} - $${priceHigh.toLocaleString()}`);
  }
}

console.log('\n\n=== With 10% contractor buffer (high end) ===\n');

const s = scenarios[0]; // Solar API scenario
const pitchMult = getPitchMultiplier(s.pitchDegrees);
const wasteFact = getWasteFactor(s.numSegments);
const pen = getPenetrationCost(s.roofAreaSqft);

for (const mat of materials) {
  const rateLow = SOUTHEAST_RATES[`${mat}_low`];
  const rateHigh = SOUTHEAST_RATES[`${mat}_high`];

  const materialSqft = s.roofAreaSqft * wasteFact;
  const materialCostLow = materialSqft * rateLow;
  const materialCostHigh = materialSqft * rateHigh;
  const accLow = materialCostLow * 0.08;
  const accHigh = materialCostHigh * 0.12;
  const pen_ = getPenetrationCost(s.roofAreaSqft);

  const priceLow = Math.round(
    (materialCostLow * pitchMult + accLow + pen_.low * pitchMult) * 1.0
  );
  const priceHigh = Math.round(
    (materialCostHigh * pitchMult + accHigh + pen_.high * pitchMult) * 1.0 * 1.10
  );

  console.log(`${mat.toUpperCase()}: $${priceLow.toLocaleString()} - $${priceHigh.toLocaleString()} (with 10% buffer)`);
}
