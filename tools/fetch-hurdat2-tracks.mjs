#!/usr/bin/env node
/**
 * fetch-hurdat2-tracks.mjs
 *
 * Builds data/hurdat2-fl-tracks.json — a per-storm dump of HURDAT2 track points
 * for storms relevant to Florida (peak Cat 1+ AND at least one track point within
 * 300mi of central FL ~28.0,-83.0). Used at runtime for per-address (lat,lng)
 * hurricane lookups on the postcard landing demo.
 *
 * Run quarterly or after a major-storm landfall. Output ships with the app.
 *
 * Usage:
 *   node tools/fetch-hurdat2-tracks.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "data", "hurdat2-fl-tracks.json");

const HURDAT2_INDEX = "https://www.nhc.noaa.gov/data/hurdat/";
const FL_CENTER = { lat: 28.0, lng: -83.0 };
const FL_RADIUS_MI = 300;
const SINCE_YEAR = 1980; // post-1980 storms cover any roof we'd ever care about

function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.7613;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ssCategory(windKt) {
  if (windKt >= 137) return 5;
  if (windKt >= 113) return 4;
  if (windKt >= 96) return 3;
  if (windKt >= 83) return 2;
  if (windKt >= 64) return 1;
  return 0;
}

function parseLatLng(s) {
  const m = String(s).trim().match(/^([\d.]+)([NSEW])$/);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  return m[2] === "S" || m[2] === "W" ? -v : v;
}

async function fetchLatestHurdat2Url() {
  const r = await fetch(HURDAT2_INDEX);
  if (!r.ok) throw new Error(`HURDAT2 index fetch failed: ${r.status}`);
  const html = await r.text();
  const matches = [...html.matchAll(/hurdat2-1851-(\d{4})-(\d{6})\.txt/g)];
  if (matches.length === 0) throw new Error("No HURDAT2 file found in index");
  matches.sort((a, b) => (b[1] + b[2]).localeCompare(a[1] + a[2]));
  return { url: HURDAT2_INDEX + matches[0][0], lastYear: parseInt(matches[0][1], 10) };
}

function parseHurdat2(text) {
  const storms = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^AL\d{6},/.test(line)) {
      const parts = line.split(",").map((s) => s.trim());
      const year = parseInt(parts[0].slice(4), 10);
      current = { id: parts[0], name: parts[1], year, rows: [] };
      storms.push(current);
      continue;
    }
    if (!current) continue;
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 8) continue;
    const date = parts[0];
    const status = parts[3];
    const lat = parseLatLng(parts[4]);
    const lng = parseLatLng(parts[5]);
    const windKt = parseInt(parts[6], 10);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(windKt)) continue;
    current.rows.push({ date, status, lat, lng, windKt });
  }
  return storms;
}

async function main() {
  console.log("• fetching HURDAT2 index...");
  const { url, lastYear } = await fetchLatestHurdat2Url();
  console.log(`  → ${url} (covers through ${lastYear})`);
  const txt = await (await fetch(url)).text();
  const storms = parseHurdat2(txt);
  console.log(`  parsed ${storms.length} storms`);

  const out = [];
  for (const s of storms) {
    if (s.year < SINCE_YEAR) continue;
    // Keep storms that came within FL_RADIUS_MI of FL center AND ever reached Cat 1+.
    let nearFL = false;
    let peakWindKt = 0;
    for (const r of s.rows) {
      if (r.windKt > peakWindKt) peakWindKt = r.windKt;
      if (!nearFL) {
        const d = haversineMi(FL_CENTER.lat, FL_CENTER.lng, r.lat, r.lng);
        if (d <= FL_RADIUS_MI) nearFL = true;
      }
    }
    if (!nearFL) continue;
    if (peakWindKt < 64) continue; // skip pure tropical storms
    out.push({
      id: s.id,
      name: s.name,
      year: s.year,
      peakLifetimeWindKt: peakWindKt,
      peakLifetimeCategory: ssCategory(peakWindKt),
      // Compact track: only date + lat/lng/windKt. Status omitted to shrink JSON.
      track: s.rows.map((r) => ({ d: r.date, lat: r.lat, lng: r.lng, w: r.windKt })),
    });
  }

  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceUrl: url,
    lastYearCovered: lastYear,
    sinceYear: SINCE_YEAR,
    flCenter: FL_CENTER,
    flRadiusMi: FL_RADIUS_MI,
    note:
      "Storms post-1980 with peak lifetime intensity Cat 1+ AND at least one track point within " +
      FL_RADIUS_MI +
      "mi of central FL. Used for runtime per-address (lat,lng) lookups.",
    storms: out,
  };
  await fs.writeFile(OUT_PATH, JSON.stringify(payload));
  const size = (await fs.stat(OUT_PATH)).size;
  console.log(
    `✓ wrote ${OUT_PATH} (${out.length.toLocaleString()} storms, ${(size / 1024).toFixed(1)} KB)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
