// Track D.5-B2 §3.1 — MS polygon area + Solar roofAreaSqft per address.
// Read-only. Zero Modal calls. Zero Pipeline A dispatches. No DB writes.
//
// Inputs: scripts/bench-addresses.json (fixture 2f3c8ea)
// Outputs:
//   .tmp/calculator-bench/d5-b2/ms-areas.json — MS footprint area sqft per address
//   .tmp/calculator-bench/d5-b2/solar-areas.json — Solar wholeRoofStats.areaMeters2 → sqft
//
// Data sources (per scoping doc §3.1):
//   - Google Geocoding API → (lat, lng) per address
//   - Supabase Geospatial project RPC footprint_lookup(lat, lng, 50) → GeoJSON polygon
//   - Google Solar API buildingInsights:findClosest → wholeRoofStats.areaMeters2
//
// Area computation: equirectangular projection at polygon centroid latitude,
// shoelace formula on projected (x_m, y_m). Error <0.1% for FL residential
// polygons up to ~1km. Same method Pipeline A uses in scipy.spatial.ConvexHull
// (which operates on projected 2D XY; Pipeline A projects to UTM first).
//
// Scoping authority: decisions/track-d5-b2-shape-class-hull-diagnostic-scoping.md
//   §3.1 bullet "MS footprint area"
//   §3.1 bullet "Solar `roofAreaSqft`"

import fs from "node:fs";
import path from "node:path";

// --- env bootstrap (same pattern as .tmp/calculator-bench/option-a/query-mruns.mjs) ---
try {
  const envText = fs.readFileSync(".env", "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEO_REF = process.env.SUPABASE_GEOSPATIAL_PROJECT_REF;
const GEO_SECRET = process.env.SUPABASE_GEOSPATIAL_SECRET_KEY;
if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");
if (!GEO_REF || !GEO_SECRET) throw new Error("SUPABASE_GEOSPATIAL_* missing");

const GEO_URL = `https://${GEO_REF}.supabase.co`;

// --- load fixture ---
const fixture = JSON.parse(
  fs.readFileSync(path.resolve("scripts/bench-addresses.json"), "utf8"),
);
const rows = fixture.addresses;

// --- helpers ---
const SQFT_PER_SQM = 10.7639104;

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${GOOGLE_API_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.status !== "OK" || !j.results?.[0]?.geometry?.location) {
    return { lat: null, lng: null, status: j.status };
  }
  const { lat, lng } = j.results[0].geometry.location;
  return { lat, lng, precision: j.results[0].geometry.location_type };
}

/** Equirectangular shoelace on a GeoJSON Polygon. Returns area in sqm. */
function polygonAreaSqm(geojson) {
  if (!geojson || geojson.type !== "Polygon") return null;
  const outer = geojson.coordinates?.[0];
  if (!outer || outer.length < 4) return null;
  // Project to local meters using refLat = centroid lat.
  let sumLat = 0;
  for (const [, lat] of outer) sumLat += lat;
  const refLat = sumLat / outer.length;
  const cosRef = Math.cos((refLat * Math.PI) / 180);
  const xy = outer.map(([lng, lat]) => [
    lng * 111320 * cosRef,
    lat * 110540,
  ]);
  // Shoelace.
  let s = 0;
  for (let i = 0; i < xy.length - 1; i++) {
    s += xy[i][0] * xy[i + 1][1] - xy[i + 1][0] * xy[i][1];
  }
  return Math.abs(s) / 2;
}

async function msFootprint(lat, lng) {
  const url = `${GEO_URL}/rest/v1/rpc/footprint_lookup`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      apikey: GEO_SECRET,
      authorization: `Bearer ${GEO_SECRET}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ lat, lng, max_dist_m: 50 }),
  });
  if (!r.ok) {
    return { found: false, http: r.status, body: await r.text() };
  }
  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { found: false, reason: "no_candidate" };
  }
  const pick = rows[0];
  const geojson = pick.geom_geojson;
  const areaSqm = polygonAreaSqm(geojson);
  return {
    found: true,
    id: pick.id,
    distM: pick.dist_m,
    areaSqm,
    areaSqft: areaSqm ? areaSqm * SQFT_PER_SQM : null,
    vertices: geojson?.coordinates?.[0]?.length ?? null,
  };
}

async function solarArea(lat, lng) {
  // buildingInsights:findClosest — per lib/solar-api.ts:239 contract
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${GOOGLE_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) {
    // retry with lower quality threshold
    const lowUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_API_KEY}`;
    const r2 = await fetch(lowUrl);
    if (!r2.ok) return { found: false, http: r2.status, body: await r2.text() };
    const j2 = await r2.json();
    const ar = j2?.solarPotential?.wholeRoofStats?.areaMeters2;
    return { found: true, quality: j2?.imageryQuality ?? null, areaSqm: ar ?? null, areaSqft: ar ? ar * SQFT_PER_SQM : null, qualityTier: "LOW_OR_MEDIUM" };
  }
  const j = await r.json();
  const ar = j?.solarPotential?.wholeRoofStats?.areaMeters2;
  return {
    found: true,
    quality: j?.imageryQuality ?? null,
    areaSqm: ar ?? null,
    areaSqft: ar ? ar * SQFT_PER_SQM : null,
    qualityTier: "HIGH",
  };
}

// --- main ---
const msOut = [];
const solarOut = [];
for (const row of rows) {
  const addr = row.address;
  const gc = await geocode(addr);
  console.log(`[${row.id}] ${addr}`);
  console.log(`    geocode: ${gc.lat}, ${gc.lng} (${gc.precision ?? gc.status})`);
  const ms = gc.lat != null ? await msFootprint(gc.lat, gc.lng) : { found: false, reason: "no_geocode" };
  console.log(`    MS: ${JSON.stringify(ms)}`);
  const solar = gc.lat != null ? await solarArea(gc.lat, gc.lng) : { found: false, reason: "no_geocode" };
  console.log(`    Solar: areaSqft=${solar.areaSqft ?? "null"} quality=${solar.quality ?? "—"}`);
  msOut.push({ id: row.id, address: addr, geocode: gc, ms });
  solarOut.push({ id: row.id, address: addr, geocode: gc, solar });
  // light pacing
  await new Promise((res) => setTimeout(res, 150));
}
fs.mkdirSync(".tmp/calculator-bench/d5-b2", { recursive: true });
fs.writeFileSync(
  ".tmp/calculator-bench/d5-b2/ms-areas.json",
  JSON.stringify(msOut, null, 2),
);
fs.writeFileSync(
  ".tmp/calculator-bench/d5-b2/solar-areas.json",
  JSON.stringify(solarOut, null, 2),
);
console.log("\nWrote ms-areas.json + solar-areas.json");
