#!/usr/bin/env node
/**
 * M2.1 — FL LiDAR coverage probe.
 *
 * Pulls a random sample of FL residential addresses from
 * `property_pipeline_candidates`, geocodes each, hits the production Modal
 * LiDAR pipeline, and writes a CSV + summary % stats.
 *
 * Output documents what % of FL residential homes the Pipeline A LiDAR
 * surface can actually measure today. Drives M2.2 fallback design.
 *
 * Usage:
 *   node scripts/probe-lidar-coverage.mjs                 # default n=200
 *   node scripts/probe-lidar-coverage.mjs --n 100         # smaller sample
 *   node scripts/probe-lidar-coverage.mjs --out path.csv  # custom output
 *
 * Env (loaded from .env / .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_API_KEY
 *   LIDAR_MEASURE_URL
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env + .env.local
for (const f of [".env", ".env.local"]) {
  try {
    const text = fs.readFileSync(f, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const argv = process.argv.slice(2);
function arg(flag, fallback) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
}

const SAMPLE_N = parseInt(arg("--n", "200"), 10);
const CONCURRENCY = parseInt(arg("--concurrency", "5"), 10);
const OUT = arg(
  "--out",
  path.join(__dirname, "..", ".tmp", "calculator-bench", "lidar-coverage-probe.csv"),
);

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const LIDAR_URL = process.env.LIDAR_MEASURE_URL;

for (const [name, val] of [
  ["NEXT_PUBLIC_SUPABASE_URL", SUPA_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SUPA_KEY],
  ["GOOGLE_API_KEY", GOOGLE_KEY],
  ["LIDAR_MEASURE_URL", LIDAR_URL],
]) {
  if (!val) {
    console.error(`missing env: ${name}`);
    process.exit(1);
  }
}

async function fetchSample() {
  const limit = Math.max(SAMPLE_N * 5, 1000);
  const url = `${SUPA_URL}/rest/v1/property_pipeline_candidates?select=address_raw,city,zip,county&limit=${limit}`;
  const r = await fetch(url, {
    headers: { apikey: SUPA_KEY, authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`supabase ${r.status} ${await r.text().catch(() => "")}`);
  const rows = await r.json();
  // Filter out PO Box / Suite / etc., shuffle, take SAMPLE_N
  const cleaned = rows.filter((row) => {
    const a = (row.address_raw || "").toUpperCase();
    return /^\d+\s/.test(a) && !/P\.?O\.?\s*BOX|SUITE|UNIT|APT|#/.test(a);
  });
  for (let i = cleaned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cleaned[i], cleaned[j]] = [cleaned[j], cleaned[i]];
  }
  return cleaned.slice(0, SAMPLE_N).map((r) => ({
    address: `${r.address_raw}, ${r.city}, FL ${r.zip}`,
    address_raw: r.address_raw,
    city: r.city,
    zip: r.zip,
    county: r.county,
  }));
}

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${GOOGLE_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return { ok: false, error: `geocode_http_${r.status}` };
  const j = await r.json();
  if (j.status !== "OK" || !j.results?.length) {
    return { ok: false, error: `geocode_${j.status?.toLowerCase() ?? "none"}` };
  }
  const loc = j.results[0].geometry.location;
  return { ok: true, lat: loc.lat, lng: loc.lng };
}

async function measure(lat, lng, address) {
  const t0 = Date.now();
  try {
    const r = await fetch(LIDAR_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat, lng, address }),
      signal: AbortSignal.timeout(60_000),
    });
    const elapsedMs = Date.now() - t0;
    if (!r.ok) return { outcome: `http_${r.status}`, elapsedMs };
    const j = await r.json();
    return { outcome: j.outcome ?? "no_outcome", horizSqft: j.horizSqft ?? null, fetchPath: j.fetchPath ?? null, elapsedMs };
  } catch (e) {
    return { outcome: "fetch_error", error: String(e), elapsedMs: Date.now() - t0 };
  }
}

async function probeOne(row) {
  const geo = await geocode(row.address);
  if (!geo.ok) {
    return { ...row, lat: null, lng: null, outcome: geo.error, horizSqft: null, fetchPath: null, elapsedMs: 0 };
  }
  const m = await measure(geo.lat, geo.lng, row.address);
  return { ...row, lat: geo.lat, lng: geo.lng, ...m };
}

async function runConcurrent(items, fn, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
      done++;
      if (done % 10 === 0 || done === items.length) {
        process.stdout.write(`  ${done}/${items.length}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  console.log(`[probe-lidar-coverage] target: ${LIDAR_URL}`);
  console.log(`[probe-lidar-coverage] sample: n=${SAMPLE_N}, concurrency=${CONCURRENCY}`);
  console.log("");

  console.log("Fetching sample addresses...");
  const sample = await fetchSample();
  console.log(`  got ${sample.length} addresses`);
  if (sample.length < SAMPLE_N) {
    console.warn(`  WARNING: requested ${SAMPLE_N} but only ${sample.length} clean residential addresses available`);
  }
  console.log("");

  console.log("Probing pipeline...");
  const t0 = Date.now();
  const rows = await runConcurrent(sample, probeOne, CONCURRENCY);
  const totalMs = Date.now() - t0;
  console.log(`  done in ${(totalMs / 1000).toFixed(1)}s`);
  console.log("");

  // Tally outcomes
  const tally = {};
  for (const r of rows) {
    tally[r.outcome] = (tally[r.outcome] ?? 0) + 1;
  }

  // Ensure output dir
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const header = ["address", "county", "lat", "lng", "outcome", "horizSqft", "fetchPath", "elapsedMs"];
  const csv = [
    header.join(","),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(",")),
  ].join("\n");
  fs.writeFileSync(OUT, csv);
  console.log(`Wrote: ${OUT}`);
  console.log("");

  console.log("=".repeat(60));
  console.log("COVERAGE SUMMARY");
  console.log("=".repeat(60));
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  for (const [outcome, n] of sorted) {
    const pct = ((n / rows.length) * 100).toFixed(1);
    console.log(`  ${outcome.padEnd(28)} ${String(n).padStart(4)}  ${pct}%`);
  }
  console.log("");

  const geocoded = rows.filter((r) => r.lat != null);
  const ok = rows.filter((r) => r.outcome === "ok");
  console.log(`Geocoded:        ${geocoded.length}/${rows.length} (${((geocoded.length / rows.length) * 100).toFixed(1)}%)`);
  console.log(`LiDAR ok:        ${ok.length}/${rows.length} (${((ok.length / rows.length) * 100).toFixed(1)}% of total)`);
  console.log(`LiDAR ok|geocoded: ${ok.length}/${geocoded.length} (${((ok.length / Math.max(geocoded.length, 1)) * 100).toFixed(1)}% of geocoded)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
