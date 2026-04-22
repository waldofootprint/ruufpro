#!/usr/bin/env node
// V4 regression harness — hits /api/estimate with the bench set and writes
// CSV results. Reusable across Mode A / Mode C / future calibrations.
//
// Usage:
//   node scripts/bench-v4.mjs                       # prod (ruufpro.com)
//   node scripts/bench-v4.mjs --base http://...     # custom base URL
//   node scripts/bench-v4.mjs --out .tmp/foo.csv    # custom output path
//   node scripts/bench-v4.mjs --input scripts/bench-addresses.json
//
// Reads bench fixture, POSTs each address to /api/estimate, picks the
// asphalt-material estimate (apples-to-apples with Roofle Premium Preferred
// OC Duration), logs CSV with deltas vs Roofle when available.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
function arg(flag, fallback) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
}
function hasFlag(flag) {
  return argv.includes(flag);
}

// Load .env so --floor-off has SUPABASE creds available (matches bm-smoke.mjs pattern).
try {
  const envText = fs.readFileSync(".env", "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const BASE = arg("--base", "https://ruufpro.com").replace(/\/$/, "");
const INPUT = arg("--input", path.join(__dirname, "bench-addresses.json"));
const OUT = arg("--out", path.join(__dirname, "..", ".tmp", "calculator-bench", "v4-bench-BB.csv"));
const FLOOR_OFF = hasFlag("--floor-off");
const GEOCODE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Harness fix (Track A.8 2026-04-22): /api/estimate gates measurement_runs +
// LiDAR path on top-level lat/lng. Widget sends precoords; bench must match.
async function geocode(address) {
  if (!GEOCODE_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODE_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  if (j.status !== "OK" || !j.results?.length) return null;
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

const fixture = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const { contractor_id, contractor_label, options, addresses } = fixture;

fs.mkdirSync(path.dirname(OUT), { recursive: true });

// --- Floor-off helpers (Track A.9-class-2-prep audit) ---------------------
// Temporarily sets estimate_settings.minimum_job_price=0 for contractor_id,
// runs the bench, then restores. Audit-only. Reversible on exit/crash/SIGINT.
// Not a stack addition — uses existing contractor settings table.
let ORIGINAL_FLOOR = null;
let FLOOR_RESTORED = false;

async function supabasePatch(pathQuery, body) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — --floor-off requires both in .env");
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathQuery}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase PATCH ${pathQuery} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function supabaseGet(pathQuery) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — --floor-off requires both in .env");
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathQuery}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`Supabase GET ${pathQuery} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function floorOffSetup() {
  const rows = await supabaseGet(`estimate_settings?contractor_id=eq.${contractor_id}&select=minimum_job_price`);
  if (!rows.length) throw new Error(`No estimate_settings row for contractor ${contractor_id}`);
  ORIGINAL_FLOOR = rows[0].minimum_job_price;
  await supabasePatch(`estimate_settings?contractor_id=eq.${contractor_id}`, { minimum_job_price: 0 });
  console.log(`[floor-off] GMR minimum_job_price: ${ORIGINAL_FLOOR} → 0`);
}

async function floorOffRestore() {
  if (FLOOR_RESTORED || ORIGINAL_FLOOR === null) return;
  FLOOR_RESTORED = true;
  try {
    await supabasePatch(`estimate_settings?contractor_id=eq.${contractor_id}`, { minimum_job_price: ORIGINAL_FLOOR });
    console.log(`[floor-off] GMR minimum_job_price restored: 0 → ${ORIGINAL_FLOOR}`);
  } catch (err) {
    console.error(`[floor-off] RESTORE FAILED — MANUAL REVERT REQUIRED. contractor_id=${contractor_id} target=${ORIGINAL_FLOOR}. Error: ${err.message}`);
    process.exitCode = 2;
  }
}

if (FLOOR_OFF) {
  await floorOffSetup();
  // Best-effort restore on abnormal exit. Async handlers can race with process exit;
  // the try/finally around the main loop below is the primary guarantee.
  process.on("SIGINT", async () => { await floorOffRestore(); process.exit(130); });
  process.on("SIGTERM", async () => { await floorOffRestore(); process.exit(143); });
  process.on("uncaughtException", async (e) => { console.error(e); await floorOffRestore(); process.exit(1); });
}

const header = [
  "id", "address", "roofer", "status", "sqft", "num_segs", "is_satellite",
  "v4_low", "v4_mid", "v4_high",
  "roofle_low", "roofle_high", "roofle_mid",
  "delta_mid_pct", "trip_reason", "notes",
];

const rows = [header.join(",")];
const deltasRaw = []; // collected in-memory, avoid re-parsing CSV

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function pct(a, b) {
  if (!a || !b) return null;
  return ((a - b) / b) * 100;
}

console.log(`\nV4 Bench — ${BASE} — contractor=${contractor_label}`);
console.log(`Options: pitch=${options.pitch_category}, material=${options.current_material}, timeline=${options.timeline}`);
console.log(`Bench: ${addresses.length} addresses${FLOOR_OFF ? " [FLOOR-OFF MODE]" : ""}\n`);

try {
for (const row of addresses) {
  const coords = await geocode(row.address);
  const payload = {
    contractor_id,
    address: row.address,
    lat: coords?.lat,
    lng: coords?.lng,
    pitch_category: options.pitch_category,
    current_material: options.current_material,
    shingle_layers: options.shingle_layers,
    timeline: options.timeline,
    financing_interest: options.financing_interest,
  };

  process.stdout.write(`#${row.id} ${row.address} ... `);
  let res, body;
  try {
    res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    body = await res.json();
  } catch (err) {
    console.log(`FETCH_ERROR: ${err.message}`);
    rows.push([row.id, row.address, row.roofer, "fetch_error", "", "", "", "", "", "", row.roofle_low ?? "", row.roofle_high ?? "", "", "", err.message, row.notes].map(csvEscape).join(","));
    continue;
  }

  if (!res.ok) {
    const reason = body?.error_code || body?.error || `http_${res.status}`;
    console.log(`REFUSED: ${reason}`);
    rows.push([row.id, row.address, row.roofer, "refused", "", "", "", "", "", "", row.roofle_low ?? "", row.roofle_high ?? "", "", "", reason, row.notes].map(csvEscape).join(","));
    continue;
  }

  const asphalt = (body.estimates || []).find((e) => e.material === "asphalt");
  if (!asphalt) {
    console.log(`NO_ASPHALT (materials: ${(body.estimates || []).map(e => e.material).join(",")})`);
    rows.push([row.id, row.address, row.roofer, "no_asphalt", "", "", "", "", "", "", row.roofle_low ?? "", row.roofle_high ?? "", "", "", "", row.notes].map(csvEscape).join(","));
    continue;
  }

  const mid = Math.round((asphalt.price_low + asphalt.price_high) / 2);
  const roofleMid = row.roofle_low && row.roofle_high ? Math.round((row.roofle_low + row.roofle_high) / 2) : null;
  const deltaPct = roofleMid ? pct(mid, roofleMid) : null;

  console.log(
    `${asphalt.roof_area_sqft} sqft · $${asphalt.price_low.toLocaleString()}-$${asphalt.price_high.toLocaleString()}` +
    (deltaPct !== null ? ` · Δ ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : "")
  );

  rows.push([
    row.id, row.address, row.roofer, "ok",
    asphalt.roof_area_sqft, asphalt.num_segments, asphalt.is_satellite,
    asphalt.price_low, mid, asphalt.price_high,
    row.roofle_low ?? "", row.roofle_high ?? "", roofleMid ?? "",
    deltaPct !== null ? deltaPct.toFixed(2) : "",
    "", row.notes,
  ].map(csvEscape).join(","));
  if (deltaPct !== null) deltasRaw.push({ id: row.id, delta: deltaPct });
}
} finally {
  if (FLOOR_OFF) await floorOffRestore();
}

fs.writeFileSync(OUT, rows.join("\n") + "\n");
console.log(`\n→ CSV written to ${OUT}`);

// Summary: MAE + max deviation across addresses with roofle_mid
if (deltasRaw.length) {
  const abs = deltasRaw.map((d) => Math.abs(d.delta));
  const mae = abs.reduce((a, b) => a + b, 0) / abs.length;
  const max = Math.max(...abs);
  console.log(`\nSummary (vs Roofle midpoint, ${deltasRaw.length} addresses):`);
  for (const d of deltasRaw) {
    const sign = d.delta >= 0 ? "+" : "";
    console.log(`  #${d.id}: ${sign}${d.delta.toFixed(2)}%`);
  }
  console.log(`  MAE: ${mae.toFixed(2)}%`);
  console.log(`  Max: ${max.toFixed(2)}%`);
  console.log(`  Acceptance: MAE ≤ 5% AND max ≤ 10% — ${mae <= 5 && max <= 10 ? "PASS 🟢" : "FAIL 🟡"}`);
}
