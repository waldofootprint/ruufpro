#!/usr/bin/env node
/**
 * Bake a real-LiDAR RoofScene from Pipeline A for a single address.
 *
 *   LIDAR_MEASURE_URL=... GOOGLE_MAPS_API_KEY=... \
 *     node scripts/bake-roof-3d.mjs \
 *       --address "8734 54th Ave E, Bradenton, FL 34211" \
 *       --out lib/baked-roofs/bradenton-luxury.json \
 *       --id bradenton-luxury
 *       [--no-reconstruction]   # skip RR.1 reconstruction, use raw per-plane hulls
 *
 * Pipeline A returns plane polygons + ridge/hip/valley line endpoints in tile CRS
 * coords (FL East ftUS, EPSG:2236). This script:
 *   1) geocodes the address
 *   2) calls Modal with emit_full_tier3=true
 *   3) re-centers on building centroid + flips Y (CRS uses +Y north, three.js
 *      scene uses +Y up after rotation; centering preserves shape)
 *   4) emits the RoofScene shape consumed by components/widget/roof-render-3d.tsx
 */
/* eslint-disable no-console */

const args = (() => {
  const m = new Map();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[++i] : "true";
      m.set(k, v);
    }
  }
  return m;
})();

import { partition } from "./roof-partition.mjs";

const ADDRESS = args.get("address");
const OUT_PATH = args.get("out");
const SCENE_ID = args.get("id") || "baked-roof";
const USE_RECONSTRUCTION = args.get("no-reconstruction") !== "true";

if (!ADDRESS || !OUT_PATH) {
  console.error("usage: --address '...' --out lib/baked-roofs/foo.json [--id slug]");
  process.exit(1);
}

const URL = process.env.LIDAR_MEASURE_URL;
const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!URL) throw new Error("LIDAR_MEASURE_URL required");
if (!KEY) throw new Error("GOOGLE_MAPS_API_KEY required");

async function geocode(address) {
  const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${KEY}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`geocode HTTP ${r.status}`);
  const j = await r.json();
  if (j.status !== "OK") throw new Error(`geocode ${j.status}`);
  return j.results[0].geometry.location;
}

async function measure(lat, lng) {
  const t0 = Date.now();
  const r = await fetch(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lat, lng, address: ADDRESS, emit_full_tier3: true, z_meters_to_feet: true, emit_plane_inlier_points: USE_RECONSTRUCTION }),
  });
  const ms = Date.now() - t0;
  if (!r.ok) throw new Error(`measure HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  if (j.outcome !== "ok") throw new Error(`measure outcome=${j.outcome} fetch=${j.fetchPath}`);
  if (!j.fullTier3) throw new Error("missing fullTier3 — Modal not redeployed?");
  console.log(`[measure] ok in ${ms}ms · ${j.fullTier3.num_segments} segs · ${Math.round(j.fullTier3.roof_horiz_sqft)} sqft horiz`);
  return j.fullTier3;
}

function centerAndProject(tier3, recon) {
  // Decide source: RR.2 partition pieces (preferred) or legacy per-plane hulls.
  // S1: render pieces whenever they exist + lifted; sanity (area drift vs roof_horiz_sqft)
  // is informational, not a render gate — Hannah needs to G3-S1 eyeball the partition
  // even when drift trips the threshold (footprint area ≠ roof_horiz_sqft on Bradenton).
  const useRecon = recon && recon.pieces && recon.pieces.length > 0;
  const planeSource = useRecon
    ? recon.pieces.map((p) => ({ id: p.id, vertices3d: p.boundary3d, type: p.type, sqft: p.sqft }))
    : (tier3.segments || [])
        .filter((s) => Array.isArray(s.polygon_3d) && s.polygon_3d.length >= 3)
        .map((s) => ({
          id: `s${s.id}`,
          vertices3d: s.polygon_3d,
          type: s.pitch_degrees != null && s.pitch_degrees < 25 ? "main" : "hip",
          sqft: Math.round(s.sloped_area_sqft || 0),
        }));
  console.log(`[bake] geometry source: ${useRecon ? `RR.2 partition (${recon.pieces.length} pieces)` : "legacy per-plane hull"}`);
  if (useRecon && recon.sane && !recon.sane.ok) {
    console.warn(`[bake] WARN partition sanity: ${recon.sane.reason}`);
  }

  // Collect every coord that contributes to scene geometry to find centroid + bounds.
  const allPts = [];
  for (const p of planeSource) for (const v of p.vertices3d) allPts.push(v);

  // Edges: RR.2 emits ridges only this session (Session 1 scope). Lift each ridge's
  // 2D segment via the chosen plane (use planeA's normal/d) to get a 3D segment for
  // bounds. The ridge sits on BOTH planes by construction so either choice agrees.
  const intersectionEdges = useRecon
    ? (recon.ridges || []).map((r) => {
        const seg = ridgeSegmentOnPiece(r, recon.pieces);
        return { type: "ridge", endpoints: seg, lengthFt: seg ? Math.hypot(seg[1][0]-seg[0][0], seg[1][1]-seg[0][1], seg[1][2]-seg[0][2]) : 0 };
      }).filter((e) => e.endpoints)
    : Object.entries(tier3.intersections_detail || {}).flatMap(([type, list]) =>
        ["ridge", "hip", "valley"].includes(type)
          ? list.map((e) => ({ type, endpoints: e.line_endpoints, lengthFt: e.length_ft }))
          : []
      );
  for (const e of intersectionEdges) for (const v of e.endpoints) allPts.push(v);
  if (!allPts.length) throw new Error("tier3 has no geometry — nothing to bake");

  // Plan-view center (mean x/y) and ground z (min z, used as reference floor).
  const mean = (i) => allPts.reduce((a, p) => a + p[i], 0) / allPts.length;
  const cx = mean(0), cy = mean(1);
  const minZ = Math.min(...allPts.map((p) => p[2]));

  // Translate so building centers on (0,0,0). Three.js scene later rotates -π/2 on
  // X so the +Z axis becomes screen-up, which matches the existing stub convention.
  const tx = (v) => [
    +(v[0] - cx).toFixed(3),
    +(v[1] - cy).toFixed(3),
    +(v[2] - minZ).toFixed(3),
  ];

  const planes = planeSource.map((p) => ({
    id: p.id,
    type: p.type,
    vertices: p.vertices3d.map(tx),
    sqft: p.sqft,
  }));

  const edges = intersectionEdges.map((e, i) => ({
    id: `e${i}-${e.type}`,
    type: e.type,
    start: tx(e.endpoints[0]),
    end: tx(e.endpoints[1]),
    lengthFt: Math.round(e.lengthFt || 0),
  }));

  // Bounds in centered space
  const xs = planes.flatMap((p) => p.vertices.map((v) => v[0]));
  const ys = planes.flatMap((p) => p.vertices.map((v) => v[1]));
  const zs = planes.flatMap((p) => p.vertices.map((v) => v[2]));

  // Pitch readout: pick area-weighted dominant pitch_ratio_over_12 → "N:12"
  let num = 0, den = 0;
  for (const s of tier3.segments || []) {
    if (s.pitch_ratio_over_12 == null) continue;
    const a = s.horiz_area_sqft || 0;
    num += a * s.pitch_ratio_over_12;
    den += a;
  }
  const dominantPitch = den > 0 ? Math.round(num / den) : null;

  return {
    address: ADDRESS,
    totalSqft: Math.round(tier3.roof_sloped_sqft_sum || tier3.roof_horiz_sqft || 0),
    pitch: dominantPitch != null ? `${dominantPitch}:12` : "—",
    planes,
    edges,
    bounds: {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
      maxZ: Math.max(...zs),
    },
    _meta: {
      sceneId: SCENE_ID,
      bakedAt: new Date().toISOString(),
      pipelineFetchPath: tier3._fetch_path || null,
      numSegments: tier3.num_segments,
      footprintSource: tier3.footprint_source,
      pointDensity: tier3.point_density_pts_per_m2,
      inlierRatio: tier3.inlierRatio,
      reconstruction: useRecon ? {
        enabled: true,
        algorithm: "rr3-adjacency-graph",
        session: "rr3",
        pieceCount: recon.pieces.length,
        ridgeCount: (recon.ridges || []).length,
        sanityOk: recon.sane?.ok ?? null,
        sanityReason: recon.sane?.reason ?? null,
        audit: recon.audit ?? null,         // emits regardless of sanity (RR.1 deferred item 9)
        auditEmitted: recon.auditEmitted ?? false,
        totalArea: recon.totalArea ?? null,
        drift: recon.drift ?? null,
        adjacency: recon.adjacency ?? null, // RR.3 §3.1
        sanity: recon.sanity ?? null,       // RR.3 §3.3
      } : { enabled: false },
    },
  };
}

async function main() {
  console.log(`[bake] address: ${ADDRESS}`);
  console.log(`[bake] geocoding…`);
  const { lat, lng } = await geocode(ADDRESS);
  console.log(`[bake]   lat=${lat} lng=${lng}`);
  console.log(`[bake] calling Modal (cold start ~25s)…`);
  const tier3 = await measure(lat, lng);
  let recon = null;
  if (USE_RECONSTRUCTION) {
    console.log(`[bake] running RR.2 footprint partition (Session 1 — ridges only)…`);
    recon = partition(tier3, { logger: (m) => console.log(`  ${m}`) });
    console.log(`[bake]   partition.ok=${recon.ok} pieces=${recon.pieces?.length ?? 0} ridges=${recon.ridges?.length ?? 0} sane=${recon.sane?.ok ?? "n/a"} auditEmitted=${recon.auditEmitted ?? false}`);
    if (recon.sane && !recon.sane.ok) console.log(`[bake]   sanity: ${recon.sane.reason}`);
    if (recon.audit) {
      const a = recon.audit;
      console.log(`[bake]   audit: ${a.closed} closed / ${a.partial} partial / ${a.missing} missing of ${a.ridgeCount} ridges · ${a.zMismatches} z-mismatches`);
    }
  }
  console.log(`[bake] projecting + centering…`);
  const scene = centerAndProject(tier3, recon);
  console.log(`[bake]   ${scene.planes.length} planes · ${scene.edges.length} edges · ${scene.totalSqft} sqft sloped · pitch ${scene.pitch}`);

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const outAbs = path.resolve(OUT_PATH);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, JSON.stringify(scene, null, 2));
  console.log(`[bake] wrote ${outAbs}`);
}

/**
 * Find the 3D segment for a ridge by locating any piece edge that lies along
 * the ridge's 2D blade and reusing that edge's already-lifted z-coords.
 * Falls back to null if no piece touched the ridge (audit will already flag this).
 */
function ridgeSegmentOnPiece(ridge, pieces) {
  const seg2 = ridge.seg2d;
  if (!seg2) return null;
  const TOL = 0.5; // ft — same as RIDGE_MATCH_DIST_FT in roof-partition.mjs
  const distSeg = (p, a, b) => {
    const dx = b[0]-a[0], dy = b[1]-a[1];
    const L2 = dx*dx + dy*dy;
    if (L2 < 1e-12) return Math.hypot(p[0]-a[0], p[1]-a[1]);
    let t = ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / L2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0]+t*dx), p[1] - (a[1]+t*dy));
  };
  for (const piece of pieces) {
    const v2 = piece.boundary2d, v3 = piece.boundary3d;
    for (let i = 0; i < v2.length; i++) {
      const a2 = v2[i], b2 = v2[(i+1) % v2.length];
      if (distSeg(a2, seg2[0], seg2[1]) < TOL && distSeg(b2, seg2[0], seg2[1]) < TOL) {
        return [v3[i], v3[(i+1) % v3.length]];
      }
    }
  }
  return null;
}

main().catch((e) => {
  console.error("[bake] ERROR:", e.message);
  process.exit(1);
});
