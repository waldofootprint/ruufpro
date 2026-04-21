#!/usr/bin/env python3
"""
396g — Run diagnostic on n=12 eval set in both modes.

Per decisions/396g-scoping.md §§4, 9:
  - n=12 fks frozen: 141, 1054136, 129184, 175628, 19418, 2624, 36947,
                     407, 44573, 547, 80, 7268.
  - Inputs: bench-assets/roofn3d-n20/bldg_<fk>.{laz,footprint.xy.json}
  - GT: .tmp/roofn3d/line-gt/bldg_<fk>.line.json
  - Two modes:
      env-unset             -> .tmp/396g-diag/
      RANSAC_DISABLE_MERGE=1 -> .tmp/396g-diag-nomerge/

Usage:
  python3 scripts/diag-396g-run.py
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

N12_FKS = [
    "141", "1054136", "129184", "175628", "19418", "2624",
    "36947", "407", "44573", "547", "80", "7268",
]

ROOT = Path(__file__).resolve().parent.parent
BENCH_DIR = ROOT / "bench-assets" / "roofn3d-n20"
GT_DIR = ROOT / ".tmp" / "roofn3d" / "line-gt"
DIAG_DEFAULT = ROOT / ".tmp" / "396g-diag"
DIAG_NOMERGE = ROOT / ".tmp" / "396g-diag-nomerge"
DRIVER = ROOT / "scripts" / "diag-396g.py"


def _git_hash() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, text=True,
        ).strip()
    except Exception:
        return "<uncommitted>"


def _run_one(fk: str, out_dir: Path, merge_disabled: bool, commit: str):
    laz = BENCH_DIR / f"bldg_{fk}.laz"
    fp = BENCH_DIR / f"bldg_{fk}.footprint.xy.json"
    gt = GT_DIR / f"bldg_{fk}.line.json"
    if not laz.exists():
        raise SystemExit(f"missing LAZ: {laz}")
    if not fp.exists():
        raise SystemExit(f"missing footprint: {fp}")
    if not gt.exists():
        raise SystemExit(f"missing GT: {gt}")

    out = out_dir / f"bldg_{fk}.diag.json"
    env = os.environ.copy()
    env["DIAG_396G_COMMIT"] = commit
    if merge_disabled:
        env["RANSAC_DISABLE_MERGE"] = "1"
    else:
        env.pop("RANSAC_DISABLE_MERGE", None)

    cmd = [
        sys.executable, str(DRIVER),
        "--fk", fk,
        "--laz", str(laz),
        "--footprint_xy_json", str(fp),
        "--line_gt", str(gt),
        "--out_diag_json", str(out),
    ]
    t0 = time.time()
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    dt = time.time() - t0
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr, file=sys.stderr)
        raise SystemExit(f"diag failed for fk={fk} (merge_disabled={merge_disabled})")
    # print the last line from stdout (summary)
    last = [l for l in res.stdout.splitlines() if l.strip()][-1]
    print(f"  [{dt:5.1f}s] {last}")


def main():
    commit = _git_hash()
    DIAG_DEFAULT.mkdir(parents=True, exist_ok=True)
    DIAG_NOMERGE.mkdir(parents=True, exist_ok=True)

    print(f"[396g-run] harness_commit={commit}")
    print(f"[396g-run] n=12 eval set: {N12_FKS}")

    print(f"\n[396g-run] PASS 1/2  env-unset  -> {DIAG_DEFAULT}")
    for fk in N12_FKS:
        _run_one(fk, DIAG_DEFAULT, merge_disabled=False, commit=commit)

    print(f"\n[396g-run] PASS 2/2  RANSAC_DISABLE_MERGE=1  -> {DIAG_NOMERGE}")
    for fk in N12_FKS:
        _run_one(fk, DIAG_NOMERGE, merge_disabled=True, commit=commit)

    print("\n[396g-run] done. run `python3 scripts/diag-396g-report.py` to aggregate.")


if __name__ == "__main__":
    main()
