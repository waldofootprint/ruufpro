#!/usr/bin/env node
// Track D.5-fixture-surgical-swap §3.1 pre-edit verification.
// Scoping: decisions/track-d5-fixture-surgical-swap-scoping.md
// Geocodes 2 candidate addresses + captures satellite imagery at zoom 20.
// Parcel-roll verification is run separately via Playwright (county viewers are JS-heavy).
// Per scoping §3.1: if either candidate classifies GHOST/NEAR-MATCH, STOP.

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { readFileSync } from "node:fs";

// Load .env manually (no dotenv dep needed).
const envText = readFileSync("/Users/hannahwaldo/RoofReady/.env", "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const KEY = process.env.GOOGLE_API_KEY;
if (!KEY) { console.error("GOOGLE_API_KEY required"); process.exit(1); }

const OUT_DIR = ".tmp/calculator-bench/d5-surgical-swap";
const SAT_DIR = join(OUT_DIR, "satellite");

const candidates = [
  { slot: 2, address: "8120 Hollyridge Rd, Jacksonville, FL 32256",    county: "Duval"     },
  { slot: 3, address: "7625 Founders Way, Ponte Vedra Beach, FL 32082", county: "St. Johns" },
];

async function geocode(addr) {
  const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${KEY}`;
  const r = await fetch(u);
  return r.json();
}

async function satellite(lat, lng, outPath) {
  const u = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${KEY}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`staticmap ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outPath, buf);
  return { size_bytes: buf.length, url_template: u.replace(KEY, "REDACTED") };
}

await mkdir(SAT_DIR, { recursive: true });
const results = [];

for (const c of candidates) {
  const g = await geocode(c.address);
  const top = g.results?.[0];
  if (!top) {
    results.push({ ...c, geocode_status: g.status, error: "no geocode result" });
    console.log(`slot ${c.slot} :: geocode FAIL status=${g.status}`);
    continue;
  }
  const { lat, lng } = top.geometry.location;
  const locationType = top.geometry.location_type;
  const formatted = top.formatted_address;
  const satPath = join(SAT_DIR, `slot-${c.slot}-sat.png`);
  const sat = await satellite(lat, lng, satPath);
  const maps = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
  results.push({
    slot: c.slot,
    input_address: c.address,
    county: c.county,
    geocode_status: g.status,
    geocode_formatted: formatted,
    geocode_location_type: locationType,
    geocode_types: top.types,
    lat, lng,
    satellite_path: satPath,
    satellite_size_bytes: sat.size_bytes,
    maps_link: maps,
  });
  console.log(`slot ${c.slot} :: ${c.address}`);
  console.log(`  formatted: ${formatted}`);
  console.log(`  location_type: ${locationType} (${top.types.join(",")})`);
  console.log(`  lat,lng: ${lat},${lng}`);
  console.log(`  satellite: ${satPath} (${sat.size_bytes} B)`);
  console.log(`  maps: ${maps}`);
}

await writeFile(join(OUT_DIR, "preverify-geocode.json"), JSON.stringify({
  scoping_doc: "decisions/track-d5-fixture-surgical-swap-scoping.md",
  pipeline_a_frozen: "8695096",
  router_frozen: "68d38aa",
  modal_frozen: "ap-YNo1zMhHPdmlcUYVg9G741",
  fixture_frozen_commit: "05849482",
  generated_at: new Date().toISOString(),
  candidates: results,
}, null, 2));
console.log(`\nwrote ${OUT_DIR}/preverify-geocode.json`);
