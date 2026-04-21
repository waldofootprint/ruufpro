#!/usr/bin/env python3
"""
396d — Derive ridge/hip/valley GT from RoofN3D enriched sidecars.

Algorithm (per decisions/396d-ridge-hip-valley-decision.md):
  - Round each roof-polygon vertex to 1 mm (3 dp in meters) -> coord key.
  - For every unordered pair (i, j) of roof polygons, intersect their
    coord-key sets. If |intersection| >= 2, the two endpoints of the edge
    are the 2 vertices farthest apart in that intersection (covers the
    common case of exactly 2 shared verts AND the rare case of >2).
  - Classify by dz = |endpoint_a.z - endpoint_b.z|:
        dz < 0.1 m -> ridge (horizontal)
        dz >= 0.1 m -> hip (RoofN3D n=20 archetype set has no valleys;
                           saddleback / two-sided hip / pyramid only)
  - Edge length = 3D euclidean distance between endpoints, in meters,
    converted to US survey feet (adapter's MET_TO_FTUS = 3.2808333...).

Input:
  bench-assets/roofn3d-n20/bldg_<fk>.gt.json (enriched with planes[i].verts_m)

Output:
  .tmp/roofn3d/line-gt/bldg_<fk>.line.json
"""
import argparse, json
from itertools import combinations
from pathlib import Path

MET_TO_FTUS = 3.2808333333333333
COORD_DP = 3           # 1 mm rounding
DZ_RIDGE_M = 0.1       # ridge/hip split (per decision doc)


def coord_key(v):
    return (round(v[0], COORD_DP), round(v[1], COORD_DP), round(v[2], COORD_DP))


def edge_from_shared(shared_verts):
    """Given >=2 vertex tuples, return (a, b) = the 2 most distant.
    For exactly 2, that's just the pair.
    """
    if len(shared_verts) == 2:
        return shared_verts[0], shared_verts[1]
    best = None
    best_d2 = -1.0
    for a, b in combinations(shared_verts, 2):
        d2 = (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2
        if d2 > best_d2:
            best_d2 = d2
            best = (a, b)
    return best


def derive_lines(gt):
    planes = gt.get("planes", [])
    # Build coord-key -> original-vertex maps per plane
    plane_keys = []
    plane_vert_lookup = []
    for pl in planes:
        verts = pl.get("verts_m")
        if not verts:
            plane_keys.append(set())
            plane_vert_lookup.append({})
            continue
        lookup = {}
        keys = set()
        for v in verts:
            k = coord_key(v)
            keys.add(k)
            lookup.setdefault(k, tuple(float(x) for x in v))
        plane_keys.append(keys)
        plane_vert_lookup.append(lookup)

    edges = []
    for i, j in combinations(range(len(planes)), 2):
        shared_keys = plane_keys[i] & plane_keys[j]
        if len(shared_keys) < 2:
            continue
        # Recover original coords from plane i's lookup (both planes share the
        # vertex so either side works to sub-mm; pick i's for determinism).
        shared_verts = [plane_vert_lookup[i][k] for k in shared_keys]
        a, b = edge_from_shared(shared_verts)
        dx = a[0] - b[0]; dy = a[1] - b[1]; dz = a[2] - b[2]
        length_m = (dx*dx + dy*dy + dz*dz) ** 0.5
        length_ft = length_m * MET_TO_FTUS
        adz = abs(dz)
        line_type = "ridge" if adz < DZ_RIDGE_M else "hip"
        edges.append({
            "planes": [i, j],
            "type": line_type,
            "dz_m": round(adz, 4),
            "length_m": round(length_m, 4),
            "length_ft": round(length_ft, 2),
            "endpoints_m": [list(a), list(b)],
            "shared_vert_count": len(shared_keys),
        })

    ridge_ft = sum(e["length_ft"] for e in edges if e["type"] == "ridge")
    hip_ft = sum(e["length_ft"] for e in edges if e["type"] == "hip")
    valley_ft = 0.0  # dataset archetypes (saddleback / hip / pyramid) have none.
    return {
        "fk_buildings": gt.get("fk_buildings"),
        "roof_type": gt.get("roof_type"),
        "plane_count_gt": len(planes),
        "edge_count": len(edges),
        "ridge_length_ft": round(ridge_ft, 2),
        "hip_length_ft": round(hip_ft, 2),
        "valley_length_ft": round(valley_ft, 2),
        "edges": edges,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sidecar_dir", required=True)
    ap.add_argument("--out_dir", required=True)
    args = ap.parse_args()

    sidecar_dir = Path(args.sidecar_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    gt_paths = sorted(sidecar_dir.glob("bldg_*.gt.json"))
    if not gt_paths:
        raise SystemExit(f"no sidecars in {sidecar_dir}")

    total = 0
    for p in gt_paths:
        gt = json.loads(p.read_text())
        if not any("verts_m" in pl for pl in gt.get("planes", [])):
            print(f"  SKIP {p.name}: no verts_m (enrichment missing)")
            continue
        result = derive_lines(gt)
        out_path = out_dir / f"bldg_{result['fk_buildings']}.line.json"
        out_path.write_text(json.dumps(result, indent=2, default=str))
        total += 1
        print(f"  {p.name}: {result['edge_count']} edges | ridge={result['ridge_length_ft']}ft hip={result['hip_length_ft']}ft valley={result['valley_length_ft']}ft")
    print(f"wrote {total} line-gt files to {out_dir}")


if __name__ == "__main__":
    main()
