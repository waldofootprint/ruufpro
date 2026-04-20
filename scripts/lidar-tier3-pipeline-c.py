#!/usr/bin/env python3
"""
Tier 3 Pipeline C — PDAL-driven cross-check (third independent pipeline).

Uses PDAL CLI (not Python bindings — bindings require separate install).
Algorithm:
  1. filters.range to keep class-6 (building) points
  2. filters.crop to clip to a bbox around the seed lat/lng
  3. filters.cluster (Euclidean clustering, tolerance ~3 ft) to find connected planes
  4. Per-cluster: extract horizontal area (convex hull) + count -> "segment" estimate

Outputs JSON in same schema as Pipelines A and B for xval ingestion.

Usage:
  python3 scripts/lidar-tier3-pipeline-c.py <tile.laz> <lat> <lng> [--crs_epsg N]
"""
import argparse, json, subprocess, sys, time, tempfile
from pathlib import Path
import numpy as np
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
_spec = importlib.util.spec_from_file_location("tier2", Path(__file__).parent / "lidar-tier2-sqft.py")
tier2 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(tier2)

BBOX_HALF_FT = 130
CLUSTER_TOLERANCE_FT = 3.0
MIN_CLUSTER_PTS = 30


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("laz")
    ap.add_argument("lat", type=float, nargs="?", default=None)
    ap.add_argument("lng", type=float, nargs="?", default=None)
    ap.add_argument("--crs_epsg", type=int, default=0)
    ap.add_argument("--address_label", default=None)
    args = ap.parse_args()

    t0 = time.time()
    crs_str = tier2.read_tile_crs(args.laz)
    epsg = args.crs_epsg or 6438
    if crs_str and "6440" in crs_str: epsg = 6440
    elif crs_str and "6438" in crs_str: epsg = 6438

    # Project seed to tile CRS
    from pyproj import Transformer
    t = Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True)
    if args.lat is None or args.lng is None:
        raise SystemExit("lat/lng required")
    cx, cy = t.transform(args.lng, args.lat)

    # Build PDAL pipeline JSON
    out_las = tempfile.NamedTemporaryFile(suffix=".las", delete=False).name
    pipeline = {
        "pipeline": [
            args.laz,
            {"type": "filters.range", "limits": "Classification[6:6]"},
            {"type": "filters.crop",
             "bounds": f"([{cx-BBOX_HALF_FT},{cx+BBOX_HALF_FT}],[{cy-BBOX_HALF_FT},{cy+BBOX_HALF_FT}])"},
            {"type": "filters.cluster",
             "min_points": MIN_CLUSTER_PTS,
             "tolerance": CLUSTER_TOLERANCE_FT},
            {"type": "writers.las", "filename": out_las, "extra_dims": "ClusterID=uint64"},
        ]
    }
    pjson = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    json.dump(pipeline, pjson); pjson.close()

    # Run PDAL
    try:
        result = subprocess.run(["pdal", "pipeline", pjson.name],
                                capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise SystemExit(f"PDAL failed: {result.stderr[:300]}")
    except subprocess.TimeoutExpired:
        raise SystemExit("PDAL pipeline timeout")

    # Read output LAS to get cluster labels
    import laspy
    las = laspy.read(out_las)
    if len(las.x) < 30:
        raise SystemExit("PDAL kept too few points")
    xs = np.asarray(las.x); ys = np.asarray(las.y); zs = np.asarray(las.z)
    cluster_ids = np.asarray(las.ClusterID) if hasattr(las, "ClusterID") else None
    if cluster_ids is None:
        # Try standard 'classification' or other dim
        try:
            cluster_ids = np.asarray(las["ClusterID"])
        except Exception:
            raise SystemExit("PDAL ClusterID dim not present in output")

    # Per-cluster geometry
    unique_clusters = sorted(set(cluster_ids.tolist()))
    unique_clusters = [c for c in unique_clusters if c != 0]  # 0 = noise/unclustered
    segments = []
    for cid in unique_clusters:
        mask = (cluster_ids == cid)
        if mask.sum() < MIN_CLUSTER_PTS: continue
        cx_pts, cy_pts, cz_pts = xs[mask], ys[mask], zs[mask]
        if len(cx_pts) < 3: continue
        try:
            hull = ConvexHull(np.column_stack([cx_pts, cy_pts]))
            horiz = float(hull.volume)
        except Exception:
            continue
        if horiz < 15.0: continue
        # Per-cluster plane fit (z = ax + by + c) for pitch
        A = np.column_stack([cx_pts, cy_pts, np.ones_like(cx_pts)])
        try:
            coef, *_ = np.linalg.lstsq(A, cz_pts, rcond=None)
            a, b, c = coef
            pitch_deg = float(np.rad2deg(np.arctan(np.sqrt(a*a + b*b))))
        except Exception:
            pitch_deg = 0.0
        nz = np.cos(np.deg2rad(pitch_deg))
        segments.append({
            "id": int(cid),
            "n_points": int(mask.sum()),
            "horiz_area_sqft": round(horiz, 1),
            "sloped_area_sqft": round(horiz / max(abs(nz), 1e-6), 1),
            "pitch_degrees": round(pitch_deg, 1),
            "pitch_ratio_over_12": round(12 * np.tan(np.deg2rad(pitch_deg)), 1),
        })

    # Restrict roof horiz/perim to the SEED-NEAREST cluster (tile may contain neighbors).
    seed_cluster_id = None; best_d = float("inf")
    for cid in unique_clusters:
        m = (cluster_ids == cid)
        if m.sum() < MIN_CLUSTER_PTS: continue
        d = float(np.linalg.norm(np.array([xs[m].mean(), ys[m].mean()]) - np.array([cx, cy])))
        if d < best_d: best_d, seed_cluster_id = d, cid
    if seed_cluster_id is not None:
        seed_mask = (cluster_ids == seed_cluster_id)
        # For multi-cluster buildings (separate hip + porch), include all clusters within 50 ft of seed
        for cid in unique_clusters:
            if cid == seed_cluster_id: continue
            m = (cluster_ids == cid)
            if m.sum() < MIN_CLUSTER_PTS: continue
            d = float(np.linalg.norm(np.array([xs[m].mean(), ys[m].mean()]) - np.array([cx, cy])))
            if d < 50.0: seed_mask |= m
        seed_pts2d = np.column_stack([xs[seed_mask], ys[seed_mask]])
        try:
            hull_all = ConvexHull(seed_pts2d)
            roof_horiz = float(hull_all.volume)
            verts = seed_pts2d[hull_all.vertices]
            perim = sum(float(np.linalg.norm(verts[i] - verts[(i+1) % len(verts)])) for i in range(len(verts)))
        except Exception:
            roof_horiz = 0.0; perim = 0.0
        # Filter segments to those within seed building
        segments = [s for s in segments if s["id"] == seed_cluster_id or
                    any(abs(s["id"] - cid) < 1 for cid in unique_clusters
                        if (cluster_ids == cid).sum() >= MIN_CLUSTER_PTS
                        and float(np.linalg.norm(np.array([xs[cluster_ids == cid].mean(), ys[cluster_ids == cid].mean()]) - np.array([cx, cy]))) < 50.0)]
    else:
        roof_horiz = 0.0; perim = 0.0

    sloped_sum = sum(s["sloped_area_sqft"] for s in segments)

    out = {
        "address_label": args.address_label,
        "pipeline": "C (PDAL filters.cluster + per-cluster lstsq plane)",
        "tile_path": str(Path(args.laz).resolve()),
        "crs": f"EPSG:{epsg}",
        "structure_footprint_sqft": None,
        "structure_footprint_perim_ft": None,
        "roof_horiz_sqft": round(roof_horiz, 1),
        "roof_sloped_sqft_sum": round(sloped_sum, 1),
        "roof_perimeter_ft": round(perim, 1),
        "num_segments": len(segments),
        "segments": segments,
        "ridge_length_ft": None, "hip_length_ft": None, "valley_length_ft": None,
        "elapsed_sec": round(time.time() - t0, 1),
    }
    out_path = Path(args.laz).parent.parent / f"tier3c-{Path(args.laz).stem}.json"
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"[C] {Path(args.laz).stem}: segs={len(segments)}  horiz={roof_horiz:.0f} sqft  "
          f"sloped={sloped_sum:.0f}  perim={perim:.0f}ft  ({out['elapsed_sec']}s)")
    print(f"    -> {out_path}")


if __name__ == "__main__":
    main()
