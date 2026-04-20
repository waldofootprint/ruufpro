#!/usr/bin/env python3
"""
LiDAR Spike Tier 2 — Roof sqft from LAZ point cloud.

For one address:
  1. Fetch building footprint from OSM Overpass (largest building within radius of lat/lng)
  2. Reproject footprint (lat/lng, EPSG:4326) -> tile CRS (EPSG:6438 ftUS for FL East)
  3. Stream LAZ, filter points inside footprint polygon
  4. Classify roof points: classification == 6 (building) OR z > ground+2m
  5. Compute 2D convex hull of roof points -> horizontal-projected roof sqft
  6. Print sqft

Usage: python3 scripts/lidar-tier2-sqft.py <tile.laz> <lat> <lng> [--radius_m 40]
"""
import argparse
import json
import sys
import time
from pathlib import Path

import laspy
import numpy as np
import requests
from pyproj import Transformer
from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.ops import unary_union
from scipy.spatial import ConvexHull

OVERPASS = "https://overpass-api.de/api/interpreter"


def fetch_footprint(lat, lng, radius_m=40):
    """Query OSM Overpass for buildings within radius. Return largest (in lat/lng)."""
    q = f"""
    [out:json][timeout:25];
    (
      way(around:{radius_m},{lat},{lng})["building"];
      relation(around:{radius_m},{lat},{lng})["building"];
    );
    out geom;
    """
    r = requests.post(
        OVERPASS,
        data={"data": q},
        headers={"User-Agent": "RuufPro-LiDAR-Spike/0.1 (hannah@ruufpro.com)"},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    polys = []
    for el in data.get("elements", []):
        if el["type"] == "way" and "geometry" in el:
            coords = [(p["lon"], p["lat"]) for p in el["geometry"]]
            if len(coords) >= 4 and coords[0] == coords[-1]:
                polys.append(Polygon(coords))
        elif el["type"] == "relation":
            # Outer rings only
            outer = []
            for m in el.get("members", []):
                if m.get("role") == "outer" and "geometry" in m:
                    coords = [(p["lon"], p["lat"]) for p in m["geometry"]]
                    if len(coords) >= 4:
                        outer.append(coords)
            for ring in outer:
                if ring[0] != ring[-1]:
                    ring = ring + [ring[0]]
                if len(ring) >= 4:
                    polys.append(Polygon(ring))
    if not polys:
        return None, 0
    # Pick largest (roughly — use geodesic-approx via area in deg, fine for ranking)
    polys.sort(key=lambda p: p.area, reverse=True)
    return polys[0], len(polys)


def reproject_polygon(poly_ll, to_wkt):
    t = Transformer.from_crs("EPSG:4326", to_wkt, always_xy=True)
    coords = [t.transform(x, y) for x, y in poly_ll.exterior.coords]
    return Polygon(coords)


def read_tile_crs(laz_path):
    f = laspy.open(laz_path)
    for v in f.header.vlrs:
        if hasattr(v, 'string'):
            return v.string
    return None


def points_in_polygon_mask(xs, ys, poly):
    """Vectorized bounding-box prefilter then shapely contains."""
    minx, miny, maxx, maxy = poly.bounds
    bbox_mask = (xs >= minx) & (xs <= maxx) & (ys >= miny) & (ys <= maxy)
    if not bbox_mask.any():
        return bbox_mask
    # shapely vectorized via prepared geom
    from shapely import prepared, vectorized
    try:
        inside = vectorized.contains(poly, xs[bbox_mask], ys[bbox_mask])
    except Exception:
        prep = prepared.prep(poly)
        inside = np.array([prep.contains(Point(x, y)) for x, y in zip(xs[bbox_mask], ys[bbox_mask])])
    result = np.zeros_like(bbox_mask)
    bbox_idx = np.where(bbox_mask)[0]
    result[bbox_idx[inside]] = True
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("laz")
    ap.add_argument("lat", type=float)
    ap.add_argument("lng", type=float)
    ap.add_argument("--radius_m", type=float, default=40)
    ap.add_argument("--crs_epsg", type=int, default=0, help="0 = auto-detect from LAZ WKT")
    ap.add_argument("--height_above_ground_ft", type=float, default=6.5)  # ~2m
    args = ap.parse_args()

    t0 = time.time()
    print(f"[1/5] Fetching footprint from OSM Overpass @ ({args.lat},{args.lng}) r={args.radius_m}m")
    poly_ll, n_found = fetch_footprint(args.lat, args.lng, args.radius_m)
    if poly_ll is None:
        wide = max(args.radius_m * 2, 100)
        print(f"  no building footprint found; widening to {wide}m")
        poly_ll, n_found = fetch_footprint(args.lat, args.lng, wide)
    if poly_ll is None:
        print("  FAIL: no building footprint at any radius")
        sys.exit(2)
    print(f"  found {n_found} building(s); using largest, {len(poly_ll.exterior.coords)-1} vertices")

    if args.crs_epsg:
        to_crs = f"EPSG:{args.crs_epsg}"
    else:
        to_crs = read_tile_crs(args.laz)
        if to_crs is None:
            print("  FAIL: could not read CRS from LAZ"); sys.exit(5)
    print(f"[2/5] Reprojecting footprint to tile CRS")
    poly_ft = reproject_polygon(poly_ll, to_crs)
    ft_area = poly_ft.area  # sq ft
    print(f"  footprint area (2D, horizontal): {ft_area:.0f} sqft")
    print(f"  footprint bounds: {poly_ft.bounds}")

    print(f"[3/5] Streaming LAZ points, cropping to footprint...")
    laz = laspy.read(args.laz)
    xs = np.asarray(laz.x); ys = np.asarray(laz.y); zs = np.asarray(laz.z)
    cls = np.asarray(laz.classification)
    print(f"  total points: {len(xs):,}")

    mask = points_in_polygon_mask(xs, ys, poly_ft)
    print(f"  points inside footprint: {mask.sum():,}")
    if mask.sum() < 100:
        print("  FAIL: too few points inside footprint (bad CRS or off-tile)")
        sys.exit(3)
    px, py, pz, pc = xs[mask], ys[mask], zs[mask], cls[mask]

    print(f"[4/5] Classifying roof points")
    # Ground = class 2; use median ground z WITHIN footprint (or near)
    ground_mask_local = (pc == 2)
    if ground_mask_local.sum() < 10:
        # use all classification 2 within wider bbox
        bminx, bminy, bmaxx, bmaxy = poly_ft.bounds
        pad = 20
        wide = ((xs >= bminx-pad) & (xs <= bmaxx+pad) &
                (ys >= bminy-pad) & (ys <= bmaxy+pad) & (cls == 2))
        ground_z = float(np.median(zs[wide])) if wide.sum() else float(np.percentile(pz, 5))
    else:
        ground_z = float(np.median(pz[ground_mask_local]))
    print(f"  ground z: {ground_z:.1f} ft")

    # Roof = classification 6 OR z above ground + threshold
    roof_mask = (pc == 6) | (pz > ground_z + args.height_above_ground_ft)
    rx, ry, rz = px[roof_mask], py[roof_mask], pz[roof_mask]
    print(f"  roof points: {roof_mask.sum():,} (class6={int((pc==6).sum()):,}, height-above-ground={int(((pc!=6)&(pz>ground_z+args.height_above_ground_ft)).sum()):,})")
    if len(rx) < 50:
        print("  FAIL: too few roof points")
        sys.exit(4)

    print(f"[5/5] Convex hull area (horizontal projection)")
    pts2d = np.column_stack([rx, ry])
    hull = ConvexHull(pts2d)
    lidar_sqft = hull.volume  # for 2D, .volume = area
    print(f"  LIDAR roof sqft (2D convex hull of roof points): {lidar_sqft:.0f}")
    print(f"  LIDAR roof sqft (footprint area, for reference):   {ft_area:.0f}")
    print(f"  roof z range: {rz.min():.1f} .. {rz.max():.1f} ft (spread {rz.max()-rz.min():.1f} ft)")

    # Dump JSON result
    out = {
        "address_latlng": [args.lat, args.lng],
        "osm_buildings_found": n_found,
        "footprint_sqft": float(ft_area),
        "lidar_hull_sqft": float(lidar_sqft),
        "roof_point_count": int(len(rx)),
        "ground_z_ft": ground_z,
        "roof_z_min_ft": float(rz.min()),
        "roof_z_max_ft": float(rz.max()),
        "elapsed_sec": round(time.time() - t0, 1),
    }
    out_path = Path(args.laz).parent.parent / f"tier2-{Path(args.laz).stem}.json"
    out_path.write_text(json.dumps(out, indent=2))
    print(f"  wrote {out_path}")


if __name__ == "__main__":
    main()
