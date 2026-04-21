#!/usr/bin/env python3
"""
396d — Compare derived RoofN3D line GT to Pipeline A outputs.

Reads:
  --gt_dir          .tmp/roofn3d/line-gt/bldg_*.line.json   (derived GT)
  --pa_dir          .tmp/roofn3d/selected/tier3-bldg_*.json (Pipeline A)

Writes:
  --out_report      .tmp/calculator-bench/tier3-roofn3d-lines.md

Ship bar 5th field (per-line-type):
  GREEN (10%)  : >=7/10 buildings within |Δ| <= 10%
  YELLOW (20%) : >=7/10 within |Δ| <= 20%
  RED          : anything less

Applied independently to ridge / hip / valley. Buildings where GT length
is 0 for a line-type are excluded from that line-type's denominator
(no meaningful % comparison vs zero).
"""
import argparse, json, subprocess
from pathlib import Path


def pct_delta(pa, gt):
    if gt == 0:
        return None
    return (pa - gt) / gt * 100.0


def grade(rates_within):
    """rates_within = list of |Δ%| values (excluding None). Returns (verdict, n_ok10, n_ok20, n)."""
    n = len(rates_within)
    if n == 0:
        return ("N/A", 0, 0, 0)
    n_ok10 = sum(1 for r in rates_within if r <= 10.0)
    n_ok20 = sum(1 for r in rates_within if r <= 20.0)
    # Ship bar: >=7/10 -> scale proportionally for n != 10
    threshold = 0.7 * n
    if n_ok10 >= threshold:
        verdict = "🟢"
    elif n_ok20 >= threshold:
        verdict = "🟡"
    else:
        verdict = "🔴"
    return (verdict, n_ok10, n_ok20, n)


def try_git_hash():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], text=True
        ).strip()
    except Exception:
        return "<uncommitted>"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gt_dir", required=True)
    ap.add_argument("--pa_dir", required=True)
    ap.add_argument("--out_report", required=True)
    args = ap.parse_args()

    gt_dir = Path(args.gt_dir)
    pa_dir = Path(args.pa_dir)
    out_path = Path(args.out_report)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    gt_paths = sorted(gt_dir.glob("bldg_*.line.json"))
    if not gt_paths:
        raise SystemExit(f"no line GT in {gt_dir}")

    rows = []
    missing_pa = []
    for p in gt_paths:
        gt = json.loads(p.read_text())
        fk = gt["fk_buildings"]
        pa_path = pa_dir / f"tier3-bldg_{fk}.json"
        if not pa_path.exists():
            missing_pa.append(fk)
            continue
        pa = json.loads(pa_path.read_text())
        row = {
            "fk": str(fk),
            "roof_type": gt.get("roof_type", "?"),
            "gt_ridge": gt["ridge_length_ft"],
            "pa_ridge": pa.get("ridge_length_ft", 0),
            "gt_hip": gt["hip_length_ft"],
            "pa_hip": pa.get("hip_length_ft", 0),
            "gt_valley": gt["valley_length_ft"],
            "pa_valley": pa.get("valley_length_ft", 0),
        }
        row["d_ridge"] = pct_delta(row["pa_ridge"], row["gt_ridge"])
        row["d_hip"] = pct_delta(row["pa_hip"], row["gt_hip"])
        row["d_valley"] = pct_delta(row["pa_valley"], row["gt_valley"])
        rows.append(row)

    # Per-line-type grading (GT>0 only)
    ridge_abs = [abs(r["d_ridge"]) for r in rows if r["d_ridge"] is not None]
    hip_abs = [abs(r["d_hip"]) for r in rows if r["d_hip"] is not None]
    valley_abs = [abs(r["d_valley"]) for r in rows if r["d_valley"] is not None]

    ridge_verdict = grade(ridge_abs)
    hip_verdict = grade(hip_abs)
    valley_verdict = grade(valley_abs)

    # Render
    lines = []
    lines.append("# Tier 3 — RoofN3D line comparison (396d derivation)\n")
    lines.append(f"**Harness commit:** `{try_git_hash()}`  ")
    lines.append(f"**Derived GT dir:** `{gt_dir}`  ")
    lines.append(f"**Pipeline A dir:** `{pa_dir}` (frozen Phase A; env-unset reproduces `e95d561` per BL smoke #1)  ")
    lines.append(f"**Buildings compared:** {len(rows)} / {len(gt_paths)}\n")
    if missing_pa:
        lines.append(f"> ⚠️ Missing Pipeline A outputs for fks: {missing_pa}\n")

    lines.append("## Per-building Δ vs derived GT\n")
    lines.append("| fk | roof_type | GT ridge | PA ridge | Δ ridge % | GT hip | PA hip | Δ hip % | GT valley | PA valley | Δ valley % |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for r in rows:
        def fmt_d(d):
            return f"{d:+.1f}%" if d is not None else "—"
        lines.append(
            f"| {r['fk']} | {r['roof_type']} | {r['gt_ridge']:.1f} | {r['pa_ridge']:.1f} | {fmt_d(r['d_ridge'])} | "
            f"{r['gt_hip']:.1f} | {r['pa_hip']:.1f} | {fmt_d(r['d_hip'])} | "
            f"{r['gt_valley']:.1f} | {r['pa_valley']:.1f} | {fmt_d(r['d_valley'])} |"
        )

    lines.append("\n## Aggregate — ship bar 5th field (per line type)\n")
    lines.append("Grading: 🟢 ≥70% within ±10% | 🟡 ≥70% within ±20% | 🔴 below that. GT=0 excluded.\n")
    lines.append("| line type | n (GT>0) | ≤10% | ≤20% | verdict |")
    lines.append("|---|---:|---:|---:|:-:|")
    for label, v in (("ridge", ridge_verdict), ("hip", hip_verdict), ("valley", valley_verdict)):
        verdict, n10, n20, n = v
        lines.append(f"| {label} | {n} | {n10} | {n20} | {verdict} |")

    # Combined ship-bar 5th-field verdict: worst of the three
    present = [v for label, v in (("ridge", ridge_verdict), ("hip", hip_verdict), ("valley", valley_verdict)) if v[3] > 0]
    order = {"🔴": 0, "🟡": 1, "🟢": 2, "N/A": 3}
    if present:
        overall = min(present, key=lambda v: order.get(v[0], 3))[0]
    else:
        overall = "N/A"
    lines.append(f"\n**Ship bar 5th field (ridge/hip/valley lengths): {overall}**\n")

    # Notes
    lines.append("## Notes\n")
    lines.append("- Derivation: shared roof-polygon vertices (1 mm rounding) → edges → dz classification (ridge < 0.1 m, else hip).")
    lines.append("- RoofN3D n=20 archetype set (saddleback + two-sided hip + pyramid) contains no valleys by construction; valley row is expected 🟩 empty.")
    lines.append("- Pipeline A ridge/hip/valley are summed over `intersections_detail.{ridge,hip,valley}` segments, produced at frozen Phase A (e95d561 defaults reproduced byte-identically under env-unset per BL close §3).")

    out_path.write_text("\n".join(lines) + "\n")
    print(f"report: {out_path}")
    print(f"ridge={ridge_verdict[0]} hip={hip_verdict[0]} valley={valley_verdict[0]} overall={overall}")


if __name__ == "__main__":
    main()
