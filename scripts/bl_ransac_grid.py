#!/usr/bin/env python3
"""
BL RANSAC tuning grid driver.

Runs Pipeline A (scripts/lidar-tier3-geometry.py) across a joint 4-variable
parameter grid. Per cell: executes Pipeline A on the n=20 RoofN3D eval set +
FL tile1 + FL tile3 via subprocess, capturing the JSON outputs.

Env-var overrides (read at module-load by lidar-tier3-geometry.py):
  RANSAC_THRESHOLD_FT_OVERRIDE
  RANSAC_MIN_INLIERS_OVERRIDE
  MERGE_ANGLE_DEG_OVERRIDE
  MERGE_OFFSET_FT_OVERRIDE

Defaults in lidar-tier3-geometry.py equal Phase A (e95d561) values exactly:
  0.49 ft / 50 / 5.0 deg / 0.98 ft.
Env unset => Phase A behavior identical (reproducibility smoke gate).

Usage:
  python3 scripts/bl_ransac_grid.py \\
      --eval_dir bench-assets/roofn3d-n20 \\
      --tile1_laz .tmp/lidar-spike/tiles/tile1.laz \\
      --tile1_fp  bench-assets/fl-tiles/ms-footprint-1.geojson \\
      --tile3_laz .tmp/lidar-spike/tiles/tile3.laz \\
      --tile3_fp  bench-assets/fl-tiles/ms-footprint-3.geojson \\
      --out_dir   .tmp/bl-grid \\
      [--smoke]   # run ONE cell at Phase A defaults, Phase A 10 bldgs only
      [--threshold_m 0.12,0.15,0.18,0.22,0.27] \\  # METERS per scoping §4
      [--min_inliers_mul 0.75,1.0,1.5] \\
      [--merge_angle_deg 5.0,6.0,7.0] \\
      [--merge_offset_ft 0.98,1.47,1.96] \\
      [--parallel N]
"""
import argparse, hashlib, itertools, json, os, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TIER3 = REPO / "scripts" / "lidar-tier3-geometry.py"

# Phase A frozen set — for --smoke. Matches .tmp/calculator-bench/tier3-roofn3d.md.
PHASE_A_FKS = ["22", "80", "141", "144", "207", "395", "407", "547", "129184", "175628"]

# Phase A defaults — MUST match lidar-tier3-geometry.py module-load defaults exactly.
PHASE_A_DEFAULTS = {
    "RANSAC_THRESHOLD_FT_OVERRIDE": "0.49",
    "RANSAC_MIN_INLIERS_OVERRIDE": "50",
    "MERGE_ANGLE_DEG_OVERRIDE": "5.0",
    "MERGE_OFFSET_FT_OVERRIDE": "0.98",
}
PHASE_A_MIN_INLIERS = 50


def parse_float_list(s):
    return [float(x.strip()) for x in s.split(",") if x.strip()]


def cell_id(cfg):
    """Deterministic 12-char hex id for a config tuple."""
    key = json.dumps(cfg, sort_keys=True).encode()
    return hashlib.sha1(key).hexdigest()[:12]


METERS_TO_FTUS = 3.28084


def build_env(cfg):
    """cfg: dict with threshold_m (scoping §4 spec), min_inliers, merge_angle_deg, merge_offset_ft.
    threshold_m is converted to feet at env-set time (the constant in lidar-tier3-geometry.py
    is stored in feet but scoping §4 specifies meters). Fix for unit-bug detour BL 2026-04-21."""
    env = os.environ.copy()
    env["RANSAC_THRESHOLD_FT_OVERRIDE"] = f"{cfg['threshold_m'] * METERS_TO_FTUS:.4f}"
    env["RANSAC_MIN_INLIERS_OVERRIDE"] = str(int(cfg["min_inliers"]))
    env["MERGE_ANGLE_DEG_OVERRIDE"] = f"{cfg['merge_angle_deg']:.4f}"
    env["MERGE_OFFSET_FT_OVERRIDE"] = f"{cfg['merge_offset_ft']:.4f}"
    # Pin BLAS threads to match BH determinism rule (feedback_freeze_code_before_reports).
    env["OPENBLAS_NUM_THREADS"] = "1"
    env["MKL_NUM_THREADS"] = "1"
    env["OMP_NUM_THREADS"] = "1"
    return env


def run_pipeline_a(laz_path, footprint_path, env, out_json, address_label=None,
                   is_roofn3d=False, crs_epsg=None, timeout=180):
    """Invoke lidar-tier3-geometry.py. Returns (ok, elapsed_s, err_msg)."""
    cmd = ["python3", str(TIER3), str(laz_path)]
    if is_roofn3d:
        cmd += ["--footprint_xy_json", str(footprint_path)]
    else:
        cmd += ["--footprint_geojson", str(footprint_path)]
    if address_label:
        cmd += ["--address_label", address_label]
    if crs_epsg:
        cmd += ["--crs_epsg", str(crs_epsg)]
    t0 = time.time()
    try:
        r = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return False, time.time() - t0, f"timeout after {timeout}s"
    elapsed = time.time() - t0
    if r.returncode != 0:
        return False, elapsed, f"exit {r.returncode}: {r.stderr.strip()[-200:]}"
    # Pipeline A writes its output to <laz.parent.parent>/tier3-<stem>.json
    # Move/copy to out_json for per-cell isolation.
    src = Path(laz_path).parent.parent / f"tier3-{Path(laz_path).stem}.json"
    if not src.exists():
        return False, elapsed, f"expected output not found: {src}"
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_bytes(src.read_bytes())
    return True, elapsed, None


def run_one_building(args_tuple):
    """Worker: run one (cell, building). Tuple unpacked for ProcessPoolExecutor."""
    cfg, kind, fk_or_tile, laz_path, fp_path, out_path, crs_epsg = args_tuple
    env = build_env(cfg)
    label = f"roofn3d_bldg_{fk_or_tile}" if kind == "roofn3d" else f"fl_{fk_or_tile}"
    is_rn3d = (kind == "roofn3d")
    ok, elapsed, err = run_pipeline_a(laz_path, fp_path, env, out_path,
                                       address_label=label, is_roofn3d=is_rn3d,
                                       crs_epsg=crs_epsg)
    return {"cell": cell_id(cfg), "kind": kind, "id": fk_or_tile, "ok": ok,
            "elapsed_s": round(elapsed, 2), "err": err, "out": str(out_path)}


def build_units(cfg, cell_dir, eval_dir, tile1_laz, tile1_fp, tile3_laz, tile3_fp, fks):
    """Return list of (cfg, kind, id, laz_path, fp_path, out_path, crs_epsg) tuples."""
    units = []
    for fk in fks:
        laz = eval_dir / f"bldg_{fk}.laz"
        fp = eval_dir / f"bldg_{fk}.footprint.xy.json"
        out = cell_dir / f"bldg_{fk}.json"
        units.append((cfg, "roofn3d", fk, laz, fp, out, None))
    if tile1_laz is not None:
        units.append((cfg, "fl", "tile1", tile1_laz, tile1_fp,
                      cell_dir / "tile1.json", 6438))
    if tile3_laz is not None:
        units.append((cfg, "fl", "tile3", tile3_laz, tile3_fp,
                      cell_dir / "tile3.json", 6438))
    return units


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval_dir", required=True,
                    help="Pinned n=20 eval set dir (bench-assets/roofn3d-n20)")
    ap.add_argument("--tile1_laz", default=None)
    ap.add_argument("--tile1_fp", default=None)
    ap.add_argument("--tile3_laz", default=None)
    ap.add_argument("--tile3_fp", default=None)
    ap.add_argument("--out_dir", required=True)
    ap.add_argument("--smoke", action="store_true",
                    help="One cell at Phase A defaults, Phase A 10 bldgs only, no FL tiles.")
    ap.add_argument("--threshold_m", default="0.12,0.15,0.18,0.22,0.27",
                    help="RANSAC inlier threshold grid in METERS (scoping §4). "
                         "Converted to feet internally via * 3.28084 for env var.")
    ap.add_argument("--min_inliers_mul", default="0.75,1.0,1.5")
    ap.add_argument("--merge_angle_deg", default="5.0,6.0,7.0")
    ap.add_argument("--merge_offset_ft", default="0.98,1.47,1.96")
    ap.add_argument("--parallel", type=int, default=4)
    args = ap.parse_args()

    eval_dir = Path(args.eval_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    # Build config grid
    if args.smoke:
        # Phase A default 0.49 ft back-converted to meters so build_env * 3.28084
        # reproduces Phase A's 0.49 ft byte-identically. 0.49 / 3.28084 = 0.149353 m.
        configs = [{
            "threshold_m": 0.49 / METERS_TO_FTUS,
            "min_inliers": PHASE_A_MIN_INLIERS,
            "merge_angle_deg": 5.0,
            "merge_offset_ft": 0.98,
        }]
        fks = PHASE_A_FKS
        tile1_laz = tile3_laz = None
        tile1_fp = tile3_fp = None
        print(f"[SMOKE MODE] 1 cell x {len(fks)} Phase A bldgs, no FL tiles")
    else:
        thresholds_m = parse_float_list(args.threshold_m)
        mul_list = parse_float_list(args.min_inliers_mul)
        angles = parse_float_list(args.merge_angle_deg)
        offsets = parse_float_list(args.merge_offset_ft)
        # Unit verification banner — per BL unit-bug correction protocol (advisor 2026-04-21)
        print("=" * 60)
        print("  RANSAC threshold unit-conversion banner (scoping §4 → env)")
        print("  input_m  |  env_ft   |  sanity_m (env_ft / 3.28084)")
        print("  " + "-" * 52)
        for tm in thresholds_m:
            tft = tm * METERS_TO_FTUS
            sanity = tft / METERS_TO_FTUS
            marker = "  <-- Phase A" if abs(tm - 0.15) < 1e-6 else ""
            print(f"  {tm:.4f}   |  {tft:.4f}   |  {sanity:.4f}{marker}")
        print("=" * 60)
        configs = []
        for t, m, a, o in itertools.product(thresholds_m, mul_list, angles, offsets):
            configs.append({
                "threshold_m": t,
                "min_inliers": int(round(PHASE_A_MIN_INLIERS * m)),
                "merge_angle_deg": a,
                "merge_offset_ft": o,
            })
        # All 20 bldgs (Phase A 10 + new 10)
        fks = sorted([p.stem.replace("bldg_", "")
                      for p in eval_dir.glob("bldg_*.laz")])
        if len(fks) != 20:
            print(f"WARN: expected 20 bldgs in {eval_dir}, found {len(fks)}", file=sys.stderr)
        tile1_laz = Path(args.tile1_laz).resolve() if args.tile1_laz else None
        tile1_fp = Path(args.tile1_fp).resolve() if args.tile1_fp else None
        tile3_laz = Path(args.tile3_laz).resolve() if args.tile3_laz else None
        tile3_fp = Path(args.tile3_fp).resolve() if args.tile3_fp else None

    total_cells = len(configs)
    print(f"[grid] {total_cells} configs x {len(fks)} roofn3d bldgs "
          f"+ {int(tile1_laz is not None) + int(tile3_laz is not None)} FL tiles")

    manifest = {"configs": [], "started_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    t_start = time.time()

    # Per-cell dispatch
    for ci, cfg in enumerate(configs):
        cid = cell_id(cfg)
        cell_dir = out_dir / f"cell_{cid}"
        cell_dir.mkdir(parents=True, exist_ok=True)
        (cell_dir / "config.json").write_text(json.dumps(cfg, indent=2))

        units = build_units(cfg, cell_dir, eval_dir, tile1_laz, tile1_fp,
                            tile3_laz, tile3_fp, fks)

        cell_t0 = time.time()
        results = []
        if args.parallel > 1:
            with ProcessPoolExecutor(max_workers=args.parallel) as ex:
                futs = [ex.submit(run_one_building, u) for u in units]
                for fut in as_completed(futs):
                    results.append(fut.result())
        else:
            for u in units:
                results.append(run_one_building(u))

        cell_elapsed = time.time() - cell_t0
        ok_count = sum(1 for r in results if r["ok"])
        (cell_dir / "runs.json").write_text(json.dumps(results, indent=2))
        manifest["configs"].append({
            "cell_id": cid, "config": cfg, "elapsed_s": round(cell_elapsed, 1),
            "ok": ok_count, "total": len(results),
        })
        print(f"[{ci+1}/{total_cells}] cell {cid} | "
              f"{cfg['threshold_m']:.3f}m ({cfg['threshold_m']*METERS_TO_FTUS:.3f}ft) / {cfg['min_inliers']} / "
              f"{cfg['merge_angle_deg']:.1f}° / {cfg['merge_offset_ft']:.2f}ft | "
              f"{ok_count}/{len(results)} ok in {cell_elapsed:.0f}s")

    manifest["total_elapsed_s"] = round(time.time() - t_start, 1)
    manifest["ended_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\n[done] {total_cells} cells in {manifest['total_elapsed_s']}s. "
          f"Manifest: {out_dir/'manifest.json'}")


if __name__ == "__main__":
    main()
