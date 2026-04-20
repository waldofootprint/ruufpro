#!/usr/bin/env python3
"""
Tier 3 Pipeline B — independent LiDAR roof geometry, different algorithm than Pipeline A.

Cross-validation alternative to scripts/lidar-tier3-geometry.py.

Algorithm differences (intentional — agreement = correctness signal):
  - Pipeline A: iterative RANSAC (perpendicular residual) + post-hoc merge
  - Pipeline B: DBSCAN spatial clustering of normals + per-cluster sklearn RANSAC plane fit
                (z = ax + by + c, vertical residual)
  - Pipeline A: alpha-shape perimeter
  - Pipeline B: concave-hull (alphashape if available, falls back to convex hull)

Same inputs, same units (tile-native ftUS). Outputs same JSON schema for diff.

Usage:
  python3 scripts/lidar-tier3-pipeline-b.py <tile.laz> <lat> <lng> [--footprint_geojson path]
"""
import argparse, json, sys, time
from pathlib import Path
import numpy as np
import laspy
from shapely.geometry import Polygon, shape as shp_shape
from sklearn.linear_model import RANSACRegressor, LinearRegression
from sklearn.cluster import DBSCAN
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
_spec = importlib.util.spec_from_file_location("tier2", Path(__file__).parent / "lidar-tier2-sqft.py")
tier2 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(tier2)
from lidar_geometry_utils import alpha_shape_perimeter

RANSAC_RESIDUAL_FT = 0.49             # 0.15m, vertical
MIN_SAMPLES = 30                      # lowered from 50 — small dormers
DBSCAN_EPS_FT = 4.0                   # tighter spatial grouping (was 6.0 — over-merging)
DBSCAN_MIN_PTS = 15                   # lowered from 30
NORMAL_SCALE = 50.0                   # was 20.0 — sharper normal-based separation
NORMAL_K = 6                          # was 12 — less blending across plane boundaries
MIN_PLANE_AREA_SQFT = 15.0


def estimate_local_normals(points, k=12):
    """For each point, fit a plane to its k nearest neighbors -> local normal."""
    from scipy.spatial import cKDTree
    tree = cKDTree(points)
    _, idx = tree.query(points, k=k)
    normals = np.zeros_like(points)
    for i in range(len(points)):
        nbrs = points[idx[i]]
        c = nbrs.mean(axis=0)
        cov = np.cov((nbrs - c).T)
        try:
            evals, evecs = np.linalg.eigh(cov)
            n = evecs[:, 0]  # eigenvector with smallest eigenvalue
            if n[2] < 0: n = -n
            normals[i] = n
        except Exception:
            normals[i] = [0, 0, 1]
    return normals


def cluster_by_normal_and_position(points, normals):
    """DBSCAN over [x, y, z, nx*scale, ny*scale, nz*scale]. Different from A's residual-based grouping."""
    feat = np.hstack([points, normals * NORMAL_SCALE])
    db = DBSCAN(eps=DBSCAN_EPS_FT, min_samples=DBSCAN_MIN_PTS).fit(feat)
    return db.labels_


def fit_plane_per_cluster(points, labels):
    """For each cluster label, fit z = ax + by + c via sklearn RANSAC (vertical residual)."""
    planes = []
    for lbl in sorted(set(labels)):
        if lbl == -1: continue  # DBSCAN noise
        mask = (labels == lbl)
        if mask.sum() < MIN_SAMPLES: continue
        cluster_pts = points[mask]
        X = cluster_pts[:, :2]; y = cluster_pts[:, 2]
        try:
            model = RANSACRegressor(
                estimator=LinearRegression(),
                residual_threshold=RANSAC_RESIDUAL_FT,
                min_samples=3,
                max_trials=200,
                random_state=42,
            )
            model.fit(X, y)
        except Exception:
            continue
        a, b = model.estimator_.coef_
        c = model.estimator_.intercept_
        # Plane: z = ax + by + c => normal (a, b, -1) un-normalized; flip so nz>0
        normal = np.array([-a, -b, 1.0])
        normal = normal / np.linalg.norm(normal)
        # Inliers in this cluster
        in_mask = model.inlier_mask_
        inliers = cluster_pts[in_mask]
        if len(inliers) < MIN_SAMPLES: continue
        horiz = _hull_area(inliers[:, :2])
        if horiz < MIN_PLANE_AREA_SQFT: continue
        pitch_deg = float(np.rad2deg(np.arctan(np.sqrt(a*a + b*b))))
        planes.append({
            "normal": normal,
            "centroid": inliers.mean(axis=0),
            "n_points": int(len(inliers)),
            "horiz_area_sqft": float(horiz),
            "sloped_area_sqft": float(horiz / max(abs(normal[2]), 1e-6)),
            "pitch_degrees": pitch_deg,
            "pitch_ratio_over_12": round(12 * np.tan(np.deg2rad(pitch_deg)), 1),
        })
    return planes


def _hull_area(pts2d):
    if len(pts2d) < 3: return 0.0
    try:
        hull = ConvexHull(pts2d)
        return float(hull.volume)
    except Exception:
        return 0.0


def _hull_perimeter(pts2d):
    if len(pts2d) < 3: return 0.0
    try:
        hull = ConvexHull(pts2d)
        verts = pts2d[hull.vertices]
        perim = 0.0
        for i in range(len(verts)):
            perim += float(np.linalg.norm(verts[i] - verts[(i+1) % len(verts)]))
        return perim
    except Exception:
        return 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("laz")
    ap.add_argument("lat", type=float, nargs="?", default=None)
    ap.add_argument("lng", type=float, nargs="?", default=None)
    ap.add_argument("--footprint_geojson", default=None)
    ap.add_argument("--radius_m", type=float, default=40)
    ap.add_argument("--height_above_ground_ft", type=float, default=6.5)
    ap.add_argument("--address_label", default=None)
    args = ap.parse_args()

    t0 = time.time()
    crs_str = tier2.read_tile_crs(args.laz)

    # Pipeline B independent footprint (Bug 5): no shared tier2 filter.
    # Strategy: project lat/lng to tile CRS, take a square bbox around it, find the
    # densest connected DBSCAN cluster of class-6 points within that bbox, take its
    # convex hull (buffered) as the footprint. No external API; no shared clip.
    laz = laspy.read(args.laz)
    xs, ys, zs = np.asarray(laz.x), np.asarray(laz.y), np.asarray(laz.z)
    cls = np.asarray(laz.classification)

    if args.lat is not None and args.lng is not None:
        from pyproj import Transformer
        t = Transformer.from_crs("EPSG:4326", crs_str or "EPSG:6438", always_xy=True)
        cx, cy = t.transform(args.lng, args.lat)
    elif args.footprint_geojson:
        # If geojson provided, use its centroid as the seed (still derive footprint independently)
        gj = json.loads(Path(args.footprint_geojson).read_text())
        feat = gj["features"][0] if gj.get("type") == "FeatureCollection" else gj
        poly_ll = shp_shape(feat["geometry"])
        from pyproj import Transformer
        t = Transformer.from_crs("EPSG:4326", crs_str or "EPSG:6438", always_xy=True)
        cx, cy = t.transform(poly_ll.centroid.x, poly_ll.centroid.y)
    else:
        raise SystemExit("need lat/lng or geojson")

    BBOX_HALF_FT = 130   # ~40m on each side of seed
    bbox_mask = ((xs >= cx - BBOX_HALF_FT) & (xs <= cx + BBOX_HALF_FT) &
                 (ys >= cy - BBOX_HALF_FT) & (ys <= cy + BBOX_HALF_FT))
    cls_in_bbox = cls[bbox_mask]
    bldg_mask_global = bbox_mask & (cls == 6)
    if bldg_mask_global.sum() < 100:
        raise SystemExit("too few class-6 points in bbox")
    bx, by = xs[bldg_mask_global], ys[bldg_mask_global]
    # DBSCAN to isolate the seed cluster (closest to seed point)
    bldg_xy = np.column_stack([bx, by])
    db = DBSCAN(eps=4.0, min_samples=10).fit(bldg_xy)
    labels = db.labels_
    # Pick cluster nearest to seed
    best_label, best_dist = None, float("inf")
    for lbl in set(labels):
        if lbl == -1: continue
        cluster_pts = bldg_xy[labels == lbl]
        d = float(np.linalg.norm(cluster_pts.mean(axis=0) - np.array([cx, cy])))
        if d < best_dist: best_dist, best_label = d, lbl
    if best_label is None:
        raise SystemExit("no class-6 cluster")
    seed_cluster = bldg_xy[labels == best_label]
    hull = ConvexHull(seed_cluster)
    poly_ft = Polygon(seed_cluster[hull.vertices]).buffer(2.0)  # 2 ft buffer for eaves
    structure_footprint_sqft = float(poly_ft.area)
    fp_perim_ft = float(poly_ft.length)

    # Now clip ALL points (any class) to that derived polygon for downstream processing
    mask = tier2.points_in_polygon_mask(xs, ys, poly_ft)
    if mask.sum() < 100: raise SystemExit("too few points after derived clip")
    px, py, pz, pc = xs[mask], ys[mask], zs[mask], cls[mask]

    # Roof points: class 6, fallback to height-above-ground
    class6_mask = (pc == 6)
    if class6_mask.sum() >= MIN_SAMPLES:
        roof_idx = class6_mask
        class6_fallback = False
    else:
        # Need ground z
        if (pc == 2).sum() >= 10:
            ground_z = float(np.median(pz[pc == 2]))
        else:
            ground_z = float(np.percentile(pz, 5))
        roof_idx = (pc == 6) | (pz > ground_z + args.height_above_ground_ft)
        class6_fallback = True
    rx, ry, rz = px[roof_idx], py[roof_idx], pz[roof_idx]
    roof_points = np.column_stack([rx, ry, rz])
    if len(roof_points) < MIN_SAMPLES: raise SystemExit("too few roof points")

    footprint_sqm = structure_footprint_sqft * 0.092903
    density = len(roof_points) / footprint_sqm
    low_confidence = density < 4.0

    # Local normals + cluster + plane fit
    normals = estimate_local_normals(roof_points, k=NORMAL_K)
    labels = cluster_by_normal_and_position(roof_points, normals)
    planes = fit_plane_per_cluster(roof_points, labels)

    # Aggregate
    roof_horiz_sqft = _hull_area(roof_points[:, :2])
    # Bug 2 (applied to B in round 3): anchor sloped to roof_horiz and distribute proportionally
    # by each plane's detected horiz weight, then divide by |nz|. Prevents overlapping-plane
    # double-count that made raw sum(sloped) < roof_horiz (geometrically impossible).
    raw_sum_horiz = sum(p["horiz_area_sqft"] for p in planes) or 1.0
    sloped_sum = 0.0
    for p in planes:
        weight = p["horiz_area_sqft"] / raw_sum_horiz
        exclusive_horiz = weight * roof_horiz_sqft
        sloped_sum += exclusive_horiz / max(abs(p["normal"][2]), 1e-6)
    # Round-3 standardization: use shared alpha-shape perimeter (same as Pipeline A).
    # Convex-hull perimeter retained as secondary field for reference.
    perim_ft, _alpha_area, alpha_flags_b = alpha_shape_perimeter(roof_points[:, :2])
    perim_ft_hull = _hull_perimeter(roof_points[:, :2])

    out = {
        "address_label": args.address_label,
        "pipeline": "B (sklearn-RANSAC + DBSCAN + convex-hull-perim)",
        "tile_path": str(Path(args.laz).resolve()),
        "crs": crs_str[:200],
        "structure_footprint_sqft": round(structure_footprint_sqft, 1),
        "structure_footprint_perim_ft": round(fp_perim_ft, 1),
        "roof_horiz_sqft": round(roof_horiz_sqft, 1),
        "roof_sloped_sqft_sum": round(sloped_sum, 1),
        "roof_perimeter_ft": round(perim_ft, 1),
        "roof_perimeter_ft_hull": round(perim_ft_hull, 1),
        "alpha_flags": alpha_flags_b,
        "point_density_pts_per_m2": round(density, 2),
        "low_confidence_density": low_confidence,
        "class6_fallback": class6_fallback,
        "num_segments": len(planes),
        "segments": [{
            "id": i,
            "pitch_degrees": round(p["pitch_degrees"], 1),
            "pitch_ratio_over_12": round(p["pitch_ratio_over_12"], 1),
            "horiz_area_sqft": round(p["horiz_area_sqft"], 1),
            "sloped_area_sqft": round(p["sloped_area_sqft"], 1),
            "n_points": p["n_points"],
        } for i, p in enumerate(planes)],
        # Pipeline B does NOT compute ridge/hip/valley by design — DBSCAN clusters don't expose adjacency cleanly.
        "ridge_length_ft": None,
        "hip_length_ft": None,
        "valley_length_ft": None,
        "elapsed_sec": round(time.time() - t0, 1),
    }

    out_path = Path(args.laz).parent.parent / f"tier3b-{Path(args.laz).stem}.json"
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"[B] {Path(args.laz).stem}: segs={len(planes)}  horiz={roof_horiz_sqft:.0f} sqft  "
          f"sloped={sloped_sum:.0f}  perim={perim_ft:.0f}ft  density={density:.2f}  "
          f"({out['elapsed_sec']}s)")
    print(f"    -> {out_path}")


if __name__ == "__main__":
    main()
