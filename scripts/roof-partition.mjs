/**
 * Bake-side roof reconstruction — RR.3 adjacency-graph pivot, ridges-only.
 *
 * RR.3 modifies the RR.2-S1 module in place. Two structural changes vs S1:
 *   §3.1  plane-adjacency graph (convex hull of inlier xy + hull-vs-hull
 *         proximity) gates plane-pair intersection enumeration. Non-adjacent
 *         pairs are dropped before any blade is built.
 *   §3.2  per-piece plane assignment is constrained to the piece's border_set
 *         (planes whose intersection produced the piece's ridge edges).
 *         S1 global inlier-vote becomes a fallback.
 *   §3.3  sanity area-drift reference field swap: roof_horiz_sqft →
 *         structure_footprint_sqft (stable Pipeline A field). Threshold 15%.
 *
 * S1's inlier-support filter (RIDGE_INLIER_NEAR_FT, RIDGE_MIN_BOTH_PLANES_INLIERS,
 * RIDGE_MIN_LENGTH_FT) stays as a secondary check. Constants frozen.
 *
 * No Pipeline A touch.  No new Modal flag.  No new lib.
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
const RIDGE_INLIER_NEAR_FT = 4.0;     // S1 inlier-support filter: inlier xy-distance to ridge line must be < this
const RIDGE_MIN_BOTH_PLANES_INLIERS = 6; // S1 inlier-support filter: ridge requires ≥N inliers from EACH plane near the line
const RIDGE_MIN_LENGTH_FT = 5.0;      // S1 inlier-support filter: drop ridge if usable extent < this after inlier-overlap clip
const PLANE_ADJACENCY_GAP_FT = 4.0;   // RR.3 §3.1: hull-vs-hull max xy gap to count two planes as adjacent
const RIDGE_EDGE_MATCH_FT = RIDGE_MATCH_DIST_FT; // RR.3 §3.2: piece edge → ridge match tolerance for border_set assembly

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

/**
 * Convex hull (Andrew's monotone chain) of 2D points.
 * Returns hull vertices in CCW order, NOT closed (no repeated first vertex).
 * Returns empty array on <2 unique points.
 */
function convexHull2D(points) {
  if (!points || points.length < 2) return [];
  const pts = points
    .map((p) => [p[0], p[1]])
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  // dedupe
  const uniq = [];
  for (const p of pts) {
    const last = uniq[uniq.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) uniq.push(p);
  }
  if (uniq.length < 2) return uniq;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Min distance from a point to any edge of a hull (open ring). 0 if inside. */
function pointToHullDist(p, hull) {
  if (hull.length === 0) return Infinity;
  if (hull.length === 1) return Math.hypot(p[0] - hull[0][0], p[1] - hull[0][1]);
  // inside test (only for hull.length >= 3): use closed-ring point-in-poly
  if (hull.length >= 3) {
    const ring = hull.concat([hull[0]]);
    if (pointInRing(p, ring)) return 0;
  }
  let m = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const d = pointToSegmentDist2D(p, a, b);
    if (d < m) m = d;
  }
  return m;
}

/**
 * Hulls considered adjacent if they overlap (intersection non-empty) OR the
 * minimum xy distance between them is <= gapFt. Convex-hull case only — RR.3 §3.1.
 */
function hullsAdjacent(hullA, hullB, gapFt) {
  if (!hullA.length || !hullB.length) return false;
  // Overlap test via polygon-clipping intersection on closed rings.
  if (hullA.length >= 3 && hullB.length >= 3) {
    const ringA = hullA.concat([hullA[0]]);
    const ringB = hullB.concat([hullB[0]]);
    const inter = polygonClipping.intersection([[ringA]], [[ringB]]);
    if (inter && inter.length > 0) return true;
  }
  // Min vertex-to-edge distance both directions.
  let m = Infinity;
  for (const p of hullA) {
    const d = pointToHullDist(p, hullB);
    if (d < m) m = d;
    if (m === 0) return true;
  }
  for (const p of hullB) {
    const d = pointToHullDist(p, hullA);
    if (d < m) m = d;
    if (m === 0) return true;
  }
  return m <= gapFt;
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

  // RR.3 §3.1 — plane-adjacency graph (convex hull of inlier xy + hull-vs-hull proximity)
  // Build per-plane convex hull once; gate plane-pair work on adjacency.
  const planeHulls = planes.map((p) => convexHull2D((p.inliers || []).map((pt) => [pt[0], pt[1]])));
  let pairsTotal = 0, pairsAdjacent = 0, pairsDropped = 0;
  const adjacent = []; // boolean matrix flattened: adjacent[i*N+j]
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      pairsTotal++;
      const ok = hullsAdjacent(planeHulls[i], planeHulls[j], PLANE_ADJACENCY_GAP_FT);
      if (ok) { pairsAdjacent++; adjacent[i * planes.length + j] = true; }
      else pairsDropped++;
    }
  }
  log(`[partition] adjacency: ${pairsTotal} pairs · ${pairsAdjacent} adjacent · ${pairsDropped} dropped (method=hull, gap=${PLANE_ADJACENCY_GAP_FT}ft)`);

  // 3.1.1a — plane-pair intersections, adjacent-only, ridges only
  const ridgeLines = [];
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      if (!adjacent[i * planes.length + j]) continue;
      const pi = planes[i], pj = planes[j];
      if (Math.abs(dot3(pi.normal, pj.normal)) > NORMAL_PARALLEL_DOT) continue;
      const line = planeIntersectionLine(pi, pj);
      if (!line) continue;
      if (!isRidge(line)) continue;
      ridgeLines.push({ a: i, b: j, line });
    }
  }
  log(`[partition] ${planes.length} planes → ${ridgeLines.length} ridge lines (adjacency-gated)`);

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
      adjacency: { pairs_total: pairsTotal, pairs_adjacent: pairsAdjacent, pairs_dropped_non_adjacent: pairsDropped, method: "hull" },
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
      adjacency: { pairs_total: pairsTotal, pairs_adjacent: pairsAdjacent, pairs_dropped_non_adjacent: pairsDropped, method: "hull" },
    };
  }

  // RR.3 §3.2 — constrained inlier-vote: restrict candidates to piece's border_set
  // (planes whose intersection produced the piece's ridge edges). Fall back to
  // S1 global inlier-vote when border_set is empty or yields zero inliers.
  const assigned = [];
  let unassignedCount = 0;
  let assignedViaBorderSet = 0;
  let assignedViaGlobalFallback = 0;
  for (let pi = 0; pi < pieceRings.length; pi++) {
    const ring = pieceRings[pi];

    // Build border_set: scan each piece edge; if it lies along a ridge bladeSeg,
    // add that ridge's two planes (a, b) to the set.
    const borderSet = new Set();
    for (let i = 0; i < ring.length - 1; i++) {
      const a2 = ring[i], b2 = ring[i + 1];
      for (const r of ridges2D) {
        const dA = pointToSegmentDist2D(a2, r.bladeSeg[0], r.bladeSeg[1]);
        const dB = pointToSegmentDist2D(b2, r.bladeSeg[0], r.bladeSeg[1]);
        if (dA < RIDGE_EDGE_MATCH_FT && dB < RIDGE_EDGE_MATCH_FT) {
          borderSet.add(r.a);
          borderSet.add(r.b);
        }
      }
    }

    const inlierCount = (planeIdx) => {
      let n = 0;
      for (const ip of planes[planeIdx].inliers) {
        if (pointInRing([ip[0], ip[1]], ring)) n++;
      }
      return n;
    };

    // Pick from border_set first. Tie-break (within border_set) by nearest centroid.
    let plane = null;
    let topCount = 0;
    let assignmentMode = null;
    let tiebreak = false;
    if (borderSet.size > 0) {
      const candidates = [...borderSet];
      const counts = candidates.map(inlierCount);
      let topIdx = -1, secondCount = 0;
      for (let k = 0; k < counts.length; k++) {
        if (counts[k] > topCount) { secondCount = topCount; topCount = counts[k]; topIdx = k; }
        else if (counts[k] > secondCount) { secondCount = counts[k]; }
      }
      if (topIdx >= 0 && topCount > 0) {
        plane = planes[candidates[topIdx]];
        assignmentMode = "border_set";
        if (secondCount > 0 && (topCount - secondCount) / topCount < TIE_RATIO) {
          const c = ringCentroid(ring);
          let best = candidates[0], bd = Infinity;
          for (const k of candidates) {
            const cd = (planes[k].centroid[0] - c[0]) ** 2 + (planes[k].centroid[1] - c[1]) ** 2;
            if (cd < bd) { bd = cd; best = k; }
          }
          plane = planes[best];
          tiebreak = true;
        }
      }
    }

    // Fallback: S1 global inlier-vote across all planes.
    if (!plane) {
      const counts = new Array(planes.length).fill(0);
      for (const p of planes) {
        for (const ip of p.inliers) {
          if (pointInRing([ip[0], ip[1]], ring)) counts[p.idx]++;
        }
      }
      let topIdx = -1, secondCount = 0;
      topCount = 0;
      for (let k = 0; k < counts.length; k++) {
        if (counts[k] > topCount) { secondCount = topCount; topCount = counts[k]; topIdx = k; }
        else if (counts[k] > secondCount) { secondCount = counts[k]; }
      }
      if (topIdx >= 0 && topCount > 0) {
        plane = planes[topIdx];
        assignmentMode = "global_fallback";
        if (secondCount > 0 && (topCount - secondCount) / topCount < TIE_RATIO) {
          const c = ringCentroid(ring);
          let best = -1, bd = Infinity;
          for (let k = 0; k < planes.length; k++) {
            const cd = (planes[k].centroid[0] - c[0]) ** 2 + (planes[k].centroid[1] - c[1]) ** 2;
            if (cd < bd) { bd = cd; best = k; }
          }
          plane = planes[best];
          tiebreak = true;
        }
      }
    }

    if (!plane) {
      unassignedCount++;
      assigned.push({ ring, plane: null, area: ringArea(ring), pieceIdx: pi, assignmentMode: null });
      continue;
    }
    if (assignmentMode === "border_set") assignedViaBorderSet++;
    else if (assignmentMode === "global_fallback") assignedViaGlobalFallback++;
    assigned.push({ ring, plane, area: ringArea(ring), pieceIdx: pi, inlierCount: topCount, tiebreak, assignmentMode });
  }
  log(`[partition] plane-assigned ${assigned.length - unassignedCount}/${assigned.length} (border_set=${assignedViaBorderSet} global_fallback=${assignedViaGlobalFallback} unassigned=${unassignedCount})`);

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

  // RR.3 §3.3 — sanity reference field swapped to structure_footprint_sqft (stable Pipeline A field).
  // Audit emits regardless — fixes RR.1 deferred item 9.
  const audit = meshAudit(liftedPieces, ridges2D);
  audit.pieces_assigned_via_border_set = assignedViaBorderSet;
  audit.pieces_assigned_via_global_fallback = assignedViaGlobalFallback;
  audit.pieces_unassigned = unassignedCount;
  const totalArea = liftedPieces.reduce((acc, p) => acc + p.sqft, 0);
  const refField = "structure_footprint_sqft";
  const refArea = tier3.structure_footprint_sqft || 0;
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
    adjacency: {
      pairs_total: pairsTotal,
      pairs_adjacent: pairsAdjacent,
      pairs_dropped_non_adjacent: pairsDropped,
      method: "hull",
    },
    sanity: {
      reference_field: refField,
      reference_value: refArea || null,
      mesh_area_sqft: totalArea,
      drift_pct: drift != null ? +(drift * 100).toFixed(2) : null,
    },
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
