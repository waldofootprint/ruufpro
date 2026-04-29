#!/usr/bin/env node
/**
 * fetch-county-storm-stats.mjs
 *
 * Builds the static county-storm-stats JSON from official sources only:
 *   - NOAA HURDAT2 (Atlantic hurricane best-track database, 1851→present)
 *   - FEMA OpenFEMA Disaster Declarations Summaries v2
 *
 * Output: data/county-storm-stats/<county>-<state>.json
 *
 * Run quarterly or after a major-storm landfall. Output JSON ships with the
 * app and is read both by the dashboard approval queue and the QR landing
 * page so every cited number is reproducible from this script + sources.
 *
 * No API keys. No paid services.
 *
 * Usage:
 *   node tools/fetch-county-storm-stats.mjs --county=manatee --state=FL
 *
 * If new storms have happened and HURDAT2 hasn't been updated yet (NOAA
 * publishes the prior year's HURDAT2 in spring), the script logs a warning
 * with the last-included storm year so the operator knows what's missing.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "data", "county-storm-stats");

// County registry. Add a row per county we serve. Centroid is used to compute
// "did this storm pass within RADIUS_MI of this county" — a single point is
// fine for Tier 1 because we report county-scoped, not parcel-scoped.
const COUNTIES = {
  manatee: {
    state: "FL",
    fipsState: "12",
    fipsCounty: "081",
    centroidLat: 27.4783,
    centroidLng: -82.3452,
    displayName: "Manatee County, FL",
  },
};

const RADIUS_MI = 100; // claim radius for "tracked near"

// HURDAT2 listing index — newest file at the top. We try the listing page
// and pick the most recent hurdat2-1851-YYYY-MMDDYY.txt.
const HURDAT2_INDEX = "https://www.nhc.noaa.gov/data/hurdat/";

const FEMA_DDS = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COUNTY_KEY = (args.county ?? "manatee").toLowerCase();
const county = COUNTIES[COUNTY_KEY];
if (!county) {
  console.error(`Unknown county: ${COUNTY_KEY}. Known: ${Object.keys(COUNTIES).join(", ")}`);
  process.exit(1);
}

console.log(`▶ Building storm stats for ${county.displayName}`);

// ---- 1. NOAA HURDAT2 ------------------------------------------------------

async function fetchLatestHurdat2Url() {
  const r = await fetch(HURDAT2_INDEX);
  if (!r.ok) throw new Error(`HURDAT2 index fetch failed: ${r.status}`);
  const html = await r.text();
  const matches = [...html.matchAll(/hurdat2-1851-(\d{4})-(\d{6})\.txt/g)];
  if (matches.length === 0) throw new Error("No HURDAT2 file found in index");
  // Pick the most recent by (year, MMDDYY) lexicographic
  matches.sort((a, b) => (b[1] + b[2]).localeCompare(a[1] + a[2]));
  return {
    url: HURDAT2_INDEX + matches[0][0],
    lastYear: parseInt(matches[0][1], 10),
  };
}

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

// Saffir-Simpson categories from sustained 1-min wind in knots.
function ssCategory(windKt) {
  if (windKt >= 137) return 5;
  if (windKt >= 113) return 4;
  if (windKt >= 96) return 3;
  if (windKt >= 83) return 2;
  if (windKt >= 64) return 1;
  return 0; // tropical storm or weaker
}

function parseHurdat2(text) {
  const storms = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^AL\d{6},/.test(line)) {
      // Header line: "AL092022,              IAN,    72,"
      const parts = line.split(",").map((s) => s.trim());
      const year = parseInt(parts[0].slice(4), 10);
      current = {
        id: parts[0],
        name: parts[1],
        year,
        rows: [],
      };
      storms.push(current);
      continue;
    }
    if (!current) continue;
    // Track row:
    // 20220924, 0000, , TS, 14.4N,  65.7W,  35, 1005, ...
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 8) continue;
    const date = parts[0]; // YYYYMMDD
    const status = parts[3];
    const lat = parseLatLng(parts[4]);
    const lng = parseLatLng(parts[5]);
    const windKt = parseInt(parts[6], 10);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(windKt)) continue;
    current.rows.push({ date, status, lat, lng, windKt });
  }
  return storms;
}

function parseLatLng(s) {
  // "14.4N" -> 14.4, "65.7W" -> -65.7
  const m = s.match(/^([\d.]+)([NSEW])$/);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  if (Number.isNaN(v)) return NaN;
  return m[2] === "S" || m[2] === "W" ? -v : v;
}

async function buildHurdat2Stats() {
  console.log("• fetching HURDAT2 index...");
  const { url, lastYear } = await fetchLatestHurdat2Url();
  console.log(`  → ${url} (covers through ${lastYear})`);
  const txt = await (await fetch(url)).text();
  const storms = parseHurdat2(txt);
  console.log(`  parsed ${storms.length} storms`);

  const matched = [];
  for (const s of storms) {
    let closest = { mi: Infinity, windKt: 0, lat: 0, lng: 0, date: "" };
    for (const r of s.rows) {
      const d = haversineMi(county.centroidLat, county.centroidLng, r.lat, r.lng);
      if (d < closest.mi) closest = { mi: d, windKt: r.windKt, lat: r.lat, lng: r.lng, date: r.date };
    }
    if (closest.mi <= RADIUS_MI) {
      matched.push({
        id: s.id,
        name: s.name,
        year: s.year,
        closestApproach: {
          miles: Math.round(closest.mi * 10) / 10,
          date: closest.date,
        },
        peakWindAtClosestApproachKt: closest.windKt,
        peakWindAtClosestApproachMph: Math.round(closest.windKt * 1.15078),
        categoryAtClosestApproach: ssCategory(closest.windKt),
        peakLifetimeWindKt: Math.max(...s.rows.map((r) => r.windKt)),
        peakLifetimeCategory: ssCategory(Math.max(...s.rows.map((r) => r.windKt))),
      });
    }
  }

  // Filter to "majors" (peak lifetime Cat 3+) for the headline count;
  // also keep all named storms within radius for additional context.
  const majors = matched.filter((m) => m.peakLifetimeCategory >= 3);
  majors.sort((a, b) => a.year - b.year);

  return {
    sourceUrl: url,
    lastYearCovered: lastYear,
    radiusMiles: RADIUS_MI,
    centroid: { lat: county.centroidLat, lng: county.centroidLng },
    allNamedStormsWithinRadius: matched.length,
    majorsWithinRadius: majors,
  };
}

// ---- 2. FEMA OpenFEMA Disaster Declarations -------------------------------

async function fetchFemaDeclarations() {
  console.log("• fetching FEMA disaster declarations...");
  // OpenFEMA filter: state=FL + fipsCountyCode=081 + incidentType=Hurricane
  const params = new URLSearchParams({
    $filter: `state eq '${county.state}' and fipsCountyCode eq '${county.fipsCounty}' and incidentType eq 'Hurricane'`,
    $select:
      "disasterNumber,declarationDate,declarationTitle,incidentBeginDate,incidentEndDate,incidentType",
    $top: "1000",
    $orderby: "incidentBeginDate desc",
  });
  const url = `${FEMA_DDS}?${params}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`FEMA fetch failed: ${r.status}`);
  const json = await r.json();
  // Dedupe by (disasterNumber + incidentBeginDate) — county-level rows can
  // be duplicated across declaration types (DR/EM/FM); each disaster number
  // is the right unit of "federal disaster".
  const seen = new Set();
  const uniq = [];
  for (const row of json.DisasterDeclarationsSummaries ?? []) {
    const key = row.disasterNumber;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push({
      disasterNumber: row.disasterNumber,
      title: row.declarationTitle,
      declarationDate: row.declarationDate,
      incidentBeginDate: row.incidentBeginDate,
      incidentEndDate: row.incidentEndDate,
    });
  }
  uniq.sort((a, b) => a.incidentBeginDate.localeCompare(b.incidentBeginDate));
  console.log(`  ${uniq.length} unique federal hurricane disaster declarations`);
  return {
    sourceUrl: url,
    declarations: uniq,
  };
}

// ---- 3. Compose -----------------------------------------------------------

async function main() {
  const hurdat = await buildHurdat2Stats();
  const fema = await fetchFemaDeclarations();

  const out = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    county: {
      key: COUNTY_KEY,
      displayName: county.displayName,
      state: county.state,
      fipsState: county.fipsState,
      fipsCounty: county.fipsCounty,
      centroidLat: county.centroidLat,
      centroidLng: county.centroidLng,
    },
    sources: [
      {
        name: "NOAA HURDAT2",
        description: "Atlantic hurricane best-track database, 1851–present.",
        url: hurdat.sourceUrl,
      },
      {
        name: "FEMA OpenFEMA Disaster Declarations Summaries v2",
        description: "Federal disaster declarations.",
        url: fema.sourceUrl,
      },
    ],
    notes: [
      `Major-hurricane count = storms whose track passed within ${RADIUS_MI} mi of the county centroid (${county.centroidLat}, ${county.centroidLng}) AND whose peak lifetime intensity was Saffir-Simpson Cat 3 or higher.`,
      `HURDAT2 covers through ${hurdat.lastYearCovered}. Storms after ${hurdat.lastYearCovered} are missing until NOAA publishes the next HURDAT2 release.`,
      `FEMA declarations use county FIPS ${county.fipsState}${county.fipsCounty} (${county.displayName}) and incident type 'Hurricane'. Multiple declarations per disaster number are deduped.`,
    ],
    hurdat2: hurdat,
    fema,
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${COUNTY_KEY}-${county.state.toLowerCase()}.json`);
  await fs.writeFile(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n✔ wrote ${outPath}`);
  console.log(`  ${hurdat.majorsWithinRadius.length} major hurricanes within ${RADIUS_MI} mi`);
  console.log(`  ${fema.declarations.length} FEMA hurricane declarations for ${county.displayName}`);
  if (hurdat.majorsWithinRadius.length) {
    console.log("\n  Most recent majors:");
    for (const m of hurdat.majorsWithinRadius.slice(-5)) {
      console.log(
        `    ${m.year} ${m.name.padEnd(10)} Cat ${m.peakLifetimeCategory} · closest ${m.closestApproach.miles} mi · ${m.peakWindAtClosestApproachMph} mph at closest approach`
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
