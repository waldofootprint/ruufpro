#!/usr/bin/env node

// Ingest IEM Local Storm Reports for FL into storm_events.
//
// Phase 1 of the PP statewide expansion plan:
//   research/handoff-2026-05-01-property-pipeline-statewide-expansion.md
//
// Source: https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py
// Free, no key, attribution requested.
//
// Usage:
//   node tools/ingest-iem-lsr.mjs                  # last 7 days (daily cron mode)
//   node tools/ingest-iem-lsr.mjs --backfill 5     # backfill 5 years (first run)
//   node tools/ingest-iem-lsr.mjs --days 30        # last 30 days
//   node tools/ingest-iem-lsr.mjs --dry-run        # fetch but don't write
//
// Idempotent: PK is a synthetic event_id hash of (valid+lat+lon+typecode).
// Re-runs ON CONFLICT DO NOTHING.

import { createHash } from "crypto";
import { supabase } from "./lib/supabase-admin.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes(name);

const dryRun = has("--dry-run");
const backfillYears = parseInt(flag("--backfill") || "0", 10);
const days = parseInt(flag("--days") || "7", 10);

const now = new Date();
const ets = now.toISOString().replace(/\.\d{3}Z$/, "Z");
const sts = (() => {
  const d = new Date(now);
  if (backfillYears > 0) d.setFullYear(d.getFullYear() - backfillYears);
  else d.setDate(d.getDate() - days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
})();

console.log(`\nIEM LSR ingest`);
console.log(`  window: ${sts} → ${ets}`);
console.log(`  mode:   ${backfillYears > 0 ? `backfill ${backfillYears}y` : `last ${days}d`}`);
console.log(`  write:  ${dryRun ? "DRY RUN" : "live"}\n`);

// IEM rejects very long windows in one shot for some endpoints; LSR seems to
// handle multi-year fine but we chunk by year on backfill anyway for safety
// and to give progress feedback.
const windows = [];
if (backfillYears > 0) {
  for (let y = backfillYears; y >= 1; y--) {
    const from = new Date(now); from.setFullYear(from.getFullYear() - y);
    const to = new Date(now); to.setFullYear(to.getFullYear() - (y - 1));
    windows.push([from.toISOString().replace(/\.\d{3}Z$/, "Z"),
                  to.toISOString().replace(/\.\d{3}Z$/, "Z")]);
  }
} else {
  windows.push([sts, ets]);
}

let totalFetched = 0;
let totalUpserted = 0;
let totalSkipped = 0;

for (const [winSts, winEts] of windows) {
  const url = `https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py?state=FL&sts=${winSts}&ets=${winEts}&fmt=csv`;
  process.stdout.write(`  fetch ${winSts.slice(0,10)} → ${winEts.slice(0,10)} ... `);

  const resp = await fetch(url);
  if (!resp.ok) {
    console.log(`FAILED ${resp.status}`);
    continue;
  }
  const csv = await resp.text();
  const lines = csv.trim().split("\n");
  if (lines.length < 2) { console.log("0 events"); continue; }

  const header = lines[0].split(",");
  const rows = lines.slice(1).map((line) => parseCsvRow(line, header));

  console.log(`${rows.length} events`);
  totalFetched += rows.length;

  // Map to storm_events shape
  const records = rows.map((r) => {
    const valid = parseValid(r.VALID);
    if (!valid) return null;
    const lat = parseFloat(r.LAT);
    const lng = parseFloat(r.LON);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    const typecode = (r.TYPETEXT || r.TYPECODE || "UNKNOWN").trim();
    const event_id = createHash("sha256")
      .update(`${valid.toISOString()}|${lat}|${lng}|${typecode}`)
      .digest("hex")
      .slice(0, 32);

    const magNum = r.MAG && r.MAG !== "None" ? parseFloat(r.MAG) : null;

    return {
      event_id,
      valid_at: valid.toISOString(),
      typecode,
      magnitude: Number.isFinite(magNum) ? magNum : null,
      lat,
      lng,
      zip: null,                                  // backfilled by geocode pass
      county: r.COUNTY || null,
      state: r.STATE || "FL",
      ugc: r.UGC || null,
      city: r.CITY || null,
      remark: r.REMARK || null,
      source: "iem_lsr",
    };
  }).filter(Boolean);

  if (dryRun) {
    console.log(`    DRY: would upsert ${records.length} (sample below)`);
    if (records.length > 0) console.log("    " + JSON.stringify(records[0], null, 2).split("\n").join("\n    "));
    continue;
  }

  // Chunked upsert. ON CONFLICT (event_id) DO NOTHING via Supabase upsert
  // ignoreDuplicates: true.
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from("storm_events")
      .upsert(chunk, { onConflict: "event_id", ignoreDuplicates: true, count: "exact" });
    if (error) {
      console.error(`    upsert error:`, error.message);
      totalSkipped += chunk.length;
    } else {
      totalUpserted += count ?? 0;
      totalSkipped += chunk.length - (count ?? 0);
    }
  }
}

console.log(`\nDone.`);
console.log(`  fetched:  ${totalFetched}`);
console.log(`  upserted: ${totalUpserted}`);
console.log(`  skipped:  ${totalSkipped} (already present or invalid)`);

// Sanity peek for Manatee
if (!dryRun) {
  const { data: sample } = await supabase
    .from("storm_events")
    .select("valid_at, typecode, city, magnitude, remark")
    .eq("county", "Manatee")
    .order("valid_at", { ascending: false })
    .limit(5);
  console.log(`\n  Manatee sample (most recent 5):`);
  if (!sample || sample.length === 0) console.log("    (none)");
  else for (const r of sample) {
    console.log(`    ${r.valid_at.slice(0,16)}  ${r.typecode.padEnd(20)} ${r.magnitude ?? "-"}  ${(r.city || "").slice(0, 30)}`);
  }
}

// ---------- helpers ----------

// IEM CSV uses commas inside quoted REMARK fields. Tiny robust splitter.
function parseCsvRow(line, header) {
  const out = {};
  const cells = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { cells.push(cur); cur = ""; continue; }
    cur += c;
  }
  cells.push(cur);
  for (let i = 0; i < header.length; i++) out[header[i]] = cells[i] ?? "";
  return out;
}

// VALID is "YYYYMMDDHHMM" UTC.
function parseValid(s) {
  if (!s || s.length < 12) return null;
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10), mi = +s.slice(10, 12);
  const dt = new Date(Date.UTC(y, mo, d, h, mi));
  return Number.isNaN(dt.getTime()) ? null : dt;
}
