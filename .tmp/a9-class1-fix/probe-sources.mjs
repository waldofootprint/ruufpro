#!/usr/bin/env node
// One-off: capture footprintSource per bench non-refused address (Brighton done via probe1).
// Modal direct call. 1 attempt per address.

import fs from "node:fs";
import path from "node:path";

const ADDRESSES = [
  { id: "ernest", addr: "1823 Ernest St, Jacksonville, FL 32204" },
  { id: "tallpines", addr: "1807 Tall Pines Dr, Largo, FL 33771" },
  { id: "tamiami", addr: "19943 Tamiami Ave, Tampa, FL 33647" },
  { id: "mountainlake", addr: "9806 Mountain Lake Dr, Orlando, FL 32832" },
  { id: "bohannon", addr: "492 Bohannon Blvd, Orlando, FL 32824" },
];

const URL = process.env.LIDAR_MEASURE_URL;
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!URL || !KEY) throw new Error("LIDAR_MEASURE_URL + GOOGLE_MAPS_KEY required");

async function geocode(address) {
  const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${KEY}`;
  const j = await (await fetch(u)).json();
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

const out = path.join(".tmp/a9-class1-fix", `probe-sources-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
fs.mkdirSync(path.dirname(out), { recursive: true });

for (const { id, addr } of ADDRESSES) {
  const { lat, lng } = await geocode(addr);
  const t0 = Date.now();
  const r = await fetch(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lat, lng, address: addr }),
  });
  const wall = Date.now() - t0;
  const body = await r.json().catch(() => ({}));
  const rec = {
    id, addr, lat, lng, wall_ms: wall,
    outcome: body.outcome,
    footprintSource: body.footprintSource,
    footprintLatencyMs: body.footprintLatencyMs,
    horizSqft: body.horizSqft,
    elapsedMs: body.elapsedMs,
  };
  fs.appendFileSync(out, JSON.stringify(rec) + "\n");
  console.log(`${id.padEnd(14)} outcome=${rec.outcome}  source=${rec.footprintSource}  latency=${rec.footprintLatencyMs}ms  sqft=${rec.horizSqft}  wall=${wall}ms`);
  await new Promise((r) => setTimeout(r, 8000));
}
console.log(`\nLog: ${out}`);
