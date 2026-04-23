#!/usr/bin/env node
// Track D.5 Ernest fixture-quality + fixture-wide audit.
// Scoping: decisions/track-d5-ernest-fixture-quality-scoping.md
// §3.4 Street View pull for all 10 bench rows using measurement_runs lat/lng.
// §3.1 measurement_runs lat/lng sourced from D.5 run window 2026-04-23T15:53:18Z→15:55:53Z.
// No paid Geocoding calls (G2: zero mr_missing rows).

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = ".tmp/calculator-bench/d5-fixture-quality";
const SV_DIR = join(OUT_DIR, "streetview");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY required");
  process.exit(1);
}

// mr_* fields pulled from measurement_runs at 2026-04-23T15:53:18Z→15:55:53Z (D.5 window)
// pulled via Supabase Management API /database/query, source of truth for lat/lng Pipeline A ran on.
const rows = [
  { id: 1, address: "10632 Brighton Hill Cir S, Jacksonville, FL 32256", county: "Duval",         mr_lat: 30.2082767,  mr_lng: -81.5228272,  mr_run_id: "4f32ef45-bec2-4537-bec6-4c849b92934d", horiz_sqft: 3315.9,  lidar_outcome: "ok" },
  { id: 2, address: "1823 Ernest St, Jacksonville, FL 32204",            county: "Duval",         mr_lat: 30.3192684,  mr_lng: -81.6834253,  mr_run_id: "98a8421b-ad36-4f08-8720-49935fd1fd4b", horiz_sqft: 4231.9,  lidar_outcome: "ok" },
  { id: 3, address: "24 Deer Haven Dr, Ponte Vedra, FL 32082",           county: "St. Johns",     mr_lat: 30.2207353,  mr_lng: -81.4070412,  mr_run_id: "36d8be93-a88f-4b27-a9ed-3d8cc552f1c5", horiz_sqft: 4656.5,  lidar_outcome: "ok" },
  { id: 4, address: "1807 Tall Pines Dr, Largo, FL 33771",               county: "Pinellas",      mr_lat: 27.9001218,  mr_lng: -82.7563111,  mr_run_id: "19c6f09d-f2e6-41f2-8a4d-ad456fc7bf10", horiz_sqft: 1704,    lidar_outcome: "ok" },
  { id: 5, address: "2228 Golf Manor Blvd, Valrico, FL 33596",           county: "Hillsborough",  mr_lat: 27.8757586,  mr_lng: -82.2472399,  mr_run_id: "c4cc1589-db51-47a6-8508-c8cd71669463", horiz_sqft: 4556.77, lidar_outcome: "no_class_6" },
  { id: 6, address: "19943 Tamiami Ave, Tampa, FL 33647",                county: "Hillsborough",  mr_lat: 28.1579637,  mr_lng: -82.3417976,  mr_run_id: "0fdd01be-8440-487c-9620-6ea9ac57b727", horiz_sqft: 2235.6,  lidar_outcome: "ok" },
  { id: 7, address: "9806 Mountain Lake Dr, Orlando, FL 32832",          county: "Orange",        mr_lat: 28.4059073,  mr_lng: -81.2228206,  mr_run_id: "5e39ebe4-eb4f-4e82-8699-e87836846b61", horiz_sqft: 3744.6,  lidar_outcome: "ok" },
  { id: 8, address: "9833 Camberley Cir, Orlando, FL 32836",             county: "Orange",        mr_lat: 28.422716,   mr_lng: -81.5045157,  mr_run_id: "642b3fc0-99e8-4418-b2a7-4ddecca29706", horiz_sqft: 5071.2,  lidar_outcome: "ok" },
  { id: 9, address: "492 Bohannon Blvd, Orlando, FL 32824",              county: "Orange",        mr_lat: 28.3983439,  mr_lng: -81.3880778,  mr_run_id: "72f36c9d-b882-42af-8074-3ab6993bf6a8", horiz_sqft: 2396.1,  lidar_outcome: "ok" },
  { id: 10,address: "420 Stately Shoals Trl, Ponte Vedra, FL 32081",     county: "St. Johns",     mr_lat: 30.0937404,  mr_lng: -81.4210727,  mr_run_id: "025bd5d1-c3be-448a-97f9-999f25778cae", horiz_sqft: 4373.9,  lidar_outcome: "ok" },
];

async function streetViewMeta(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&source=outdoor&key=${GOOGLE_API_KEY}`;
  const r = await fetch(url);
  return r.json();
}

async function downloadStreetView(lat, lng, outPath, { heading = 0, size = "640x640", fov = 90 } = {}) {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&fov=${fov}&source=outdoor&key=${GOOGLE_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`streetview fetch ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outPath, buf);
  return { size_bytes: buf.length, url_template: url.replace(GOOGLE_API_KEY, "REDACTED") };
}

const results = [];
for (const row of rows) {
  const meta = await streetViewMeta(row.mr_lat, row.mr_lng);
  const files = [];
  if (meta.status === "OK") {
    // Pull 4 headings so we catch the building regardless of road orientation.
    for (const heading of [0, 90, 180, 270]) {
      const path = join(SV_DIR, `row-${row.id}-h${heading}.jpg`);
      const info = await downloadStreetView(row.mr_lat, row.mr_lng, path, { heading });
      files.push({ heading, path, size_bytes: info.size_bytes });
    }
  }
  results.push({
    ...row,
    street_view_metadata: {
      status: meta.status,
      pano_id: meta.pano_id ?? null,
      date: meta.date ?? null,
      location_returned: meta.location ?? null,
      copyright: meta.copyright ?? null,
    },
    files,
    maps_link: `https://www.google.com/maps?q=&layer=c&cbll=${row.mr_lat},${row.mr_lng}`,
  });
  console.log(`row ${row.id} ${row.address} :: sv=${meta.status} pano=${meta.pano_id ?? "-"} date=${meta.date ?? "-"}`);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, "audit.json"), JSON.stringify({
  scoping_doc: "decisions/track-d5-ernest-fixture-quality-scoping.md",
  scoping_doc_sha256: "6f68f30005479c3bd3afbd7f2413532a888ac33e7bb9d4d13cb131545a10cc5a",
  mr_window: "2026-04-23T15:53:18Z→15:55:53Z",
  pipeline_a_frozen: "8695096",
  router_frozen: "68d38aa",
  modal_frozen: "ap-YNo1zMhHPdmlcUYVg9G741",
  fixture_frozen: "scripts/bench-addresses.json",
  generated_at: new Date().toISOString(),
  rows: results,
}, null, 2));
console.log(`\nwrote ${OUT_DIR}/audit.json with ${results.length} rows`);
