#!/usr/bin/env python3
"""
RoofN3D adapter — stream CSV dump, select residential pitched buildings,
emit per-building LAZ + GT sidecar for Pipeline A consumption.

Source dataset: https://RoofN3D.gis.tu-berlin.de/data/roofn3d_raw_data.zip
Units: EPSG:26918 UTM-18N meters. Adapter converts to US survey feet so
Pipeline A's FL-ftUS-calibrated thresholds (0.49ft RANSAC, 15sqft min plane,
etc.) apply unchanged. Coordinates faux-stamped as EPSG:6438 (FL E ftUS)
since the bench cares about geometry not geolocation.

Usage:
  python3 scripts/roofn3d_adapter.py extract --dump_dir DIR --out_dir DIR
      [--n_saddleback 4] [--n_hip 4] [--n_pyramid 2]
      [--min_footprint_sqft 1500] [--max_footprint_sqft 6000]

Produces in --out_dir:
  buildings/bldg_<fk>.laz         (faux FL ftUS LAZ)
  buildings/bldg_<fk>.gt.json     ({roof_type, plane_count, planes:[{id,
                                    pitch_deg, horiz_area_sqft, nz}],
                                    footprint_polygon_ll, seed_lat, seed_lng})
  selection.json                   (all chosen fk_buildings + stratification)
"""
import argparse, csv, json, re, sys, time
from pathlib import Path
import numpy as np

MET_TO_FTUS = 3.2808333333333333

# RoofN3D buildingparts.class allowed set (pitched only; excludes flat commercial)
PITCHED_CLASSES = {"Saddleback roof", "Two-sided hip roof", "Pyramid roof"}


def parse_wkt_multipolygon_z(wkt):
    """Parse MULTIPOLYGON Z(((x y z, ...)), ...) -> list of 2D outer rings + 3D vertex lists.
    Returns list of dicts: [{'outer_xy_m': ndarray, 'verts_m': ndarray}]."""
    m = re.match(r"\s*MULTIPOLYGON\s*Z\s*\(\s*(.*)\s*\)\s*$", wkt, flags=re.I | re.S)
    if not m: return []
    body = m.group(1)
    # Split into polygons — balance parens.
    polys, depth, start = [], 0, None
    for i, ch in enumerate(body):
        if ch == '(':
            if depth == 0: start = i
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0 and start is not None:
                polys.append(body[start:i+1]); start = None
    out = []
    for p in polys:
        # Strip outer + inner parens: ((x y z, ...), (hole, ...))
        pm = re.match(r"\s*\(\s*\((.*?)\)", p, flags=re.S)
        if not pm: continue
        vs = []
        for tok in pm.group(1).split(','):
            parts = tok.strip().split()
            if len(parts) >= 3:
                vs.append([float(parts[0]), float(parts[1]), float(parts[2])])
        if len(vs) >= 3:
            arr = np.array(vs, dtype=float)
            out.append({"verts_m": arr, "outer_xy_m": arr[:, :2]})
    return out


def polygon_area_2d(xy):
    n = len(xy)
    if n < 3: return 0.0
    a = 0.0
    for i in range(n):
        j = (i + 1) % n
        a += xy[i, 0] * xy[j, 1] - xy[j, 0] * xy[i, 1]
    return abs(a) / 2.0


def plane_pitch_from_verts(verts_m):
    """Least-squares plane fit to polygon vertices -> pitch in deg, normal nz."""
    c = verts_m.mean(axis=0)
    _, _, vh = np.linalg.svd(verts_m - c, full_matrices=False)
    n = vh[-1]
    if n[2] < 0: n = -n
    pitch_deg = float(np.rad2deg(np.arccos(min(1.0, abs(n[2])))))
    return pitch_deg, float(n[2])


def utm18_to_ll(x_m, y_m):
    """EPSG:26918 meters -> WGS84 lat/lng. Requires pyproj."""
    from pyproj import Transformer
    t = Transformer.from_crs("EPSG:26918", "EPSG:4326", always_xy=True)
    lng, lat = t.transform(x_m, y_m)
    return lat, lng


def iter_rows(csv_path, encoding="utf-8", max_field_size=2**31 - 1):
    csv.field_size_limit(max_field_size)
    with open(csv_path, "r", encoding=encoding, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def is_roof_plane(verts_m, nz, z_ground_threshold=0.5):
    """Roof = not a wall (|nz| > ROOF_NZ_MIN), not the floor (min_z above ground).
    brep includes walls (nz~0), floor (z~0 everywhere), and roof planes (nz>0.3, z elevated).
    """
    ROOF_NZ_MIN = 0.20   # up to ~78 deg pitch; walls have nz<0.1
    if abs(nz) < ROOF_NZ_MIN:
        return False
    z_min = float(verts_m[:, 2].min())
    z_max = float(verts_m[:, 2].max())
    # Floor plane: z_max close to ground (all vertices at z=0 in the data)
    if z_max < z_ground_threshold:
        return False
    return True


def scan_buildingparts(dump_dir, want_per_class, min_sqft, max_sqft, exclude_fks=None):
    """First pass: pick fk_buildings by class + footprint size.
    exclude_fks: iterable of fk_buildings to skip (defensive re-pick guard)."""
    bp_path = Path(dump_dir) / "roofn3d_buildingparts.csv"
    buckets = {c: [] for c in PITCHED_CLASSES}
    exclude_set = set(str(x) for x in (exclude_fks or []))
    for row in iter_rows(bp_path):
        cls = (row.get("class") or "").strip()
        if cls not in PITCHED_CLASSES: continue
        fk_probe = row.get("fk_buildings") or row.get("fk_building") or row.get("id")
        if fk_probe and str(fk_probe) in exclude_set: continue
        polys = parse_wkt_multipolygon_z(row.get("brep", ""))
        if not polys: continue
        # Filter to roof planes only (brep includes walls + floor)
        roof_polys = []
        for p in polys:
            pitch_deg, nz = plane_pitch_from_verts(p["verts_m"])
            if is_roof_plane(p["verts_m"], nz):
                roof_polys.append((p, pitch_deg, nz))
        if not roof_polys:
            continue
        # Footprint = floor polygon (z~0) if present, else XY bbox of roof polys.
        floor_poly = None
        for p in polys:
            if float(p["verts_m"][:, 2].max()) < 0.5:
                floor_poly = p
                break
        if floor_poly is not None:
            total_sqft = polygon_area_2d(floor_poly["outer_xy_m"]) * (MET_TO_FTUS ** 2)
            fp_xy_m = floor_poly["outer_xy_m"]
        else:
            all_xy = np.vstack([p["outer_xy_m"] for p, _, _ in roof_polys])
            minx, miny = all_xy.min(axis=0)
            maxx, maxy = all_xy.max(axis=0)
            total_sqft = (maxx - minx) * (maxy - miny) * (MET_TO_FTUS ** 2)
            fp_xy_m = np.array([[minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy]])
        fp_xy_m_cache = fp_xy_m  # stash in gt dict below
        if total_sqft < min_sqft or total_sqft > max_sqft: continue
        fk = row.get("fk_buildings") or row.get("fk_building") or row.get("id")
        # per-plane GT from roof polys only
        planes_gt = []
        for i, (p, pitch_deg, nz) in enumerate(roof_polys):
            horiz_sqft = polygon_area_2d(p["outer_xy_m"]) * (MET_TO_FTUS ** 2)
            planes_gt.append({
                "id": i, "pitch_deg": round(pitch_deg, 2),
                "pitch_ratio_over_12": round(12 * np.tan(np.deg2rad(pitch_deg)), 2),
                "horiz_area_sqft": round(horiz_sqft, 1),
                "nz": round(nz, 4),
                # 396d line-derivation: preserve roof-polygon vertex array in UTM-18N meters.
                # Used by scripts/roofn3d_line_derive.py for shared-vertex edge detection.
                "verts_m": p["verts_m"].tolist(),
            })
        try:
            fp_ll = [list(utm18_to_ll(x, y))[::-1] for x, y in fp_xy_m]  # [lng, lat]
        except Exception:
            fp_ll = None
        seed_x, seed_y = float(fp_xy_m[:, 0].mean()), float(fp_xy_m[:, 1].mean())
        try:
            seed_lat, seed_lng = utm18_to_ll(seed_x, seed_y)
        except Exception:
            seed_lat = seed_lng = None
        gt = {
            "fk_buildings": fk,
            "roof_type": cls,
            "plane_count": len(planes_gt),
            "footprint_sqft": round(total_sqft, 1),
            "planes": planes_gt,
            "footprint_polygon_ll": fp_ll,
            "seed_lat": seed_lat,
            "seed_lng": seed_lng,
            "seed_utm18_x_m": seed_x,
            "seed_utm18_y_m": seed_y,
            "_fp_xy_m": fp_xy_m_cache.tolist(),
        }
        buckets[cls].append(gt)
        # Early-exit: stop once all buckets full
        if all(len(buckets[c]) >= want_per_class.get(c, 0) for c in PITCHED_CLASSES):
            break
    return buckets


def extract_building_points(dump_dir, target_fks):
    """Second pass: stream buildings.csv, extract point clouds for target_fks."""
    bd_path = Path(dump_dir) / "roofn3d_buildings.csv"
    remaining = set(str(x) for x in target_fks)
    results = {}
    for row in iter_rows(bd_path):
        rid = str(row.get("id") or row.get("fk_buildings") or "")
        if rid not in remaining: continue
        # Point cloud column: try common names
        pts_field = None
        for key in ("points", "point_cloud", "pcd", "wkt", "geom"):
            if key in row and row[key]:
                pts_field = row[key]; break
        if pts_field is None:
            # Try any column with MULTIPOINT or POINTCLOUD signature
            for k, v in row.items():
                if v and ("MULTIPOINT" in v or "POINT" in v or "LINESTRING" in v):
                    pts_field = v; break
        if pts_field is None: continue
        pts = parse_points_field(pts_field)
        if pts is None or len(pts) < 50: continue
        results[rid] = pts
        remaining.discard(rid)
        if not remaining: break
    return results


def parse_points_field(field):
    """Parse either MULTIPOINT Z(...) WKT or a raw '(x,y,z),(x,y,z),...' list."""
    s = field.strip()
    m = re.match(r"MULTIPOINT\s*Z\s*\(\s*(.*)\s*\)\s*$", s, flags=re.I | re.S)
    if m:
        s = m.group(1)
    # Strip outer parens
    s = s.strip()
    if s.startswith("(") and s.endswith(")"):
        s = s[1:-1]
    # Split points by ',' at depth 0 of parens
    pts = []
    depth = 0; start = 0
    for i, ch in enumerate(s):
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        elif ch == ',' and depth == 0:
            pts.append(s[start:i]); start = i + 1
    pts.append(s[start:])
    out = []
    for p in pts:
        p = p.strip().strip('()').strip()
        parts = p.split()
        if len(parts) >= 3:
            try:
                out.append([float(parts[0]), float(parts[1]), float(parts[2])])
            except ValueError:
                continue
    return np.array(out, dtype=float) if out else None


def write_faux_ftus_laz(points_m, out_path, offset_x_ftus=0.0, offset_y_ftus=0.0):
    """Convert UTM meters -> US survey feet, re-center near origin, write LAS
    with EPSG:6438 (FL E ftUS) CRS stamp so Pipeline A's CRS assertion passes.
    All geometry is preserved; geolocation is fake."""
    import laspy
    pts_ft = points_m * MET_TO_FTUS
    # Re-center so coordinates are small-ish (LAZ scale/offset tolerances)
    cx, cy = pts_ft[:, 0].mean(), pts_ft[:, 1].mean()
    pts_ft[:, 0] -= cx - offset_x_ftus
    pts_ft[:, 1] -= cy - offset_y_ftus
    header = laspy.LasHeader(point_format=6, version="1.4")
    header.scales = np.array([0.01, 0.01, 0.01])
    header.offsets = np.array([pts_ft[:, 0].min(), pts_ft[:, 1].min(), pts_ft[:, 2].min()])
    # Stamp EPSG:6438 in header via WKT VLR
    wkt = (
        'PROJCS["NAD83(2011) / Florida East (ftUS)",'
        'GEOGCS["NAD83(2011)",DATUM["NAD83 (National Spatial Reference System 2011)",'
        'SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],'
        'UNIT["degree",0.0174532925199433]],'
        'PROJECTION["Transverse_Mercator"],'
        'PARAMETER["latitude_of_origin",24.33333333333333],'
        'PARAMETER["central_meridian",-80.99999999999999],'
        'PARAMETER["scale_factor",0.999941177],'
        'PARAMETER["false_easting",656166.667],'
        'PARAMETER["false_northing",0],'
        'UNIT["US survey foot",0.3048006096012192],'
        'AUTHORITY["EPSG","6438"]]'
    )
    las = laspy.LasData(header)
    las.x = pts_ft[:, 0]
    las.y = pts_ft[:, 1]
    las.z = pts_ft[:, 2]
    # All points classified as building (class 6) — Pipeline A expects class-6 for roof
    las.classification = np.full(len(pts_ft), 6, dtype=np.uint8)
    from laspy.vlrs.known import WktCoordinateSystemVlr
    las.vlrs.append(WktCoordinateSystemVlr(wkt))
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    las.write(str(out_path))
    return cx, cy  # original center in ftUS (for reporting)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    px = sub.add_parser("extract")
    px.add_argument("--dump_dir", required=True)
    px.add_argument("--out_dir", required=True)
    px.add_argument("--n_saddleback", type=int, default=4)
    px.add_argument("--n_hip", type=int, default=4)
    px.add_argument("--n_pyramid", type=int, default=2)
    px.add_argument("--min_footprint_sqft", type=float, default=1500.0)
    px.add_argument("--max_footprint_sqft", type=float, default=6000.0)
    px.add_argument("--exclude_fks", default="",
                    help="Comma-separated fk_buildings to skip (defensive re-pick guard)")

    args = ap.parse_args()
    if args.cmd != "extract":
        raise SystemExit(f"unknown cmd {args.cmd}")
    exclude_fks = [x.strip() for x in args.exclude_fks.split(",") if x.strip()]

    out_dir = Path(args.out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "buildings").mkdir(exist_ok=True)

    want = {
        "Saddleback roof": args.n_saddleback,
        "Two-sided hip roof": args.n_hip,
        "Pyramid roof": args.n_pyramid,
    }
    print(f"[1/3] Scanning buildingparts.csv for {want} in {args.min_footprint_sqft}-{args.max_footprint_sqft} sqft")
    t0 = time.time()
    buckets = scan_buildingparts(args.dump_dir, want, args.min_footprint_sqft, args.max_footprint_sqft,
                                 exclude_fks=exclude_fks)
    for c, lst in buckets.items():
        print(f"  {c}: {len(lst)} candidates (want {want[c]})")
    # Trim each bucket
    selected = []
    for c, n in want.items():
        selected.extend(buckets[c][:n])
    target_fks = [s["fk_buildings"] for s in selected]
    print(f"  total selected: {len(selected)} ({time.time()-t0:.1f}s)")

    print(f"[2/3] Extracting point clouds from buildings.csv")
    t1 = time.time()
    pt_map = extract_building_points(args.dump_dir, target_fks)
    print(f"  got {len(pt_map)}/{len(target_fks)} point clouds ({time.time()-t1:.1f}s)")

    print(f"[3/3] Writing LAZ + GT sidecar per building")
    selection_log = []
    for gt in selected:
        fk = gt["fk_buildings"]
        pts = pt_map.get(str(fk))
        if pts is None:
            print(f"  skip {fk}: no points")
            continue
        laz_path = out_dir / "buildings" / f"bldg_{fk}.laz"
        gt_path = out_dir / "buildings" / f"bldg_{fk}.gt.json"
        try:
            cx, cy = write_faux_ftus_laz(pts, laz_path)
        except Exception as e:
            print(f"  ERR {fk}: {e}")
            continue
        gt["n_points"] = int(len(pts))
        gt["laz_path"] = str(laz_path)
        # Emit a faux-ftUS XY footprint so Pipeline A (with --footprint_xy_json) can
        # skip the Overpass+CRS reprojection path. Same origin shift as LAZ write.
        fp_xy_m = np.array(gt["_fp_xy_m"])
        fp_xy_ftus = fp_xy_m * MET_TO_FTUS
        fp_xy_ftus[:, 0] -= cx
        fp_xy_ftus[:, 1] -= cy
        fp_json_path = out_dir / "buildings" / f"bldg_{fk}.footprint.xy.json"
        fp_json_path.write_text(json.dumps({
            "crs": "EPSG:6438 (faux, ftUS)",
            "polygon_xy_ftus": fp_xy_ftus.tolist(),
        }, indent=2))
        gt["footprint_xy_path"] = str(fp_json_path)
        gt.pop("_fp_xy_m", None)
        gt_path.write_text(json.dumps(gt, indent=2, default=str))
        selection_log.append(gt)
        print(f"  wrote {laz_path.name} ({len(pts)} pts, {gt['roof_type']}, {gt['plane_count']} planes, {gt['footprint_sqft']:.0f} sqft)")

    (out_dir / "selection.json").write_text(json.dumps(selection_log, indent=2, default=str))
    print(f"done. {len(selection_log)} buildings in {out_dir}")


if __name__ == "__main__":
    main()
