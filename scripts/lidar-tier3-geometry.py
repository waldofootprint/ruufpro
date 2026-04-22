#!/usr/bin/env python3
"""
LiDAR Tier 3 — Full roof geometry from LAZ point cloud.

Extends Tier 2 (sqft-only) with:
  - Segment detection (iterative RANSAC + plane merge + min-area filter)
  - Pitch per segment
  - Ridge / hip / valley classification + length
  - Perimeter (alpha-shape auto-alpha)

Design: .tmp/calculator-bench/tier3-design.md

Usage:
  python3 scripts/lidar-tier3-geometry.py <tile.laz> <lat> <lng>
      [--footprint_geojson path] [--crs_epsg N] [--address_label "..."]

Output: <same dir as tile>/../tier3-<stem>.json
"""
import argparse, json, sys, time
from pathlib import Path
import numpy as np
import laspy
from shapely.geometry import Polygon, Point, LineString, MultiPoint, shape as shp_shape
from shapely.ops import unary_union
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
_spec = importlib.util.spec_from_file_location("tier2", Path(__file__).parent / "lidar-tier2-sqft.py")
tier2 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(tier2)
from lidar_geometry_utils import alpha_shape_perimeter as _shared_alpha_shape_perimeter
# Track A.9-class-1 §3.1 — route footprint fetch through the 3-tier chain
# (MS PostGIS → self-derive → Overpass with circuit breaker) instead of direct Overpass.
from phase_b import footprint_lookup as _footprint_lookup  # noqa: E402

# --- CONSTANTS (see design doc §3, §5) ---
# Env-var overrides (BL tuning harness, 2026-04-21). Defaults = Phase A frozen
# values at e95d561. When env unset, constants equal Phase A exactly.
import os as _os
RANSAC_THRESHOLD_FT = float(_os.getenv("RANSAC_THRESHOLD_FT_OVERRIDE", "0.49"))  # 0.15m — plane inlier residual
RANSAC_MIN_INLIERS = int(_os.getenv("RANSAC_MIN_INLIERS_OVERRIDE", "50"))
RANSAC_MAX_ITER = 500
MERGE_ANGLE_DEG = float(_os.getenv("MERGE_ANGLE_DEG_OVERRIDE", "5.0"))           # planes w/ normals within this angle
MERGE_OFFSET_FT = float(_os.getenv("MERGE_OFFSET_FT_OVERRIDE", "0.98"))           # AND perpendicular offset within this -> merge
MIN_PLANE_AREA_SQFT = 15.0
DENSITY_THRESHOLD_PTS_PER_M2 = 4.0
HEIGHT_ABOVE_GROUND_FT_FALLBACK = 6.5
RIDGE_HORIZONTAL_TOLERANCE_FT = 0.33  # 0.1m — line "horizontal" if |dz| < this


# --- CRS VERIFICATION (design §2, G1) ---
FL_FTUS_EPSG = {2236, 2238, 6438, 6440}

def assert_ftus_projected(laz_path, override_epsg=None):
    """Read CRS from LAZ VLR. Fail loudly if missing or not ftUS family.
    If override_epsg supplied (legacy tiles), accept it instead of header."""
    crs_str = tier2.read_tile_crs(laz_path)
    if crs_str is None:
        if override_epsg and int(override_epsg) in FL_FTUS_EPSG:
            return f"EPSG:{override_epsg}"
        raise RuntimeError(f"No CRS in LAZ header: {laz_path}; pass --crs_epsg")
    # Accept NAD83(2011) FL E/W ftUS (6438/6440), NAD83 FL E/W ftUS (2236/2238),
    # or any WKT that mentions 'US survey foot' + Florida
    s = crs_str.lower()
    ok = ("us survey foot" in s or "ftus" in s or "foot_us" in s) and "florida" in s
    if not ok:
        # Check EPSG codes explicitly
        for code in ("6438", "6440", "2236", "2238"):
            if code in crs_str:
                ok = True; break
    if not ok:
        raise RuntimeError(f"CRS not FL ftUS family: {crs_str[:120]}")
    return crs_str


# --- RANSAC PLANE FITTING (design §3.2) ---
def fit_plane_ransac(points, threshold, max_iter, rng):
    """Best-fit plane on N×3 points. Returns (normal, d, inlier_mask). Plane: n·p + d = 0."""
    n = len(points)
    if n < 3: return None, None, None
    best_inliers, best_normal, best_d = None, None, None
    for _ in range(max_iter):
        idx = rng.choice(n, size=3, replace=False)
        p1, p2, p3 = points[idx]
        v1, v2 = p2 - p1, p3 - p1
        normal = np.cross(v1, v2)
        nrm = np.linalg.norm(normal)
        if nrm < 1e-9: continue
        normal = normal / nrm
        d = -np.dot(normal, p1)
        residuals = np.abs(points @ normal + d)
        inliers = residuals < threshold
        count = int(inliers.sum())
        if best_inliers is None or count > int(best_inliers.sum()):
            best_inliers, best_normal, best_d = inliers, normal, d
    return best_normal, best_d, best_inliers


def refit_plane_lsq(points):
    """Least-squares plane through a cloud. Returns (normal, d). More accurate than RANSAC seed."""
    centroid = points.mean(axis=0)
    centered = points - centroid
    # SVD -> smallest singular vector is plane normal
    _, _, vh = np.linalg.svd(centered, full_matrices=False)
    normal = vh[-1]
    # Orient so nz >= 0 (roof normals point up)
    if normal[2] < 0: normal = -normal
    d = -np.dot(normal, centroid)
    return normal, d


def detect_segments(roof_points, rng_seed=42):
    """Iterative RANSAC + merge + min-area filter. Returns list of plane dicts."""
    rng = np.random.default_rng(rng_seed)
    remaining = roof_points.copy()
    remaining_idx = np.arange(len(roof_points))
    planes = []

    while len(remaining) >= RANSAC_MIN_INLIERS:
        normal, d, inliers = fit_plane_ransac(remaining, RANSAC_THRESHOLD_FT, RANSAC_MAX_ITER, rng)
        if inliers is None or int(inliers.sum()) < RANSAC_MIN_INLIERS: break
        inlier_pts = remaining[inliers]
        normal, d = refit_plane_lsq(inlier_pts)  # refit for accuracy
        planes.append({"normal": normal, "d": d, "points": inlier_pts,
                       "orig_idx": remaining_idx[inliers]})
        keep = ~inliers
        remaining = remaining[keep]
        remaining_idx = remaining_idx[keep]

    # Merge pass (§3.3)
    planes = _merge_planes(planes)

    # Min-area filter (§3.4)
    kept = []
    for p in planes:
        horiz = _horiz_area_sqft(p["points"])
        if horiz >= MIN_PLANE_AREA_SQFT:
            p["horiz_area_sqft"] = horiz
            p["sloped_area_sqft"] = horiz / max(abs(p["normal"][2]), 1e-6)
            p["pitch_degrees"] = _pitch_deg(p["normal"])
            p["pitch_ratio_over_12"] = round(12 * np.tan(np.deg2rad(p["pitch_degrees"])), 1)
            p["centroid"] = p["points"].mean(axis=0)
            kept.append(p)
    return kept


def _merge_planes(planes):
    """Iteratively merge planes within angle + offset tolerance."""
    cos_thresh = np.cos(np.deg2rad(MERGE_ANGLE_DEG))
    while True:
        merged = False
        for i in range(len(planes)):
            for j in range(i + 1, len(planes)):
                ni, nj = planes[i]["normal"], planes[j]["normal"]
                if abs(float(np.dot(ni, nj))) < cos_thresh: continue
                ci = planes[i]["points"].mean(axis=0)
                offset = abs(float(np.dot(nj, ci) + planes[j]["d"]))
                if offset > MERGE_OFFSET_FT: continue
                combined = np.vstack([planes[i]["points"], planes[j]["points"]])
                normal, d = refit_plane_lsq(combined)
                planes[i] = {"normal": normal, "d": d, "points": combined,
                             "orig_idx": np.concatenate([planes[i]["orig_idx"], planes[j]["orig_idx"]])}
                planes.pop(j)
                merged = True; break
            if merged: break
        if not merged: break
    return planes


def _pitch_deg(normal):
    """Angle between plane normal and vertical axis."""
    up = np.array([0.0, 0.0, 1.0])
    cos_t = min(1.0, abs(float(np.dot(normal, up))))
    return float(np.rad2deg(np.arccos(cos_t)))


def _horiz_area_sqft(points):
    """2D convex-hull area in horizontal projection."""
    if len(points) < 3: return 0.0
    try:
        hull = ConvexHull(points[:, :2])
        return float(hull.volume)  # 2D volume == area
    except Exception:
        return 0.0


# --- RIDGE / HIP / VALLEY (design §4) ---
def classify_intersections(planes):
    """For each pair of adjacent planes, compute intersection line and classify."""
    results = {"ridge": [], "hip": [], "valley": [], "other": []}
    for i in range(len(planes)):
        for j in range(i + 1, len(planes)):
            line = _plane_plane_intersection(planes[i], planes[j])
            if line is None: continue
            classification, length = _classify_line(line, planes[i], planes[j])
            entry = {"planes": (i, j), "length_ft": length,
                     "line_endpoints": [list(line[0]), list(line[1])]}
            results[classification].append(entry)
    return results


def _plane_plane_intersection(pA, pB):
    """Find line A∩B, clipped to the region where both planes' points overlap horizontally."""
    nA, dA = pA["normal"], pA["d"]
    nB, dB = pB["normal"], pB["d"]
    direction = np.cross(nA, nB)
    dir_norm = np.linalg.norm(direction)
    if dir_norm < 1e-6: return None  # parallel
    direction = direction / dir_norm
    # Solve for a point on the line: pick axis with largest |direction| to drop
    drop = int(np.argmax(np.abs(direction)))
    M = np.array([[nA[(drop+1)%3], nA[(drop+2)%3]],
                  [nB[(drop+1)%3], nB[(drop+2)%3]]])
    try:
        sol = np.linalg.solve(M, [-dA, -dB])
    except np.linalg.LinAlgError:
        return None
    point = np.zeros(3)
    point[(drop+1)%3] = sol[0]
    point[(drop+2)%3] = sol[1]

    # Clip to horizontal overlap of the two planes' point-cloud footprints
    pts_A_xy = pA["points"][:, :2]; pts_B_xy = pB["points"][:, :2]
    try:
        poly_A = Polygon(pts_A_xy[ConvexHull(pts_A_xy).vertices])
        poly_B = Polygon(pts_B_xy[ConvexHull(pts_B_xy).vertices])
    except Exception:
        return None
    overlap = poly_A.buffer(1.0).intersection(poly_B.buffer(1.0))
    if overlap.is_empty: return None

    # Parameterize line: P(t) = point + t*direction. Find t where line enters/exits overlap bounds.
    minx, miny, maxx, maxy = overlap.bounds
    ts = []
    dxy = direction[:2]
    if abs(dxy[0]) > 1e-6:
        ts += [(minx - point[0]) / dxy[0], (maxx - point[0]) / dxy[0]]
    if abs(dxy[1]) > 1e-6:
        ts += [(miny - point[1]) / dxy[1], (maxy - point[1]) / dxy[1]]
    if not ts: return None
    t_min, t_max = min(ts), max(ts)
    # Trim to line segments actually inside the overlap polygon
    p1 = point + t_min * direction
    p2 = point + t_max * direction
    ls = LineString([p1[:2], p2[:2]]).intersection(overlap)
    if ls.is_empty or not hasattr(ls, "coords") or len(list(ls.coords)) < 2:
        return None
    coords = list(ls.coords)
    # Interpolate z on plane A at endpoints (either plane would work)
    def z_on(xy, plane):
        n = plane["normal"]
        if abs(n[2]) < 1e-6: return 0.0
        return (-plane["d"] - n[0]*xy[0] - n[1]*xy[1]) / n[2]
    start = np.array([coords[0][0], coords[0][1], z_on(coords[0], pA)])
    end = np.array([coords[-1][0], coords[-1][1], z_on(coords[-1], pA)])
    return (start, end)


def _classify_line(line, pA, pB):
    """Classify intersection line as ridge / hip / valley / other."""
    start, end = line
    length = float(np.linalg.norm(end - start))
    if length < 1.0: return "other", length
    dz = abs(end[2] - start[2])
    horizontal = dz < RIDGE_HORIZONTAL_TOLERANCE_FT
    # Outward-tangent test: does each plane slope *away from* the line or *toward* it?
    line_dir = (end - start) / length
    midpoint = (start + end) / 2
    # Point on plane A, offset perpendicular to line in A's plane, small distance
    # Tangent in plane A perpendicular to line_dir:
    tA = _in_plane_perpendicular(pA["normal"], line_dir)
    tB = _in_plane_perpendicular(pB["normal"], line_dir)
    # A convex intersection (ridge/hip) has tA and tB pointing away from each other
    # A concave intersection (valley) has them pointing toward each other
    # Test: do their *horizontal* components go in opposite directions from midpoint?
    # Project both tangents onto horizontal, check dot product sign
    tA_h = tA.copy(); tA_h[2] = 0
    tB_h = tB.copy(); tB_h[2] = 0
    if np.linalg.norm(tA_h) < 1e-6 or np.linalg.norm(tB_h) < 1e-6:
        return "other", length
    tA_h /= np.linalg.norm(tA_h); tB_h /= np.linalg.norm(tB_h)
    # Orient each tangent to point away from the line (downslope direction)
    if tA[2] > 0: tA_h = -tA_h
    if tB[2] > 0: tB_h = -tB_h
    dot = float(np.dot(tA_h, tB_h))
    convex = dot < -0.2    # tangents point apart -> convex (ridge/hip)
    concave = dot > 0.2    # tangents point together -> valley

    if horizontal and convex: return "ridge", length
    if not horizontal and convex: return "hip", length
    if concave: return "valley", length
    return "other", length


def _in_plane_perpendicular(normal, line_dir):
    """Return a unit vector in the plane (perp to normal) and perp to line_dir."""
    v = np.cross(normal, line_dir)
    norm = np.linalg.norm(v)
    if norm < 1e-6: return np.array([0.0, 0.0, 0.0])
    return v / norm


# --- PERIMETER via alpha-shape (design §5) — moved to lidar_geometry_utils ---
alpha_shape_perimeter = _shared_alpha_shape_perimeter


# --- MAIN ---
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("laz")
    ap.add_argument("lat", type=float, nargs="?", default=None)
    ap.add_argument("lng", type=float, nargs="?", default=None)
    ap.add_argument("--footprint_geojson", default=None,
                    help="Use footprint from geojson instead of OSM Overpass")
    ap.add_argument("--footprint_xy_json", default=None,
                    help="Bench mode: pre-projected polygon XY in tile CRS. "
                         "Skips Overpass + lat/lng reprojection. Format: "
                         "{'polygon_xy_ftus': [[x,y], ...]}")
    ap.add_argument("--radius_m", type=float, default=40)
    ap.add_argument("--crs_epsg", type=int, default=0)
    ap.add_argument("--height_above_ground_ft", type=float, default=HEIGHT_ABOVE_GROUND_FT_FALLBACK)
    ap.add_argument("--address_label", default=None)
    args = ap.parse_args()

    t0 = time.time()
    laz_path = args.laz
    print(f"[0/7] CRS verification")
    crs_str = assert_ftus_projected(laz_path, override_epsg=args.crs_epsg or None)
    print(f"  CRS ok: {crs_str[:80]}")

    # --- Footprint ---
    print(f"[1/7] Footprint")
    footprint_source = None
    footprint_latency_ms = None
    if args.footprint_xy_json:
        # Bench mode: polygon already in tile CRS (e.g. RoofN3D faux-ftUS).
        j = json.loads(Path(args.footprint_xy_json).read_text())
        poly_ft = Polygon(j["polygon_xy_ftus"])
        n_found = 1
        print(f"  loaded pre-projected XY footprint from {args.footprint_xy_json}")
    elif args.footprint_geojson:
        gj = json.loads(Path(args.footprint_geojson).read_text())
        feat = gj["features"][0] if gj.get("type") == "FeatureCollection" else gj
        poly_ll = shp_shape(feat["geometry"])
        n_found = 1
        print(f"  loaded from {args.footprint_geojson}")
    else:
        if args.lat is None or args.lng is None:
            raise SystemExit("lat/lng required unless --footprint_geojson is provided")
        # A.9-class-1: resolve() covers MS PostGIS → LiDAR self-derive → Overpass-with-breaker.
        # The old wide-radius retry was Overpass-only; MS/self-derive don't accept a radius
        # widening, and Overpass inside resolve() uses its own fixed 25m radius + breaker.
        fp_result = _footprint_lookup.resolve(args.lat, args.lng, laz_path=str(laz_path))
        footprint_source = fp_result.source.value
        footprint_latency_ms = round(fp_result.latency_ms, 1)
        if fp_result.geom_geojson is not None:
            poly_ll = shp_shape(fp_result.geom_geojson)
            n_found = 1
        else:
            poly_ll = None
            n_found = 0
        if poly_ll is None:
            raise SystemExit("no footprint")
    if not args.footprint_xy_json:
        poly_ft = tier2.reproject_polygon(poly_ll, crs_str)
    structure_footprint_sqft = float(poly_ft.area)
    # Perimeter of the footprint polygon (for G7 reference)
    fp_perim_ft = float(Polygon(poly_ft.exterior.coords).length)
    print(f"  structure footprint: {structure_footprint_sqft:.0f} sqft, perim {fp_perim_ft:.0f} ft")

    # --- Points + class filter (§3.1, G2, G4) ---
    print(f"[2/7] Load LAZ + clip")
    laz = laspy.read(laz_path)
    xs, ys, zs = np.asarray(laz.x), np.asarray(laz.y), np.asarray(laz.z)
    cls = np.asarray(laz.classification)
    mask = tier2.points_in_polygon_mask(xs, ys, poly_ft)
    print(f"  inside footprint: {mask.sum():,} of {len(xs):,}")
    if mask.sum() < 100:
        raise SystemExit("too few points inside footprint")
    px, py, pz, pc = xs[mask], ys[mask], zs[mask], cls[mask]

    # Density check (G3)
    footprint_sqm = structure_footprint_sqft * 0.092903
    density_pts_per_m2 = int(mask.sum()) / footprint_sqm
    low_confidence = density_pts_per_m2 < DENSITY_THRESHOLD_PTS_PER_M2
    print(f"  density: {density_pts_per_m2:.2f} pts/m² ({'LOW' if low_confidence else 'ok'})")

    # Ground z
    ground_mask_local = (pc == 2)
    if ground_mask_local.sum() < 10:
        b = poly_ft.bounds; pad = 20
        wide = ((xs >= b[0]-pad) & (xs <= b[2]+pad) & (ys >= b[1]-pad) & (ys <= b[3]+pad) & (cls == 2))
        ground_z = float(np.median(zs[wide])) if wide.sum() else float(np.percentile(pz, 5))
    else:
        ground_z = float(np.median(pz[ground_mask_local]))

    # Roof classification: class 6 preferred, fallback to height-above-ground
    class6_mask = (pc == 6)
    if class6_mask.sum() >= RANSAC_MIN_INLIERS:
        roof_mask = class6_mask
        class6_fallback = False
    else:
        roof_mask = (pc == 6) | (pz > ground_z + args.height_above_ground_ft)
        class6_fallback = True
    rx, ry, rz = px[roof_mask], py[roof_mask], pz[roof_mask]
    roof_points = np.column_stack([rx, ry, rz])
    print(f"  roof pts: {len(roof_points):,} (class6_fallback={class6_fallback})")
    if len(roof_points) < RANSAC_MIN_INLIERS:
        raise SystemExit("too few roof points")

    # --- Segments (§3) ---
    print(f"[3/7] Segment detection")
    planes = detect_segments(roof_points)
    # RANSAC aggregate quality — exposed for downstream gate (Track A.8-prep).
    n_roof_points_total = len(roof_points)
    total_inliers = sum(len(p["points"]) for p in planes)
    inlier_ratio = (total_inliers / n_roof_points_total) if n_roof_points_total > 0 else 0.0
    residual = (float(sum(np.abs(p["points"] @ p["normal"] + p["d"]).sum() for p in planes) / total_inliers)
                if total_inliers > 0 else None)
    print(f"  planes detected: {len(planes)}")
    for i, p in enumerate(planes):
        print(f"    seg {i}: pitch {p['pitch_degrees']:.1f}° ({p['pitch_ratio_over_12']:.1f}/12) "
              f"horiz {p['horiz_area_sqft']:.0f} sqft, {len(p['points'])} pts")
    if not planes:
        print("  WARN no_planes_detected — likely all-flat roof")

    # --- Intersections (§4) ---
    print(f"[4/7] Ridge/hip/valley classification")
    intersections = classify_intersections(planes) if len(planes) >= 2 else \
                    {"ridge": [], "hip": [], "valley": [], "other": []}
    ridge_len = sum(e["length_ft"] for e in intersections["ridge"])
    hip_len = sum(e["length_ft"] for e in intersections["hip"])
    valley_len = sum(e["length_ft"] for e in intersections["valley"])
    print(f"  ridge {ridge_len:.1f} ft | hip {hip_len:.1f} ft | valley {valley_len:.1f} ft")

    # --- Perimeter (§5) ---
    print(f"[5/7] Perimeter (alpha-shape)")
    perim_ft, alpha_area_sqft, alpha_flags = alpha_shape_perimeter(roof_points[:, :2])
    print(f"  perimeter: {perim_ft:.0f} ft | alpha-area: {alpha_area_sqft:.0f} sqft | {alpha_flags}")

    # --- Horizontal sqft via convex hull (matches Tier 2) ---
    hull = ConvexHull(roof_points[:, :2])
    roof_horiz_sqft = float(hull.volume)

    # --- Sloped sqft (Bug 2 fix): planes from iterative RANSAC overlap horizontally.
    # Naively summing per-plane sloped_area double-counts. Instead: take the true total
    # roof horizontal area (from alpha-shape if available, else convex hull), distribute
    # it across planes proportionally to each plane's detected horizontal share, then
    # divide each share by |nz| for the sloped contribution. Bounded sum.
    # Anchor to roof_horiz_sqft (convex hull), not alpha-area. Alpha-area excludes inter-finger
    # gaps in the LiDAR cloud and would bias sloped DOWN; sloped must be >= horiz by geometry.
    total_horiz_for_sloped = roof_horiz_sqft
    raw_sum_horiz = sum(p["horiz_area_sqft"] for p in planes) or 1.0
    sloped_sqft_sum = 0.0
    exclusive_horiz_per_plane = []
    for p in planes:
        weight = p["horiz_area_sqft"] / raw_sum_horiz
        exclusive_horiz = weight * total_horiz_for_sloped
        exclusive_horiz_per_plane.append(exclusive_horiz)
        sloped_sqft_sum += exclusive_horiz / max(abs(p["normal"][2]), 1e-6)
    sloped_sqft_sum = float(sloped_sqft_sum)

    # --- Vintage stamp (G5) ---
    try:
        gps_time = float(np.median(laz.gps_time)) if hasattr(laz, "gps_time") else None
    except Exception:
        gps_time = None

    # --- Compose output ---
    out = {
        "address_label": args.address_label,
        "tile_path": str(Path(laz_path).resolve()),
        "crs": crs_str[:200],
        "tile_gps_time_median": gps_time,
        "structure_footprint_sqft": round(structure_footprint_sqft, 1),
        "structure_footprint_perim_ft": round(fp_perim_ft, 1),
        "roof_horiz_sqft": round(roof_horiz_sqft, 1),
        "roof_sloped_sqft_sum": round(sloped_sqft_sum, 1),
        "roof_perimeter_ft": round(perim_ft, 1),
        "roof_alpha_area_sqft": round(alpha_area_sqft, 1),
        "alpha_flags": alpha_flags,
        "ground_z_ft": round(ground_z, 2),
        "point_density_pts_per_m2": round(density_pts_per_m2, 2),
        "low_confidence_density": low_confidence,
        "class6_fallback": class6_fallback,
        "num_segments": len(planes),
        "inlierRatio": inlier_ratio,
        "residual": residual,
        # A.9-class-1 §3.1 — footprint-source provenance (2 new fields only).
        "footprint_source": footprint_source,
        "footprint_latency_ms": footprint_latency_ms,
        "segments": [
            {
                "id": i,
                "pitch_degrees": round(p["pitch_degrees"], 1),
                "pitch_ratio_over_12": round(p["pitch_ratio_over_12"], 1),
                "horiz_area_sqft": round(p["horiz_area_sqft"], 1),
                "sloped_area_sqft": round(p["sloped_area_sqft"], 1),
                "n_points": int(len(p["points"])),
                "centroid": [round(float(p["centroid"][k]), 2) for k in range(3)],
            } for i, p in enumerate(planes)
        ],
        "ridge_length_ft": round(ridge_len, 1),
        "hip_length_ft": round(hip_len, 1),
        "valley_length_ft": round(valley_len, 1),
        "intersections_detail": {
            k: [{"planes": list(e["planes"]), "length_ft": round(e["length_ft"], 1),
                 "line_endpoints": [[round(c, 2) for c in ep] for ep in e["line_endpoints"]]}
                for e in v]
            for k, v in intersections.items()
        },
        "elapsed_sec": round(time.time() - t0, 1),
    }

    out_path = Path(laz_path).parent.parent / f"tier3-{Path(laz_path).stem}.json"
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"[6/7] Wrote {out_path}")
    print(f"[7/7] Done in {out['elapsed_sec']}s")


if __name__ == "__main__":
    main()
