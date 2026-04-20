#!/usr/bin/env python3
"""Tier 2 variant: footprint from geojson file instead of OSM."""
import json, sys, time, argparse
from pathlib import Path
import numpy as np, laspy
from shapely.geometry import shape, Polygon
from pyproj import Transformer
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
# Reuse helpers
import importlib.util
spec = importlib.util.spec_from_file_location("tier2", Path(__file__).parent / "lidar-tier2-sqft.py")
tier2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(tier2)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("laz"); ap.add_argument("geojson")
    ap.add_argument("--crs_epsg", type=int, default=0)
    ap.add_argument("--height_above_ground_ft", type=float, default=6.5)
    args = ap.parse_args()

    t0 = time.time()
    gj = json.loads(Path(args.geojson).read_text())
    feat = gj["features"][0] if gj.get("type")=="FeatureCollection" else gj
    poly_ll = shape(feat["geometry"])
    print(f"[1/5] Footprint loaded: {len(poly_ll.exterior.coords)-1} verts")

    to_crs = f"EPSG:{args.crs_epsg}" if args.crs_epsg else tier2.read_tile_crs(args.laz)
    print(f"[2/5] Reprojecting to {to_crs[:80]}...")
    poly_ft = tier2.reproject_polygon(poly_ll, to_crs)
    ft_area = poly_ft.area
    print(f"  footprint area (horiz): {ft_area:.0f} sqft")

    print(f"[3/5] Reading LAZ...")
    laz = laspy.read(args.laz)
    xs, ys, zs = np.asarray(laz.x), np.asarray(laz.y), np.asarray(laz.z)
    cls = np.asarray(laz.classification)
    print(f"  total points: {len(xs):,}")
    mask = tier2.points_in_polygon_mask(xs, ys, poly_ft)
    print(f"  points inside footprint: {mask.sum():,}")
    if mask.sum() < 100:
        print("  FAIL: too few points"); sys.exit(3)
    px, py, pz, pc = xs[mask], ys[mask], zs[mask], cls[mask]

    print(f"[4/5] Classifying roof points")
    gmask = (pc==2)
    if gmask.sum() < 10:
        b = poly_ft.bounds; pad=20
        wide = ((xs>=b[0]-pad)&(xs<=b[2]+pad)&(ys>=b[1]-pad)&(ys<=b[3]+pad)&(cls==2))
        ground_z = float(np.median(zs[wide])) if wide.sum() else float(np.percentile(pz,5))
    else:
        ground_z = float(np.median(pz[gmask]))
    print(f"  ground z: {ground_z:.1f} ft")
    roof_mask = (pc==6) | (pz > ground_z + args.height_above_ground_ft)
    rx, ry, rz = px[roof_mask], py[roof_mask], pz[roof_mask]
    print(f"  roof points: {roof_mask.sum():,}")
    if len(rx) < 50:
        print("  FAIL: too few roof points"); sys.exit(4)

    print(f"[5/5] Convex hull")
    hull = ConvexHull(np.column_stack([rx, ry]))
    lidar_sqft = hull.volume
    print(f"  LIDAR horiz (convex hull): {lidar_sqft:.0f}")
    print(f"  footprint ref: {ft_area:.0f}")
    print(f"  roof z range: {rz.min():.1f}..{rz.max():.1f} ft")

    out = {"source":"MS_Global_Building_Footprints","footprint_sqft":float(ft_area),
           "lidar_hull_sqft":float(lidar_sqft),"roof_points":int(len(rx)),
           "ground_z_ft":ground_z,"elapsed_sec":round(time.time()-t0,1)}
    outp = Path(args.laz).parent.parent / f"tier2-ms-{Path(args.laz).stem}.json"
    outp.write_text(json.dumps(out, indent=2))
    print(f"  wrote {outp}")

if __name__ == "__main__": main()
