#!/usr/bin/env python3
"""
Enrich n=20 RoofN3D sidecars in-place with roof-polygon vertex arrays.

For each existing gt.json in --sidecar_dir, streams roofn3d_buildingparts.csv,
re-parses polygons with the SAME roof-plane filter as the adapter, and rewrites
the sidecar with `planes[i]["verts_m"]` appended. Preserves pinned n=20 fks
(no re-selection; plane ordering identical because code path is shared).

Usage:
  python3 scripts/roofn3d_enrich_verts.py \
      --dump_dir .tmp/roofn3d/roofn3d_raw_data \
      --sidecar_dir bench-assets/roofn3d-n20
"""
import argparse, json, sys
from pathlib import Path

# Reuse adapter's parsers + filters so ordering / acceptance is byte-identical.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from roofn3d_adapter import (
    iter_rows, parse_wkt_multipolygon_z, plane_pitch_from_verts, is_roof_plane,
    PITCHED_CLASSES,
)


def enrich(dump_dir: Path, sidecar_dir: Path):
    gt_paths = sorted(sidecar_dir.glob("bldg_*.gt.json"))
    # Skip footprint.xy.json matches
    gt_paths = [p for p in gt_paths if p.name.endswith(".gt.json")]
    if not gt_paths:
        raise SystemExit(f"no gt.json in {sidecar_dir}")
    by_fk = {}
    for p in gt_paths:
        gt = json.loads(p.read_text())
        by_fk[str(gt["fk_buildings"])] = (p, gt)
    print(f"[1/2] enrich target: {len(by_fk)} pinned fks")

    bp_path = dump_dir / "roofn3d_buildingparts.csv"
    found = 0
    remaining = set(by_fk.keys())
    for row in iter_rows(bp_path):
        cls = (row.get("class") or "").strip()
        if cls not in PITCHED_CLASSES:
            continue
        fk = row.get("fk_buildings") or row.get("fk_building") or row.get("id")
        fk = str(fk) if fk is not None else ""
        if fk not in remaining:
            continue
        polys = parse_wkt_multipolygon_z(row.get("brep", ""))
        roof_polys = []
        for p in polys:
            pitch_deg, nz = plane_pitch_from_verts(p["verts_m"])
            if is_roof_plane(p["verts_m"], nz):
                roof_polys.append((p, pitch_deg, nz))
        gt_path, gt = by_fk[fk]
        if len(roof_polys) != len(gt["planes"]):
            print(f"  WARN {fk}: roof_polys={len(roof_polys)} vs gt.planes={len(gt['planes'])} — SKIP")
            remaining.discard(fk)
            continue
        # Plane ordering is the same code path as adapter's scan_buildingparts,
        # so roof_polys[i] corresponds to gt['planes'][i].
        for i, (p, _pitch, _nz) in enumerate(roof_polys):
            gt["planes"][i]["verts_m"] = p["verts_m"].tolist()
        gt_path.write_text(json.dumps(gt, indent=2, default=str))
        found += 1
        remaining.discard(fk)
        if not remaining:
            break
    print(f"[2/2] enriched {found}/{len(by_fk)} sidecars")
    if remaining:
        print(f"  MISSING from CSV: {sorted(remaining)}")
        raise SystemExit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dump_dir", required=True)
    ap.add_argument("--sidecar_dir", required=True)
    args = ap.parse_args()
    enrich(Path(args.dump_dir), Path(args.sidecar_dir))


if __name__ == "__main__":
    main()
