/**
 * Bake-side roof reconstruction — RR.2 footprint-partition design.
 *
 * Calculator-invisible by construction: consumes Pipeline A tier3 JSON
 * (with `emit_plane_inlier_points: true`) plus its MS Footprint polygon,
 * cuts the footprint along projected plane-plane intersection lines, lifts
 * each piece to 3D via its assigned plane equation. Closed mesh + shared
 * ridge edges + footprint-bounded eaves come for free.
 *
 * Pipeline (Session 1 — RIDGES ONLY):
 *   3.1.1a  plane-pair intersection lines, filtered to ridges
 *   3.1.1b  project ridge segments into the footprint xy plane (clip to bbox)
 *   3.1.1c  footprint cut: subtract ε-buffered blade rectangles from footprint
 *   3.1.1d  plane assignment per piece (inlier vote, tie → nearest centroid)
 *   3.1.1e  3D lift via plane equation z = -(ax + by + d) / c
 *   3.1.1f  sanity check + audit (audit emits regardless of sanity pass/fail)
 *
 * No Pipeline A touch.  No new Modal flag (reuses RR.1's emit_plane_inlier_points).
 * Hips, valleys, gables, garage wings → Session 2.
 */

import polygonClipping from "polygon-clipping";

// ───────────────────────────── tunables ─────────────────────────────
const RIDGE_HORIZONTAL_DZ = 0.33;     // |dz/dxy| < this on intersection line → ridge
const NORMAL_PARALLEL_DOT = 0.985;    // |n1·n2| > this → planes parallel, no line
const SANITY_AREA_DRIFT = 0.15;       // reject if mesh sqft drifts >15% from roof_horiz_sqft
const BLADE_HALF_WIDTH_FT = 0.1;      // ε buffer around each ridge for footprint cut
const BLADE_OVERSHOOT_FT = 50;        // extend each blade past footprint bbox so cut crosses fully
const RIDGE_MATCH_DIST_FT = 0.5;      // edge-to-ridge tolerance for G4 audit
const RIDGE_Z_AGREE_FT = 0.5;         // |Δz| at ridge endpoints between adjacent pieces
const TIE_RATIO = 0.10;               // top-2 inlier counts within 10% → centroid tiebreak
const MIN_PIECE_AREA_SQFT = 25;       // drop slivers (matches RR.1's MIN_CLUSTER_AREA_SQFT)
const RIDGE_INLIER_NEAR_FT = 4.0;     // adjacency filter: inlier xy-distance to ridge line must be < this
const RIDGE_MIN_BOTH_PLANES_INLIERS = 6; // ridge requires ≥N inliers from EACH plane near the line
const RIDGE_MIN_LENGTH_FT = 5.0;      // drop ridge if usable extent < this after inlier-overlap clip

// ───────────────────────────── vector helpers ─────────────────────────────
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function norm3(a) { return Math.sqrt(dot3(a, a)); }

/** Intersection line of two planes (n·p + d = 0). Returns {dir, point} or null. */
function planeIntersectionLine(p1, p2) {
  const n1 = p1.normal, n2 = p2.normal, d1 = p1.d, d2 = p2.d;
  const dir = cross3(n1, n2);
  const m = norm3(dir);
  if (m < 1e-6) return null;
  const dirN = [dir[0] / m, dir[1] / m, dir[2] / m];
  const ax = Math.abs(dir[0]), ay = Math.abs(dir[1]), az = Math.abs(dir[2]);
  let point;
  if (az >= ax && az >= ay) {
    const det = n1[0] * n2[1] - n1[1] * n2[0];
    point = [(-d1 * n2[1] + d2 * n1[1]) / det, (-d2 * n1[0] + d1 * n2[0]) / det, 0];
  } else if (ay >= ax) {
    const det = n1[0] * n2[2] - n1[2] * n2[0];
    point = [(-d1 * n2[2] + d2 * n1[2]) / det, 0, (-d2 * n1[0] + d1 * n2[0]) / det];
  } else {
    const det = n1[1] * n2[2] - n1[2] * n2[1];
    point = [0, (-d1 * n2[2] + d2 * n1[2]) / det, (-d2 * n1[1] + d1 * n2[1]) / det];
  }
  return { dir: dirN, point };
}

/** True if intersection line is "horizontal-enough" to count as a ridge. */
function isRidge(line) {
  const dxy = Math.hypot(line.dir[0], line.dir[1]);
  if (dxy < 1e-6) return false; // vertical line — neither ridge nor hip
  return Math.abs(line.dir[2]) / dxy < RIDGE_HORIZONTAL_DZ;
}

// ───────────────────────────── 2D helpers ─────────────────────────────
function bbox2d(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  }
  return { minX, maxX, minY, maxY };
}

/** Clip an infinite 2D line (point + dir, xy components only) to a bbox + margin. */
function clipLineToBbox2D(line, box, margin) {
  const px = line.point[0], py = line.point[1];
  const dx = line.dir[0], dy = line.dir[1];
  let tMin = -Infinity, tMax = Infinity;
  for (let axis = 0; axis < 2; axis++) {
    const min = (axis === 0 ? box.minX : box.minY) - margin;
    const max = (axis === 0 ? box.maxX : box.maxY) + margin;
    const p = axis === 0 ? px : py;
    const d = axis === 0 ? dx : dy;
    if (Math.abs(d) < 1e-9) {
      if (p < min || p > max) return null;
      continue;
    }
    let t1 = (min - p) / d, t2 = (max - p) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tMin) tMin = t1;
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return null;
  }
  if (!isFinite(tMin) || !isFinite(tMax)) return null;
  return [
    [px + tMin * dx, py + tMin * dy],
    [px + tMax * dx, py + tMax * dy],
  ];
}

/** Build a thin closed-ring rectangle around 2D segment AB with the given half-width. */
function bladeRectangle(a, b, halfWidth) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  if (L < 1e-9) return null;
  const ux = dx / L, uy = dy / L;
  const nx = -uy, ny = ux;
  const c1 = [a[0] + halfWidth * nx, a[1] + halfWidth * ny];
  const c2 = [b[0] + halfWidth * nx, b[1] + halfWidth * ny];
  const c3 = [b[0] - halfWidth * nx, b[1] - halfWidth * ny];
  const c4 = [a[0] - halfWidth * nx, a[1] - halfWidth * ny];
  return [c1, c2, c3, c4, c1]; // closed
}

/** Ray-casting point-in-polygon test (closed ring). */
function pointInRing(pt, ring) {
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Shoelace area on a closed ring (last vertex == first). */
function ringArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(s) / 2;
}

function ringCentroid(ring) {
  let cx = 0, cy = 0;
  const n = ring.length - 1; // skip closing duplicate
  for (let i = 0; i < n; i++) { cx += ring[i][0]; cy += ring[i][1]; }
  return [cx / n, cy / n];
}

/** Distance from 2D point P to segment AB. */
function pointToSegmentDist2D(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Lift a 2D ring → 3D via plane equation z = -(nx·x + ny·y + d) / nz. Null if degenerate. */
function liftRing(ring, plane) {
  const [nx, ny, nz] = plane.normal;
  const d = plane.d;
  if (Math.abs(nz) < 1e-6) return null;
  return ring.map((v) => [v[0], v[1], -(nx * v[0] + ny * v[1] + d) / nz]);
}

/**
 * Find the param range along segment AB where BOTH plane inlier sets have at least
 * RIDGE_MIN_BOTH_PLANES_INLIERS points within RIDGE_INLIER_NEAR_FT of the line.
 * Returns { seg, lengthFt } clipped to that overlap, plus a small buffer; or null
 * if either plane has insufficient support.
 *
 * Use case: a real ridge between plane A and plane B should have inliers from both
 * planes near its xy-line. Phantom plane-pair intersections (planes that don't share
 * a roof edge in 3D) get rejected here.
 */
function supportExtentOnLine(seg, inliersA, inliersB) {
  const a = seg[0], b = seg[1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return null;
  const ux = dx / L, uy = dy / L;
  const nx = -uy, ny = ux;
  const project = (inliers) => {
    const ts = [];
    for (const p of inliers) {
      const px = p[0] - a[0], py = p[1] - a[1];
      const tDist = Math.abs(px * nx + py * ny);
      if (tDist > RIDGE_INLIER_NEAR_FT) continue;
      const t = (px * ux + py * uy) / L; // param 0..1 along segment
      if (t < -0.05 || t > 1.05) continue;
      ts.push(t);
    }
    return ts;
  };
  const tA = project(inliersA);
  const tB = project(inliersB);
  if (tA.length < RIDGE_MIN_BOTH_PLANES_INLIERS) return null;
  if (tB.length < RIDGE_MIN_BOTH_PLANES_INLIERS) return null;
  // Overlap of the two support ranges
  const tMinA = Math.min(...tA), tMaxA = Math.max(...tA);
  const tMinB = Math.min(...tB), tMaxB = Math.max(...tB);
  const tMin = Math.max(tMinA, tMinB);
  const tMax = Math.min(tMaxA, tMaxB);
  if (tMin >= tMax) return null;
  // Add a small buffer (~2 ft along the line) so the cut actually reaches the next ridge / footprint edge
  const buf = 2 / L;
  const t1 = Math.max(0, tMin - buf);
  const t2 = Math.min(1, tMax + buf);
  const newSeg = [
    [a[0] + t1 * dx, a[1] + t1 * dy],
    [a[0] + t2 * dx, a[1] + t2 * dy],
  ];
  return { seg: newSeg, lengthFt: (t2 - t1) * L };
}

function closeRing(ring) {
  const out = ring.map((p) => [p[0], p[1]]);
  const first = out[0], last = out[out.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
  return out;
}

// ───────────────────────────── orchestrator ─────────────────────────────

/**
 * Partition a roof footprint along ridge intersections; lift each piece to 3D.
 *
 * @param {object} tier3 - full tier3 JSON from Pipeline A. Must include:
 *                          - segments[] with {normal, centroid, points (inliers), id, pitch_*}
 *                          - footprint_polygon_xy_ftus[][2]
 *                          - roof_horiz_sqft (for sanity check)
 * @param {object} opts  - { logger }
 * @returns {object} {
 *     ok, fallback?, reason?,
 *     pieces[]:    { id, planeId, planeIdx, type, pitch_ratio_over_12, pitch_degrees,
 *                    boundary2d, boundary3d, sqft, tiebreak },
 *     ridges[]:    { id, planeA, planeB, seg2d },
 *     audit:       { ridgeCount, closed, partial, missing, zMismatches, details[] },
 *     auditEmitted: true,        // ALWAYS true once we get past trivial input checks
 *     sane:        { ok, reason? },
 *     totalArea, drift,
 *   }
 */
export function partition(tier3, opts = {}) {
  const log = opts.logger || (() => {});
  const segs = tier3.segments || [];
  if (!segs.length) return makeFailure({ reason: "no segments" });
  if (!segs[0].points) return makeFailure({ reason: "tier3 missing inlier points (call Modal with emit_plane_inlier_points: true)" });
  const footprint = tier3.footprint_polygon_xy_ftus;
  if (!footprint || footprint.length < 3) return makeFailure({ reason: "tier3 missing footprint_polygon_xy_ftus" });

  // Build plane records (compute d from normal + centroid; tier3 ships normal & centroid only).
  const planes = segs.map((s, i) => ({
    idx: i,
    id: `s${s.id}`,
    normal: s.normal,
    d: -dot3(s.normal, s.centroid),
    centroid: s.centroid,
    inliers: s.points,
    pitch_ratio_over_12: s.pitch_ratio_over_12,
    pitch_degrees: s.pitch_degrees,
  }));

  // 3.1.1a — plane-pair intersections, ridges only
  const ridgeLines = [];
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      const pi = planes[i], pj = planes[j];
      if (Math.abs(dot3(pi.normal, pj.normal)) > NORMAL_PARALLEL_DOT) continue;
      const line = planeIntersectionLine(pi, pj);
      if (!line) continue;
      if (!isRidge(line)) continue;
      ridgeLines.push({ a: i, b: j, line });
    }
  }
  log(`[partition] ${planes.length} planes → ${ridgeLines.length} ridge lines`);

  // 3.1.1b — clip each ridge line to footprint bbox + overshoot, then keep only
  // ridges supported by inliers from BOTH planes (adjacency filter — RR.1 had this
  // implicitly via per-plane DBSCAN; RR.2 needs an explicit replacement so phantom
  // plane-pair intersections between non-adjacent planes don't carve up the footprint).
  const fpBbox = bbox2d(footprint);
  const ridges2D = [];
  let droppedNoSupport = 0, droppedTooShort = 0;
  for (const r of ridgeLines) {
    const bladeSeg = clipLineToBbox2D(r.line, fpBbox, BLADE_OVERSHOOT_FT);
    if (!bladeSeg) continue;
    const support = supportExtentOnLine(bladeSeg, planes[r.a].inliers, planes[r.b].inliers);
    if (!support) { droppedNoSupport++; continue; }
    if (support.lengthFt < RIDGE_MIN_LENGTH_FT) { droppedTooShort++; continue; }
    // Cut blade spans the bbox so the ridge fully partitions the footprint.
    // Audit/render uses the supported-extent segment so display + closure check
    // reflect where inliers actually exist.
    ridges2D.push({ ...r, seg: support.seg, bladeSeg });
  }
  log(`[partition] ${ridges2D.length} ridges with two-plane inlier support (dropped ${droppedNoSupport} no-support, ${droppedTooShort} too-short)`);

  if (ridges2D.length === 0) {
    return {
      ...makeFailure({ reason: "no ridge intersections crossed footprint" }),
      audit: emptyAudit(),
      auditEmitted: true,
    };
  }

  // 3.1.1c — footprint cut: subtract buffered blades from footprint
  const fpRing = closeRing(footprint);
  let pieces = [[fpRing]]; // MultiPolygon: [[outerRing, holes...], ...]
  for (const r of ridges2D) {
    const blade = bladeRectangle(r.bladeSeg[0], r.bladeSeg[1], BLADE_HALF_WIDTH_FT);
    if (!blade) continue;
    pieces = polygonClipping.difference(pieces, [[blade]]);
    if (!pieces || pieces.length === 0) break;
  }

  // Each polygon = [outer, ...holes]; for ridges-only S1 we keep only outer rings.
  const pieceRings = (pieces || [])
    .map((poly) => poly[0])
    .filter((ring) => ring && ring.length >= 4)
    .filter((ring) => ringArea(ring) >= MIN_PIECE_AREA_SQFT);
  log(`[partition] footprint cut → ${pieceRings.length} pieces (≥${MIN_PIECE_AREA_SQFT} sqft)`);

  if (pieceRings.length < 2) {
    return {
      ...makeFailure({ reason: `footprint did not partition (got ${pieceRings.length} piece, ridges may not cross footprint)` }),
      ridges: ridges2D.map(toRidgeOut),
      audit: emptyAudit({ ridgeCount: ridges2D.length }),
      auditEmitted: true,
    };
  }

  // 3.1.1d — plane assignment per piece (inlier vote, tie → nearest centroid)
  const assigned = [];
  let unassignedCount = 0;
  for (let pi = 0; pi < pieceRings.length; pi++) {
    const ring = pieceRings[pi];
    const counts = new Array(planes.length).fill(0);
    for (const plane of planes) {
      for (const ip of plane.inliers) {
        if (pointInRing([ip[0], ip[1]], ring)) counts[plane.idx]++;
      }
    }
    let topIdx = -1, topCount = 0, secondCount = 0;
    for (let k = 0; k < counts.length; k++) {
      if (counts[k] > topCount) { secondCount = topCount; topCount = counts[k]; topIdx = k; }
      else if (counts[k] > secondCount) { secondCount = counts[k]; }
    }
    let plane = topIdx >= 0 && topCount > 0 ? planes[topIdx] : null;
    let tiebreak = false;
    if (plane && secondCount > 0 && (topCount - secondCount) / topCount < TIE_RATIO) {
      const c = ringCentroid(ring);
      let best = -1, bd = Infinity;
      for (let k = 0; k < planes.length; k++) {
        const cd = (planes[k].centroid[0] - c[0]) ** 2 + (planes[k].centroid[1] - c[1]) ** 2;
        if (cd < bd) { bd = cd; best = k; }
      }
      plane = planes[best];
      tiebreak = true;
    }
    if (!plane) {
      unassignedCount++;
      assigned.push({ ring, plane: null, area: ringArea(ring), pieceIdx: pi });
      continue;
    }
    assigned.push({ ring, plane, area: ringArea(ring), pieceIdx: pi, inlierCount: topCount, tiebreak });
  }
  log(`[partition] plane-assigned ${assigned.length - unassignedCount}/${assigned.length} pieces (${unassignedCount} unassigned)`);

  // 3.1.1e — 3D lift
  const liftedPieces = [];
  let liftFails = 0;
  for (const a of assigned) {
    if (!a.plane) { liftFails++; continue; }
    const ring3d = liftRing(a.ring, a.plane);
    if (!ring3d) { liftFails++; continue; }
    liftedPieces.push({
      id: `p${a.pieceIdx}`,
      planeId: a.plane.id,
      planeIdx: a.plane.idx,
      type: a.plane.pitch_degrees != null && a.plane.pitch_degrees < 25 ? "main" : "hip",
      pitch_ratio_over_12: a.plane.pitch_ratio_over_12,
      pitch_degrees: a.plane.pitch_degrees,
      boundary2d: a.ring.slice(0, -1),       // drop redundant closing vertex
      boundary3d: ring3d.slice(0, -1),
      sqft: Math.round(a.area),
      tiebreak: a.tiebreak,
    });
  }
  log(`[partition] lifted ${liftedPieces.length} pieces (${liftFails} lift fails)`);

  // 3.1.1f — sanity + audit (audit emits regardless — fixes RR.1 deferred item 9)
  const audit = meshAudit(liftedPieces, ridges2D);
  const totalArea = liftedPieces.reduce((acc, p) => acc + p.sqft, 0);
  const refArea = tier3.roof_horiz_sqft || 0;
  const drift = refArea > 0 ? Math.abs(totalArea - refArea) / refArea : null;
  const sane = sanityCheck({ unassignedCount, liftFails, drift, refArea, pieceCount: liftedPieces.length });

  return {
    ok: sane.ok && liftedPieces.length > 0,
    fallback: !sane.ok,
    sane,
    pieces: liftedPieces,
    ridges: ridges2D.map(toRidgeOut),
    audit,
    auditEmitted: true,
    totalArea,
    drift,
  };
}

// ───────────────────────────── sanity ─────────────────────────────

function sanityCheck({ unassignedCount, liftFails, drift, refArea, pieceCount }) {
  if (pieceCount === 0) return { ok: false, reason: "no pieces survived plane assignment + 3D lift" };
  if (unassignedCount > 0) return { ok: false, reason: `${unassignedCount} piece(s) failed plane assignment` };
  if (liftFails > 0) return { ok: false, reason: `${liftFails} piece(s) failed 3D lift (degenerate plane)` };
  if (refArea > 0 && drift != null && drift > SANITY_AREA_DRIFT) {
    return { ok: false, reason: `area drift ${(drift * 100).toFixed(1)}% > ${SANITY_AREA_DRIFT * 100}%` };
  }
  return { ok: true };
}

// ───────────────────────────── audit ─────────────────────────────

function emptyAudit(extra = {}) {
  return { ridgeCount: 0, closed: 0, partial: 0, missing: 0, zMismatches: 0, details: [], ...extra };
}

function toRidgeOut(r, i) {
  // seg2d = inlier-supported extent (for display + ridge-segment lookup in bake);
  // bladeSeg2d = bbox-spanning blade used for the cut (audit traces piece edges against this).
  return { id: `r${i}`, planeA: r.a, planeB: r.b, seg2d: r.seg, bladeSeg2d: r.bladeSeg || r.seg };
}

/**
 * For each ridge, find which piece edges lie along it (within tolerance).
 * G4 closure expectation: every ridge bounded by exactly 2 pieces, with z agreement
 * < RIDGE_Z_AGREE_FT at the ridge endpoints between the two pieces' shared edges.
 *
 * Audit emits regardless of sanity outcome — pieces[] may be empty if 3D lift
 * failed; in that case all ridges report missing.
 */
function meshAudit(pieces, ridges2D) {
  const ridgeReports = ridges2D.map((r, i) => ({
    id: `r${i}`,
    planeA: r.a, planeB: r.b,
    bladeSeg: r.bladeSeg || r.seg,   // piece edges follow the blade, not the support extent
    touches: [],
  }));

  const edgeOnRidge = (a2, b2, ridge) => {
    const dA = pointToSegmentDist2D(a2, ridge.bladeSeg[0], ridge.bladeSeg[1]);
    const dB = pointToSegmentDist2D(b2, ridge.bladeSeg[0], ridge.bladeSeg[1]);
    return dA < RIDGE_MATCH_DIST_FT && dB < RIDGE_MATCH_DIST_FT;
  };

  for (const piece of pieces) {
    const v2 = piece.boundary2d, v3 = piece.boundary3d;
    for (let i = 0; i < v2.length; i++) {
      const a2 = v2[i], b2 = v2[(i + 1) % v2.length];
      const a3 = v3[i], b3 = v3[(i + 1) % v3.length];
      for (const r of ridgeReports) {
        if (edgeOnRidge(a2, b2, r)) {
          r.touches.push({ pieceId: piece.id, edge: i, a3, b3 });
        }
      }
    }
  }

  let closed = 0, partial = 0, missing = 0, zMismatches = 0;
  const details = [];
  for (const r of ridgeReports) {
    const n = r.touches.length;
    if (n === 0) { missing++; details.push({ ridge: r.id, status: "missing", touches: 0 }); continue; }
    if (n === 1) { partial++; details.push({ ridge: r.id, status: "partial-single-touch", touches: 1 }); continue; }

    // Use first two touching pieces; check z agreement at endpoints (handle reversed edges).
    const t1 = r.touches[0], t2 = r.touches[1];
    const dzAA = Math.abs(t1.a3[2] - t2.a3[2]);
    const dzBB = Math.abs(t1.b3[2] - t2.b3[2]);
    const dzAB = Math.abs(t1.a3[2] - t2.b3[2]);
    const dzBA = Math.abs(t1.b3[2] - t2.a3[2]);
    const dzStart = Math.min(dzAA, dzAB);
    const dzEnd = Math.min(dzBB, dzBA);
    const okZ = dzStart < RIDGE_Z_AGREE_FT && dzEnd < RIDGE_Z_AGREE_FT;
    if (n === 2 && okZ) closed++;
    else { partial++; if (!okZ) zMismatches++; }
    details.push({
      ridge: r.id,
      status: n === 2 && okZ ? "closed" : (okZ ? `partial-${n}-touches` : "z-mismatch"),
      touches: n,
      dzStart: +dzStart.toFixed(3),
      dzEnd: +dzEnd.toFixed(3),
    });
  }

  return { ridgeCount: ridges2D.length, closed, partial, missing, zMismatches, details };
}

// ───────────────────────────── failure shape ─────────────────────────────

function makeFailure(extra) {
  return {
    ok: false,
    fallback: true,
    pieces: [],
    ridges: [],
    audit: null,
    auditEmitted: false,
    sane: { ok: false, reason: extra.reason || "unknown" },
    totalArea: 0,
    drift: null,
    ...extra,
  };
}
