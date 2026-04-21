#!/usr/bin/env python3
"""
396g — Hip-detection diagnostic harness (observation-only).

Per decisions/396g-scoping.md §§5-6:
  - Pipeline A source (scripts/lidar-tier3-geometry.py) NOT modified.
  - Driver imports Pipeline A as a module and replicates the detect-segments
    + classify-intersections step sequence, capturing intermediate state.
  - Merge-toggle (`RANSAC_DISABLE_MERGE=1`) lives entirely in this driver.
    Env-unset path calls Pipeline A's own _merge_planes, preserving Phase A
    (e95d561) behavior.
  - No fix attempted. No Pipeline A logic changed. Observation only.

Single-building invocation:
  python3 scripts/diag-396g.py \
      --fk 80 \
      --laz bench-assets/roofn3d-n20/bldg_80.laz \
      --footprint_xy_json bench-assets/roofn3d-n20/bldg_80.footprint.xy.json \
      --line_gt .tmp/roofn3d/line-gt/bldg_80.line.json \
      --out_diag_json .tmp/396g-diag/bldg_80.diag.json

Env-gate:
  RANSAC_DISABLE_MERGE=1   -> skip Pipeline A's _merge_planes step.
  (unset)                   -> reproduce Pipeline A Phase A flow byte-identically.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path

import laspy
import numpy as np
from scipy.spatial import ConvexHull
from shapely.geometry import Polygon

_HERE = Path(__file__).parent
_spec = importlib.util.spec_from_file_location("g3", _HERE / "lidar-tier3-geometry.py")
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)
tier2 = g.tier2  # re-exported inside lidar-tier3-geometry

MET_TO_FTUS = 3.2808333333333333


def _load_roof_points(laz_path: str, footprint_xy_json: str, height_fallback_ft: float = 6.5):
    """Replicates Pipeline A main()'s roof-point extraction for bench mode
    (--footprint_xy_json branch). Returns roof_points (N,3) plus metadata.
    """
    j = json.loads(Path(footprint_xy_json).read_text())
    poly_ft = Polygon(j["polygon_xy_ftus"])
    laz = laspy.read(laz_path)
    xs = np.asarray(laz.x); ys = np.asarray(laz.y); zs = np.asarray(laz.z)
    cls = np.asarray(laz.classification)
    mask = tier2.points_in_polygon_mask(xs, ys, poly_ft)
    px, py, pz, pc = xs[mask], ys[mask], zs[mask], cls[mask]

    ground_mask_local = (pc == 2)
    if ground_mask_local.sum() < 10:
        b = poly_ft.bounds; pad = 20
        wide = ((xs >= b[0] - pad) & (xs <= b[2] + pad)
                & (ys >= b[1] - pad) & (ys <= b[3] + pad)
                & (cls == 2))
        ground_z = float(np.median(zs[wide])) if wide.sum() else float(np.percentile(pz, 5))
    else:
        ground_z = float(np.median(pz[ground_mask_local]))

    class6_mask = (pc == 6)
    if class6_mask.sum() >= g.RANSAC_MIN_INLIERS:
        roof_mask = class6_mask
        class6_fallback = False
    else:
        roof_mask = (pc == 6) | (pz > ground_z + height_fallback_ft)
        class6_fallback = True
    rx, ry, rz = px[roof_mask], py[roof_mask], pz[roof_mask]
    roof_points = np.column_stack([rx, ry, rz])

    footprint_sqm = float(poly_ft.area) * 0.092903
    density_pts_per_m2 = float(mask.sum()) / footprint_sqm if footprint_sqm > 0 else 0.0

    return {
        "roof_points": roof_points,
        "ground_z_ft": ground_z,
        "footprint_sqft": float(poly_ft.area),
        "density_pts_per_m2": density_pts_per_m2,
        "class6_fallback": class6_fallback,
        "n_inside_footprint": int(mask.sum()),
    }


def _detect_with_trace(roof_points: np.ndarray, disable_merge: bool):
    """Replicates g.detect_segments step sequence. When disable_merge=False,
    behavior is identical to g.detect_segments (same rng seed, same
    RANSAC/merge/filter calls into Pipeline A module functions). When
    disable_merge=True, skips the _merge_planes call.
    Returns (planes_pre_merge, planes_final).
    """
    rng = np.random.default_rng(42)  # matches g.detect_segments default rng_seed
    remaining = roof_points.copy()
    remaining_idx = np.arange(len(roof_points))
    planes = []
    while len(remaining) >= g.RANSAC_MIN_INLIERS:
        normal, d, inliers = g.fit_plane_ransac(
            remaining, g.RANSAC_THRESHOLD_FT, g.RANSAC_MAX_ITER, rng
        )
        if inliers is None or int(inliers.sum()) < g.RANSAC_MIN_INLIERS:
            break
        inlier_pts = remaining[inliers]
        normal, d = g.refit_plane_lsq(inlier_pts)
        planes.append({
            "normal": normal, "d": d, "points": inlier_pts,
            "orig_idx": remaining_idx[inliers],
        })
        keep = ~inliers
        remaining = remaining[keep]
        remaining_idx = remaining_idx[keep]

    # snapshot pre-merge
    pre_merge = [{
        "normal": p["normal"].copy(),
        "d": float(p["d"]),
        "points": p["points"].copy(),
    } for p in planes]

    if not disable_merge:
        planes = g._merge_planes(planes)

    # min-area filter (identical to Pipeline A)
    kept = []
    for p in planes:
        horiz = g._horiz_area_sqft(p["points"])
        if horiz >= g.MIN_PLANE_AREA_SQFT:
            p["horiz_area_sqft"] = horiz
            p["sloped_area_sqft"] = horiz / max(abs(p["normal"][2]), 1e-6)
            p["pitch_degrees"] = g._pitch_deg(p["normal"])
            p["pitch_ratio_over_12"] = round(12 * np.tan(np.deg2rad(p["pitch_degrees"])), 1)
            p["centroid"] = p["points"].mean(axis=0)
            kept.append(p)
    return pre_merge, kept


def _extent_xy(points: np.ndarray):
    if len(points) < 3:
        return []
    try:
        hull = ConvexHull(points[:, :2])
        return [[float(points[i, 0]), float(points[i, 1])] for i in hull.vertices]
    except Exception:
        return []


def _plane_density_pts_per_m2(points_xy: np.ndarray) -> float:
    if len(points_xy) < 3:
        return 0.0
    try:
        hull = ConvexHull(points_xy)
        area_sqft = float(hull.volume)  # 2D volume == area
        area_m2 = area_sqft * 0.092903
        if area_m2 <= 0:
            return 0.0
        return len(points_xy) / area_m2
    except Exception:
        return 0.0


def _classify_with_trace(planes):
    """Replicates g.classify_intersections. For each plane pair, calls
    g._plane_plane_intersection to get the (already-clipped) line, then
    g._classify_line for the canonical answer. Auxiliary trace fields
    (dz, horizontal flag, dot product, convex/concave flags) are computed
    without invoking the classifier's internals — they are logged solely
    for hypothesis-E/F diagnostics and do not drive any output.
    Returns (pre_edges, post_edges_by_class).
    """
    pre = []
    post = {"ridge": [], "hip": [], "valley": [], "other": []}
    for i in range(len(planes)):
        for j in range(i + 1, len(planes)):
            line = g._plane_plane_intersection(planes[i], planes[j])
            if line is None:
                continue
            start, end = line
            raw_length = float(np.linalg.norm(end - start))
            pre_entry = {
                "plane_a_idx": i,
                "plane_b_idx": j,
                "intersection_line_start": [float(x) for x in start],
                "intersection_line_end": [float(x) for x in end],
                "raw_length_ft": round(raw_length, 3),
            }
            # Auxiliary trace — mirrors _classify_line's inputs for logging only.
            dz = float(abs(end[2] - start[2]))
            horizontal = dz < g.RIDGE_HORIZONTAL_TOLERANCE_FT
            dot = None
            convex_flag = None
            concave_flag = None
            degenerate = False
            if raw_length >= 1.0:
                line_dir = (end - start) / raw_length
                tA = g._in_plane_perpendicular(planes[i]["normal"], line_dir)
                tB = g._in_plane_perpendicular(planes[j]["normal"], line_dir)
                tA_h = tA.copy(); tA_h[2] = 0
                tB_h = tB.copy(); tB_h[2] = 0
                if np.linalg.norm(tA_h) < 1e-6 or np.linalg.norm(tB_h) < 1e-6:
                    degenerate = True
                else:
                    tA_h /= np.linalg.norm(tA_h)
                    tB_h /= np.linalg.norm(tB_h)
                    if tA[2] > 0: tA_h = -tA_h
                    if tB[2] > 0: tB_h = -tB_h
                    dot = float(np.dot(tA_h, tB_h))
                    convex_flag = dot < -0.2
                    concave_flag = dot > 0.2
            pre_entry["_trace"] = {
                "dz_ft": round(dz, 4),
                "horizontal_tol_ft": float(g.RIDGE_HORIZONTAL_TOLERANCE_FT),
                "horizontal_flag": bool(horizontal),
                "tangent_dot": round(dot, 5) if dot is not None else None,
                "convex_flag": bool(convex_flag) if convex_flag is not None else None,
                "concave_flag": bool(concave_flag) if concave_flag is not None else None,
                "tangent_degenerate": bool(degenerate),
            }
            pre.append(pre_entry)

            cls, length = g._classify_line(line, planes[i], planes[j])
            post[cls].append({
                "plane_a_idx": i,
                "plane_b_idx": j,
                "type": cls,
                "emitted_length_ft": round(length, 3),
                "raw_minus_emitted_ft": round(raw_length - length, 6),
                "line_endpoints": [
                    [float(x) for x in start],
                    [float(x) for x in end],
                ],
            })
    return pre, post


def _hip_midpoint_density(roof_points: np.ndarray, hip_edges):
    """Per hypothesis I: points within 0.5 m sphere of each hip-edge midpoint.
    Counts class-6 roof points already filtered by Pipeline A flow.
    Distances computed in ftUS; 0.5 m converted accordingly.
    """
    r_ft = 0.5 * MET_TO_FTUS
    out = []
    for e in hip_edges:
        start = np.array(e["line_endpoints"][0])
        end = np.array(e["line_endpoints"][1])
        mid = (start + end) / 2
        d2 = np.sum((roof_points - mid) ** 2, axis=1)
        mask = d2 < (r_ft ** 2)
        count = int(mask.sum())
        # Rough mean-spacing estimate: cube-root of (sphere volume / count)
        vol_m3 = (4.0 / 3.0) * np.pi * (0.5 ** 3)
        mean_spacing_m = round((vol_m3 / max(count, 1)) ** (1.0 / 3.0), 4) if count > 0 else None
        out.append({
            "plane_pair": [e["plane_a_idx"], e["plane_b_idx"]],
            "midpoint_xyz_ft": [round(float(m), 3) for m in mid],
            "count_within_0.5m": count,
            "mean_spacing_m": mean_spacing_m,
        })
    return out


def _totals(post_edges):
    r = sum(e["emitted_length_ft"] for e in post_edges["ridge"])
    h = sum(e["emitted_length_ft"] for e in post_edges["hip"])
    v = sum(e["emitted_length_ft"] for e in post_edges["valley"])
    return round(r, 1), round(h, 1), round(v, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fk", required=True)
    ap.add_argument("--laz", required=True)
    ap.add_argument("--footprint_xy_json", required=True)
    ap.add_argument("--line_gt", required=True)
    ap.add_argument("--out_diag_json", required=True)
    args = ap.parse_args()

    merge_disabled = bool(os.getenv("RANSAC_DISABLE_MERGE"))

    banner = (
        f"[396g-diag] fk={args.fk} merge_disabled={merge_disabled} "
        f"RANSAC_THRESHOLD_FT={g.RANSAC_THRESHOLD_FT} "
        f"RANSAC_MIN_INLIERS={g.RANSAC_MIN_INLIERS} "
        f"MERGE_ANGLE_DEG={g.MERGE_ANGLE_DEG} "
        f"MERGE_OFFSET_FT={g.MERGE_OFFSET_FT}"
    )
    print(banner)

    loaded = _load_roof_points(args.laz, args.footprint_xy_json)
    roof_points = loaded["roof_points"]
    if len(roof_points) < g.RANSAC_MIN_INLIERS:
        raise SystemExit(f"fk={args.fk}: too few roof points ({len(roof_points)})")

    pre_merge_planes, planes = _detect_with_trace(roof_points, merge_disabled)
    pre_edges, post_edges = _classify_with_trace(planes)
    ridge_len, hip_len, valley_len = _totals(post_edges)
    hip_density = _hip_midpoint_density(roof_points, post_edges["hip"])

    gt = json.loads(Path(args.line_gt).read_text())

    plane_records = []
    for i, p in enumerate(planes):
        density_m2 = _plane_density_pts_per_m2(p["points"][:, :2])
        plane_records.append({
            "idx": i,
            "normal": [float(x) for x in p["normal"]],
            "d": float(p["d"]),
            "inlier_count": int(len(p["points"])),
            "inlier_density_pts_per_m2": round(density_m2, 3),
            "horiz_area_sqft": round(p["horiz_area_sqft"], 1),
            "sloped_area_sqft": round(p["sloped_area_sqft"], 1),
            "pitch_deg": round(p["pitch_degrees"], 2),
            "pitch_over_12": round(p["pitch_ratio_over_12"], 2),
            "centroid_xyz_ft": [round(float(p["centroid"][k]), 3) for k in range(3)],
            "extent_polygon_verts_xy_ftus": _extent_xy(p["points"]),
        })

    pre_merge_records = []
    for i, p in enumerate(pre_merge_planes):
        horiz = g._horiz_area_sqft(p["points"])
        pre_merge_records.append({
            "idx": i,
            "normal": [float(x) for x in p["normal"]],
            "d": float(p["d"]),
            "inlier_count": int(len(p["points"])),
            "horiz_area_sqft": round(horiz, 1),
        })

    out = {
        "fk": args.fk,
        "harness_commit": os.getenv("DIAG_396G_COMMIT", "<uncommitted>"),
        "merge_disabled": merge_disabled,
        "config": {
            "ransac_threshold_ft": float(g.RANSAC_THRESHOLD_FT),
            "ransac_min_inliers": int(g.RANSAC_MIN_INLIERS),
            "ransac_max_iter": int(g.RANSAC_MAX_ITER),
            "merge_angle_deg": float(g.MERGE_ANGLE_DEG),
            "merge_offset_ft": float(g.MERGE_OFFSET_FT),
            "min_plane_area_sqft": float(g.MIN_PLANE_AREA_SQFT),
            "ridge_horizontal_tolerance_ft": float(g.RIDGE_HORIZONTAL_TOLERANCE_FT),
        },
        "inputs": {
            "laz": str(Path(args.laz).resolve()),
            "footprint_xy_json": str(Path(args.footprint_xy_json).resolve()),
            "line_gt": str(Path(args.line_gt).resolve()),
            "n_roof_points": int(len(roof_points)),
            "footprint_sqft": round(loaded["footprint_sqft"], 1),
            "footprint_density_pts_per_m2": round(loaded["density_pts_per_m2"], 3),
            "class6_fallback": bool(loaded["class6_fallback"]),
        },
        "planes_pre_merge": pre_merge_records,
        "plane_count_pre_merge": len(pre_merge_planes),
        "planes": plane_records,
        "plane_count_post": len(planes),
        "pre_classification_edges": pre_edges,
        "post_classification_edges_by_type": post_edges,
        "totals_ft": {
            "ridge": ridge_len,
            "hip": hip_len,
            "valley": valley_len,
        },
        "gt": {
            "fk_buildings": gt.get("fk_buildings"),
            "roof_type": gt.get("roof_type"),
            "plane_count_gt": gt.get("plane_count_gt"),
            "ridge_length_ft": gt.get("ridge_length_ft"),
            "hip_length_ft": gt.get("hip_length_ft"),
            "valley_length_ft": gt.get("valley_length_ft"),
            "edges": gt.get("edges"),
        },
        "hip_midpoint_inlier_density": hip_density,
    }

    out_path = Path(args.out_diag_json)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"  wrote {out_path}  "
          f"pre_merge={len(pre_merge_planes)} post={len(planes)}  "
          f"ridge={ridge_len} hip={hip_len} valley={valley_len}  "
          f"gt_ridge={gt.get('ridge_length_ft')} gt_hip={gt.get('hip_length_ft')}")


if __name__ == "__main__":
    main()
