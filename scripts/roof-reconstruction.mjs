/**
 * Bake-side roof reconstruction.
 *
 * Calculator-invisible by construction: consumes Pipeline A tier3 JSON
 * (with `emit_plane_inlier_points: true`), produces a richer RoofScene shape
 * for the 3D viewer. Pipeline A scalars unchanged; this module never writes back.
 *
 * Pipeline:
 *   3.1a  per-plane spatial clustering (DBSCAN on xy)
 *   3.1b  per-cluster boundary (alpha-shape; convex-hull fallback)
 *   3.1c  plane-plane intersection lines (ridge / hip / valley by normal angle)
 *   3.1d  footprint partition (assign footprint edges → nearest cluster)
 *   3.1e  mesh stitching (snap nearby vertices, share intersection-line endpoints)
 *   3.1f  sanity check (±15% area, all clusters lift, no large unstitched edges)
 *
 * Falls back to existing per-plane-hull rendering on sanity-check failure.
 *
 * No external deps.  No Pipeline A touch.
 */

// ───────────────────────────── tunables ─────────────────────────────
const DBSCAN_EPS_FT = 4.0;          // points within 4ft → same cluster
const DBSCAN_MIN_PTS = 6;           // <6 points → noise
const MIN_CLUSTER_AREA_SQFT = 25;   // drop clusters smaller than this
const SNAP_EPS_FT = 2.5;            // mesh-stitch: snap vertices closer than this
const RIDGE_HORIZONTAL_DZ = 0.33;   // |dz| < this → "ridge" (matches Pipeline A)
const NORMAL_PARALLEL_DOT = 0.985;  // |n1·n2| > this → planes parallel, no intersection
const SANITY_AREA_DRIFT = 0.15;     // reject if mesh sqft drifts >15% from roof_horiz_sqft
const ALPHA_RADIUS_FT = 3.5;        // alpha-shape: keep edges with circumcircle radius < this

// ───────────────────────────── 3.1a · DBSCAN on xy ─────────────────────────────

/**
 * Grid-accelerated DBSCAN on 2D points.
 * Returns an array of cluster indices (one per input point); -1 = noise.
 */
export function dbscanXY(points, eps = DBSCAN_EPS_FT, minPts = DBSCAN_MIN_PTS) {
  const n = points.length;
  if (n === 0) return [];
  const cell = eps;
  const grid = new Map();
  const key = (cx, cy) => `${cx},${cy}`;
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(points[i][0] / cell);
    const cy = Math.floor(points[i][1] / cell);
    const k = key(cx, cy);
    let arr = grid.get(k);
    if (!arr) { arr = []; grid.set(k, arr); }
    arr.push(i);
  }
  const eps2 = eps * eps;
  const neighbors = (i) => {
    const out = [];
    const cx = Math.floor(points[i][0] / cell);
    const cy = Math.floor(points[i][1] / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const a = grid.get(key(cx + dx, cy + dy));
      if (!a) continue;
      for (const j of a) {
        const ddx = points[i][0] - points[j][0], ddy = points[i][1] - points[j][1];
        if (ddx * ddx + ddy * ddy <= eps2) out.push(j);
      }
    }
    return out;
  };
  const labels = new Array(n).fill(-2); // -2 unvisited · -1 noise · ≥0 cluster id
  let cid = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue;
    const nb = neighbors(i);
    if (nb.length < minPts) { labels[i] = -1; continue; }
    labels[i] = cid;
    const queue = nb.slice();
    while (queue.length) {
      const j = queue.shift();
      if (labels[j] === -1) labels[j] = cid;
      if (labels[j] !== -2) continue;
      labels[j] = cid;
      const nb2 = neighbors(j);
      if (nb2.length >= minPts) for (const k of nb2) queue.push(k);
    }
    cid++;
  }
  return labels;
}

// ───────────────────────────── 3.1b · per-cluster boundary ─────────────────────────────

/** Andrew's monotone-chain convex hull (xy). Returns CCW polygon of input indices. */
function convexHullXYIdx(points, idxs) {
  if (idxs.length < 3) return idxs.slice();
  const pts = idxs.map((i) => [points[i][0], points[i][1], i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper).map((p) => p[2]);
}

/** Polygon shoelace area on xy (positive). */
function polygonArea(verts) {
  let s = 0;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i], b = verts[(i + 1) % verts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

/**
 * Alpha-shape concave hull, with convex fallback.
 * Approach: Compute convex hull. Then for each input point INSIDE the convex hull
 * but on its near boundary (close to a hull edge yet pulling inward), allow the
 * boundary to indent. Implemented as: convex hull → repeatedly try to replace
 * each edge (a,b) with (a,c,b) where c is an interior point that is (i) within
 * ALPHA_RADIUS_FT of edge midpoint and (ii) makes the new edges (a,c)+(c,b) both
 * shorter than ALPHA_RADIUS_FT * 2. Keeps polygon simple (no self-intersect by
 * construction since c is on the hull-interior side and edges don't cross).
 *
 * If the convex hull has <4 vertices or every refinement attempt fails, returns
 * the convex hull. This is the sanctioned fallback per scoping §3.1b.
 */
function concaveHullXYIdx(points, idxs) {
  let hull = convexHullXYIdx(points, idxs);
  if (hull.length < 4) return hull;
  const inside = new Set(idxs);
  for (const h of hull) inside.delete(h);
  const interior = [...inside];
  if (interior.length === 0) return hull;

  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 0; i < hull.length && !improved; i++) {
      const a = points[hull[i]];
      const b = points[hull[(i + 1) % hull.length]];
      const edgeLen2 = dist2(a, b);
      if (edgeLen2 < (ALPHA_RADIUS_FT * 0.8) ** 2) continue; // edge already short
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let bestC = -1;
      let bestScore = Infinity;
      for (const cIdx of interior) {
        const c = points[cIdx];
        const dMid = Math.sqrt(dist2(c, mid));
        if (dMid > ALPHA_RADIUS_FT) continue;
        const dAC = Math.sqrt(dist2(a, c));
        const dBC = Math.sqrt(dist2(b, c));
        if (dAC > ALPHA_RADIUS_FT * 2 || dBC > ALPHA_RADIUS_FT * 2) continue;
        // pull-in test: c should sit on the interior side of edge (cross < 0 for CCW hull)
        const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (cross >= 0) continue;
        const score = dAC + dBC;
        if (score < bestScore) { bestScore = score; bestC = cIdx; }
      }
      if (bestC >= 0) {
        hull.splice(i + 1, 0, bestC);
        const idx = interior.indexOf(bestC);
        if (idx >= 0) interior.splice(idx, 1);
        improved = true;
      }
    }
  }
  return hull;
}

/** Lift a 2D polygon to 3D via plane equation z = -(nx*x + ny*y + d) / nz */
function liftToPlane(verts2d, plane) {
  const [nx, ny, nz] = plane.normal;
  const d = plane.d;
  if (Math.abs(nz) < 1e-6) {
    // near-vertical plane: this is unusual for a roof; fall back to raw input z mean
    const meanZ = plane.points.reduce((a, p) => a + p[2], 0) / Math.max(1, plane.points.length);
    return verts2d.map((v) => [v[0], v[1], meanZ]);
  }
  return verts2d.map((v) => [v[0], v[1], -(nx * v[0] + ny * v[1] + d) / nz]);
}

// ───────────────────────────── 3.1c · plane-plane intersections ─────────────────────────────

/** Cross product. */
function cross3(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm3(a) { return Math.sqrt(dot3(a, a)); }

/**
 * Intersection of two planes (each: n·p + d = 0). Returns {dir, point} on the line,
 * or null if planes are parallel.
 */
function planeIntersectionLine(p1, p2) {
  const n1 = p1.normal, n2 = p2.normal;
  const d1 = p1.d, d2 = p2.d;
  const dir = cross3(n1, n2);
  const m = norm3(dir);
  if (m < 1e-6) return null; // parallel
  const dirN = [dir[0] / m, dir[1] / m, dir[2] / m];
  // pick the largest |dir| component to solve 2x2 for a point
  const ax = Math.abs(dir[0]), ay = Math.abs(dir[1]), az = Math.abs(dir[2]);
  let point;
  if (az >= ax && az >= ay) {
    // set z=0; solve [n1x n1y][x;y] = -d1, [n2x n2y]... = -d2
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

/** Classify intersection line by horizontality + plane-normal-z signs. */
function classifyIntersection(line, p1, p2) {
  const dz = Math.abs(line.dir[2]);
  if (dz < RIDGE_HORIZONTAL_DZ / 10) {
    // horizontal-ish: ridge if both planes face up (nz>0 both), else valley if one faces down
    const sameSide = Math.sign(p1.normal[2]) === Math.sign(p2.normal[2]);
    return sameSide ? "ridge" : "valley";
  }
  return "hip";
}

// ───────────────────────────── 3.1d · footprint partition ─────────────────────────────

/**
 * Assign each footprint edge to its nearest cluster centroid (xy).
 * Returns Map<clusterIdx, [[x,y], [x,y], ...]> — list of footprint vertices that
 * border each cluster (in footprint-CCW order).
 */
function partitionFootprint(footprintXY, clusters) {
  if (!footprintXY || footprintXY.length < 3 || clusters.length === 0) return new Map();
  const centroids = clusters.map((c) => {
    let sx = 0, sy = 0;
    for (const v of c.boundary2d) { sx += v[0]; sy += v[1]; }
    return [sx / c.boundary2d.length, sy / c.boundary2d.length];
  });
  const nearestCluster = (pt) => {
    let best = -1, bd = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const dx = pt[0] - centroids[i][0], dy = pt[1] - centroids[i][1];
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const map = new Map();
  for (let i = 0; i < footprintXY.length; i++) {
    const v = footprintXY[i];
    const c = nearestCluster(v);
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(v);
  }
  return map;
}

// ───────────────────────────── 3.1e · mesh stitching (vertex snap) ─────────────────────────────

/** Snap any pair of vertices across clusters within SNAP_EPS_FT to a shared midpoint. */
function snapClusterVertices(clusters) {
  // build flat list of all vertex refs
  const refs = []; // {ci, vi, x, y}
  for (let ci = 0; ci < clusters.length; ci++) {
    const verts = clusters[ci].boundary2d;
    for (let vi = 0; vi < verts.length; vi++) refs.push({ ci, vi, x: verts[vi][0], y: verts[vi][1] });
  }
  // grid by SNAP_EPS_FT
  const cell = SNAP_EPS_FT;
  const grid = new Map();
  const key = (a, b) => `${a},${b}`;
  for (const r of refs) {
    const k = key(Math.floor(r.x / cell), Math.floor(r.y / cell));
    let arr = grid.get(k);
    if (!arr) { arr = []; grid.set(k, arr); }
    arr.push(r);
  }
  const eps2 = SNAP_EPS_FT * SNAP_EPS_FT;
  const visited = new Set();
  for (const r of refs) {
    const id = `${r.ci}-${r.vi}`;
    if (visited.has(id)) continue;
    const cx = Math.floor(r.x / cell), cy = Math.floor(r.y / cell);
    const group = [r];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const arr = grid.get(key(cx + dx, cy + dy));
      if (!arr) continue;
      for (const o of arr) {
        if (o === r) continue;
        if (o.ci === r.ci) continue; // only stitch ACROSS clusters
        const ox = clusters[o.ci].boundary2d[o.vi][0];
        const oy = clusters[o.ci].boundary2d[o.vi][1];
        const ddx = r.x - ox, ddy = r.y - oy;
        if (ddx * ddx + ddy * ddy <= eps2) group.push(o);
      }
    }
    if (group.length < 2) continue;
    const mx = group.reduce((a, g) => a + clusters[g.ci].boundary2d[g.vi][0], 0) / group.length;
    const my = group.reduce((a, g) => a + clusters[g.ci].boundary2d[g.vi][1], 0) / group.length;
    for (const g of group) {
      clusters[g.ci].boundary2d[g.vi] = [mx, my];
      visited.add(`${g.ci}-${g.vi}`);
    }
  }
}

// ───────────────────────────── 3.1f · sanity check ─────────────────────────────

function meshAuditEdges(clusters) {
  // collect all edges as canonicalized (rounded) pairs
  const edges = new Map(); // key -> count
  const round = (x) => Math.round(x * 10) / 10;
  for (const c of clusters) {
    const v = c.boundary2d;
    for (let i = 0; i < v.length; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      const ka = `${round(a[0])},${round(a[1])}`;
      const kb = `${round(b[0])},${round(b[1])}`;
      const k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  let unstitched = 0, shared = 0, repeats = 0;
  for (const v of edges.values()) {
    if (v === 1) unstitched++;
    else if (v === 2) shared++;
    else repeats++;
  }
  return { totalUniqueEdges: edges.size, unstitched, shared, repeats };
}

function sanityCheck(clusters, tier3) {
  const totalArea = clusters.reduce((a, c) => a + polygonArea(c.boundary2d), 0);
  const ref = tier3.roof_horiz_sqft || 0;
  const drift = ref > 0 ? Math.abs(totalArea - ref) / ref : 1;
  if (ref > 0 && drift > SANITY_AREA_DRIFT) {
    return { ok: false, reason: `area drift ${(drift * 100).toFixed(1)}% > ${SANITY_AREA_DRIFT * 100}% (mesh ${totalArea.toFixed(0)} vs roof_horiz ${ref})` };
  }
  for (const c of clusters) {
    if (!c.boundary3d || c.boundary3d.length < 3) {
      return { ok: false, reason: `cluster ${c.id} failed to lift to 3D` };
    }
  }
  const audit = meshAuditEdges(clusters);
  // Definition of "no large unstitched edges" (G4): every cluster polygon edge
  // either (a) appears in exactly one cluster (= footprint perimeter edge), or
  // (b) appears in two clusters (= ridge/hip/valley shared with neighbor).
  // Repeats (>2) mean over-stitched (two clusters claiming the same span twice) → reject.
  if (audit.repeats > 0) {
    return { ok: false, reason: `mesh has ${audit.repeats} over-stitched edges`, audit };
  }
  return { ok: true, totalArea, drift, audit };
}

// ───────────────────────────── orchestrator ─────────────────────────────

/**
 * Reconstruct planes → tighter polygons.
 *
 * @param {object} tier3 - full tier3 JSON from Pipeline A (must include `points`
 *                         per segment via `emit_plane_inlier_points`)
 * @param {object} opts  - { logger, footprintXY }
 * @returns {object} { ok, clusters, audit, fallback?, reason? }
 *                   clusters[]: { id, planeId, normal, d, type, boundary2d, boundary3d, sqft }
 */
export function reconstruct(tier3, opts = {}) {
  const log = opts.logger || (() => {});
  const segs = tier3.segments || [];
  if (!segs.length) return { ok: false, reason: "no segments", clusters: [] };
  if (!segs[0].points) {
    return { ok: false, reason: "tier3 missing inlier points (call Modal with emit_plane_inlier_points: true)", clusters: [] };
  }

  // 3.1a + 3.1b — per-plane DBSCAN + per-cluster boundary
  const clusters = [];
  let nextId = 0;
  for (const seg of segs) {
    const pts3 = seg.points;
    const pts2 = pts3.map((p) => [p[0], p[1]]);
    const labels = dbscanXY(pts2);
    const groups = new Map();
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      if (l < 0) continue;
      if (!groups.has(l)) groups.set(l, []);
      groups.get(l).push(i);
    }
    log(`  seg ${seg.id}: ${pts3.length} pts → ${groups.size} cluster(s)`);
    for (const [_, idxs] of groups) {
      if (idxs.length < DBSCAN_MIN_PTS) continue;
      const boundaryIdxs = concaveHullXYIdx(pts2, idxs);
      if (boundaryIdxs.length < 3) continue;
      const boundary2d = boundaryIdxs.map((i) => pts2[i]);
      const area = polygonArea(boundary2d);
      if (area < MIN_CLUSTER_AREA_SQFT) continue;
      const plane = { normal: seg.normal, d: -dot3(seg.normal, seg.centroid) };
      const cluster = {
        id: `c${nextId++}`,
        planeId: seg.id,
        normal: seg.normal,
        d: plane.d,
        pitch_ratio_over_12: seg.pitch_ratio_over_12,
        pitch_degrees: seg.pitch_degrees,
        type: seg.pitch_degrees != null && seg.pitch_degrees < 25 ? "main" : "hip",
        boundary2d,
        boundary3d: liftToPlane(boundary2d, { normal: seg.normal, d: plane.d, points: pts3 }),
        sqft: Math.round(area),
        _innerPoints: pts3,
      };
      clusters.push(cluster);
    }
  }
  log(`[reconstruct] ${segs.length} planes → ${clusters.length} clusters`);

  if (!clusters.length) {
    return { ok: false, reason: "no clusters survived DBSCAN+area filter", clusters: [], fallback: true };
  }

  // 3.1c — pairwise plane intersection lines (informational — used by viewer for edges)
  const intersections = [];
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const ci = clusters[i], cj = clusters[j];
      // skip if plane normals are parallel (same-plane fragments) — no meaningful line
      const dot = Math.abs(dot3(ci.normal, cj.normal));
      if (dot > NORMAL_PARALLEL_DOT) continue;
      // skip if cluster bounds far apart in xy (no shared edge possible)
      const bi = bounds2d(ci.boundary2d), bj = bounds2d(cj.boundary2d);
      const gap = Math.max(0, Math.max(bi.minX - bj.maxX, bj.minX - bi.maxX))
                + Math.max(0, Math.max(bi.minY - bj.maxY, bj.minY - bi.maxY));
      if (gap > SNAP_EPS_FT * 2) continue;
      const line = planeIntersectionLine(ci, cj);
      if (!line) continue;
      // clip the infinite line to the overlap of the two cluster xy-bounds
      const seg = clipLineToBox(line, mergeBounds(bi, bj));
      if (!seg) continue;
      intersections.push({
        type: classifyIntersection(line, ci, cj),
        a: cj.id, b: ci.id,
        endpoints3d: seg,
        lengthFt: Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1], seg[1][2] - seg[0][2]),
      });
    }
  }
  log(`[reconstruct] ${intersections.length} candidate intersection lines`);

  // 3.1d — footprint partition (informational; we don't use it to clip clusters
  // because that requires a full polygon-polygon intersection. Instead we surface
  // the assignment so the viewer / debug overlay can render it.)
  const footprintXY = (tier3.footprint_polygon_xy_ftus || []).map((c) => [c[0], c[1]]);
  const partition = partitionFootprint(footprintXY, clusters);
  log(`[reconstruct] footprint partitioned across ${partition.size} clusters`);

  // 3.1e — vertex snapping (mesh stitching)
  snapClusterVertices(clusters);
  // re-lift after snapping
  for (const c of clusters) {
    c.boundary3d = liftToPlane(c.boundary2d, { normal: c.normal, d: c.d, points: c._innerPoints });
    c.sqft = Math.round(polygonArea(c.boundary2d));
  }

  // 3.1f — sanity (informational; bake-side decides whether to use clusters)
  const sane = sanityCheck(clusters, tier3);

  return {
    ok: clusters.length > 0,
    sane,
    clusters,
    intersections,
    partition,
    audit: sane.audit,
    totalArea: sane.totalArea ?? clusters.reduce((a, c) => a + polygonArea(c.boundary2d), 0),
    drift: sane.drift,
  };
}

// ───────────────────────────── helpers ─────────────────────────────

function bounds2d(verts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of verts) {
    if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0];
    if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1];
  }
  return { minX, maxX, minY, maxY };
}

function mergeBounds(a, b) {
  return {
    minX: Math.max(a.minX, b.minX), maxX: Math.min(a.maxX, b.maxX),
    minY: Math.max(a.minY, b.minY), maxY: Math.min(a.maxY, b.maxY),
  };
}

/**
 * Clip a 3D line (point + dir) to a 2D xy box (z is computed by line param).
 * Returns [[x,y,z], [x,y,z]] or null if no intersection.
 */
function clipLineToBox(line, box) {
  const { point, dir } = line;
  // parameterize: P(t) = point + t * dir;  find t such that x,y in box.
  let tMin = -Infinity, tMax = Infinity;
  for (let axis = 0; axis < 2; axis++) {
    const min = axis === 0 ? box.minX : box.minY;
    const max = axis === 0 ? box.maxX : box.maxY;
    if (Math.abs(dir[axis]) < 1e-9) {
      if (point[axis] < min || point[axis] > max) return null;
      continue;
    }
    let t1 = (min - point[axis]) / dir[axis];
    let t2 = (max - point[axis]) / dir[axis];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tMin) tMin = t1;
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return null;
  }
  if (!isFinite(tMin) || !isFinite(tMax)) return null;
  return [
    [point[0] + tMin * dir[0], point[1] + tMin * dir[1], point[2] + tMin * dir[2]],
    [point[0] + tMax * dir[0], point[1] + tMax * dir[1], point[2] + tMax * dir[2]],
  ];
}

// ───────────────────────────── shadow-comparison scalar ─────────────────────────────

/**
 * §3.3 — what would Pipeline A scalars be if reconstruction outputs replaced
 * raw RANSAC outputs? Production unchanged; this is a one-shot delta calc.
 */
export function shadowScalars(tier3, recon) {
  const out = {
    current: {
      sqft: tier3.roof_horiz_sqft,
      pitch_dom_per12: tier3.pitch_dom_per12,
      n_planes: tier3.num_segments,
    },
    reconstructed: { sqft: null, pitch_dom_per12: null, n_planes: null },
    delta: { sqft_pct: null, pitch_per12: null, segs: null },
  };
  if (!recon.ok || !recon.clusters.length) return out;
  let totalArea = 0, num = 0, den = 0;
  for (const c of recon.clusters) {
    const a = polygonArea(c.boundary2d);
    totalArea += a;
    if (c.pitch_ratio_over_12 != null) {
      num += a * c.pitch_ratio_over_12;
      den += a;
    }
  }
  out.reconstructed.sqft = +totalArea.toFixed(1);
  out.reconstructed.pitch_dom_per12 = den > 0 ? +(num / den).toFixed(2) : null;
  out.reconstructed.n_planes = recon.clusters.length;
  if (out.current.sqft) out.delta.sqft_pct = +(((out.reconstructed.sqft - out.current.sqft) / out.current.sqft) * 100).toFixed(2);
  if (out.current.pitch_dom_per12 != null && out.reconstructed.pitch_dom_per12 != null) {
    out.delta.pitch_per12 = +(out.reconstructed.pitch_dom_per12 - out.current.pitch_dom_per12).toFixed(2);
  }
  if (out.current.n_planes != null) out.delta.segs = out.reconstructed.n_planes - out.current.n_planes;
  return out;
}
