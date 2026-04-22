#!/usr/bin/env node
/**
 * Track A.8-diag — Probe 5 — footprint geometry inspection (H2 test).
 * Scoping doc: decisions/track-a8-diag-scoping.md §3.4 Probe 5.
 *
 * Pipeline A's footprint source is OSM Overpass via scripts/lidar-tier2-sqft.py
 * (fetch_footprint @ lidar-tier2-sqft.py:32). Vault/085 flags MS Footprints as
 * a Phase B replacement — NOT YET WIRED into Pipeline A. The scoping doc §3.4
 * says "MS Footprints polygon via the existing footprint-fetch code path"; the
 * actual existing code path is Overpass. This probe queries Overpass — what
 * Pipeline A actually uses — and notes the deviation.
 *
 * For each of Brighton, Dunedin, Ernest, Tall Pines:
 *   - same Overpass query as fetch_footprint (buildings within 40m)
 *   - report vertex count, multipolygon component count, bbox aspect ratio,
 *     area in m^2 (raw lat/lng bbox, not projected — relative shape only)
 *
 * Output: .tmp/a8-diag/probe5-footprints-<iso>.json
 */
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";

const ADDRESSES = {
  brighton: "10632 Brighton Hill Cir S, Jacksonville, FL 32256",
  dunedin: "2501 Main St, Dunedin, FL 34698",
  ernest: "1823 Ernest St, Jacksonville, FL 32204",
  tallpines: "2306 Tall Pines Way, Lutz, FL 33558",
};

const OVERPASS = "https://overpass-api.de/api/interpreter";
const RADIUS_M = 40;

async function geocode(address) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY required");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geocode ${r.status}`);
  const j = await r.json();
  if (j.status !== "OK") throw new Error(`geocode status=${j.status}`);
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

// Mirrors scripts/lidar-tier2-sqft.py::fetch_footprint query shape.
async function overpassBuildings(lat, lng, radius) {
  const q = `
[out:json][timeout:25];
(
  way["building"](around:${radius},${lat},${lng});
  relation["building"](around:${radius},${lat},${lng});
);
out body geom;
`;
  const r = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RuufPro-A8-diag/1.0 (admin@getruufpro.com)" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!r.ok) throw new Error(`overpass ${r.status}`);
  return await r.json();
}

function bboxOfGeom(geom) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of geom) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLng) minLng = p.lon;
    if (p.lon > maxLng) maxLng = p.lon;
  }
  return { minLat, maxLat, minLng, maxLng };
}

// Shoelace area on lat/lng (approx, degrees^2 converted to m^2 at centroid lat).
function polyAreaM2(geom) {
  if (geom.length < 3) return 0;
  const centerLat = geom.reduce((a, p) => a + p.lat, 0) / geom.length;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180);
  let sum = 0;
  for (let i = 0; i < geom.length; i++) {
    const a = geom[i];
    const b = geom[(i + 1) % geom.length];
    sum += (a.lon * mPerDegLng) * (b.lat * mPerDegLat) - (b.lon * mPerDegLng) * (a.lat * mPerDegLat);
  }
  return Math.abs(sum) / 2;
}

function summarize(way) {
  const geom = way.geometry || [];
  const bbox = bboxOfGeom(geom);
  const latSpanM = (bbox.maxLat - bbox.minLat) * 111_320;
  const centerLat = (bbox.maxLat + bbox.minLat) / 2;
  const lngSpanM = (bbox.maxLng - bbox.minLng) * 111_320 * Math.cos((centerLat * Math.PI) / 180);
  const aspectRatio = latSpanM > 0 && lngSpanM > 0 ? Math.max(latSpanM, lngSpanM) / Math.min(latSpanM, lngSpanM) : null;
  return {
    osm_id: way.id,
    type: way.type,
    tags_building: way.tags?.building ?? null,
    vertex_count: geom.length,
    bbox_lat_span_m: Math.round(latSpanM * 100) / 100,
    bbox_lng_span_m: Math.round(lngSpanM * 100) / 100,
    bbox_aspect_ratio: aspectRatio ? Math.round(aspectRatio * 100) / 100 : null,
    approx_area_m2: Math.round(polyAreaM2(geom)),
  };
}

async function main() {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(process.cwd(), ".tmp", "a8-diag", `probe5-footprints-${iso}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const rows = {};
  for (const [key, addr] of Object.entries(ADDRESSES)) {
    console.log(`\n[probe5] ${key}: ${addr}`);
    const { lat, lng } = await geocode(addr);
    console.log(`  geocoded ${lat},${lng}`);
    const t0 = Date.now();
    let data;
    try {
      data = await overpassBuildings(lat, lng, RADIUS_M);
    } catch (err) {
      console.log(`  overpass err: ${err}`);
      rows[key] = { addr, lat, lng, error: String(err) };
      continue;
    }
    const dt = Date.now() - t0;
    const elems = data.elements || [];
    const summaries = elems.map(summarize);
    // Pipeline A's fetch_footprint returns the largest building.
    summaries.sort((a, b) => (b.approx_area_m2 ?? 0) - (a.approx_area_m2 ?? 0));
    rows[key] = {
      addr,
      lat,
      lng,
      overpass_ms: dt,
      building_count: elems.length,
      picked_largest: summaries[0] ?? null,
      all_buildings: summaries,
    };
    console.log(`  overpass ${dt}ms  n_buildings=${elems.length}  picked_area=${summaries[0]?.approx_area_m2 ?? "-"} m²  verts=${summaries[0]?.vertex_count ?? "-"}  aspect=${summaries[0]?.bbox_aspect_ratio ?? "-"}`);
  }

  fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  console.log(`\nWrote ${out}`);

  console.log("\n".padEnd(80, "="));
  console.log("Probe 5 summary (H2 test — polygon shape outliers):");
  for (const [k, r] of Object.entries(rows)) {
    if (r.error) {
      console.log(`  ${k.padEnd(10)}: ERROR ${r.error}`);
      continue;
    }
    const p = r.picked_largest;
    if (!p) { console.log(`  ${k.padEnd(10)}: no building found`); continue; }
    console.log(`  ${k.padEnd(10)}: n=${r.building_count}  verts=${p.vertex_count}  aspect=${p.bbox_aspect_ratio}  area=${p.approx_area_m2}m²`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
