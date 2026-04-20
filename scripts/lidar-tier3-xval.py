#!/usr/bin/env python3
"""
Tier 3 cross-validation comparator.

Reads outputs from Pipeline A (lidar-tier3-geometry.py) and Pipeline B
(lidar-tier3-pipeline-b.py), optionally Pipeline C (PDAL via lidar-tier3-pdal.py),
and produces a per-tile agreement table.

Agreement rule (per Hannah's BG plan):
  - within 10% on a field => high-confidence-xval
  - within 10-20%        => medium-confidence-xval
  - >20%                  => flag — implementation bug or degenerate input

Usage:
  python3 scripts/lidar-tier3-xval.py \
      --a tier3-tile1.json,tier3-tile3.json,tier3-tile4.json,tier3-tile5.json \
      --b tier3b-tile1.json,tier3b-tile3.json,tier3b-tile4.json,tier3b-tile5.json \
      [--c tier3c-tile1.json,...] \
      --out .tmp/calculator-bench/tier3-xval.md
"""
import argparse, json
from pathlib import Path
from statistics import mean

FIELDS = [
    ("roof_horiz_sqft", "Sqft horiz", "pct"),
    ("roof_sloped_sqft_sum", "Sqft sloped", "pct"),
    ("num_segments", "Segments", "diff"),
    ("roof_perimeter_ft", "Perimeter", "pct"),
]


def load_set(paths_csv):
    if not paths_csv: return {}
    return {Path(p).name.split(".")[0].split("-")[-1]: json.loads(Path(p).read_text())
            for p in paths_csv.split(",")}


def pct_diff(a, b):
    if a is None or b is None: return None
    if max(abs(a), abs(b)) == 0: return 0.0
    return 100.0 * 2 * (a - b) / (a + b)


def classify(diff_pct):
    if diff_pct is None: return "—"
    a = abs(diff_pct)
    if a <= 10: return "🟢 high-xval"
    if a <= 20: return "🟡 medium-xval"
    return "🔴 FLAG"


def mean_pitch(d):
    segs = d.get("segments") or []
    if not segs: return None
    vals = [s.get("pitch_ratio_over_12") for s in segs if s.get("pitch_ratio_over_12") is not None]
    return round(mean(vals), 2) if vals else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--a", required=True)
    ap.add_argument("--b", required=True)
    ap.add_argument("--c", default=None)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    A = load_set(args.a); B = load_set(args.b); C = load_set(args.c) if args.c else {}
    tiles = sorted(set(A.keys()) | set(B.keys()) | set(C.keys()))

    lines = ["# Tier 3 Pipeline Cross-Validation",
             "",
             "Agreement rule: ≤10% diff → 🟢 high-xval | 10–20% → 🟡 medium | >20% → 🔴 flag.",
             "",
             "Pipelines:",
             "- **A**: ours — iterative perpendicular-residual RANSAC + plane merge + alpha-shape perimeter",
             "- **B**: independent — local-normal estimation + DBSCAN clustering + sklearn vertical-residual RANSAC + convex-hull perimeter",
             f"- **C**: {'PDAL filters.cluster + filters.smrf' if C else 'not run this pass'}",
             ""]

    flag_summary = []  # (tile, field, diff_pct)
    perfield_diffs = {f[0]: [] for f in FIELDS}
    perfield_diffs["mean_pitch"] = []

    for t in tiles:
        a, b, c = A.get(t), B.get(t), C.get(t)
        lines.append(f"## {t}")
        lines.append("")
        lines.append("| Field | A | B | " + ("C | " if C else "") + "A↔B | " + ("A↔C |" if C else "") + " Verdict |")
        lines.append("|---|---|---|" + ("---|" if C else "") + "---|" + ("---|" if C else "") + "---|")
        for key, label, mode in FIELDS:
            va = a.get(key) if a else None
            vb = b.get(key) if b else None
            vc = c.get(key) if c else None
            if mode == "pct":
                d_ab = pct_diff(va, vb)
                d_ac = pct_diff(va, vc) if vc is not None else None
                d_ab_s = f"{d_ab:+.1f}%" if d_ab is not None else "—"
                d_ac_s = f"{d_ac:+.1f}%" if d_ac is not None else "—"
            else:  # diff
                d_ab = (va - vb) if (va is not None and vb is not None) else None
                d_ac = (va - vc) if (va is not None and vc is not None) else None
                d_ab_s = f"{d_ab:+d}" if d_ab is not None else "—"
                d_ac_s = f"{d_ac:+d}" if d_ac is not None else "—"
                # For verdict use ratio in segment count
                if d_ab is not None and max(va or 0, vb or 0) > 0:
                    d_ab = 100.0 * d_ab / max(abs(va), abs(vb))
            verdict = classify(d_ab)
            row = f"| {label} | {va} | {vb} | "
            if C: row += f"{vc} | "
            row += f"{d_ab_s} | "
            if C: row += f"{d_ac_s} | "
            row += f"{verdict} |"
            lines.append(row)
            if d_ab is not None and abs(d_ab) > 20:
                flag_summary.append((t, label, d_ab))
            if mode == "pct" and d_ab is not None:
                perfield_diffs[key].append(abs(d_ab))

        # Mean pitch comparison
        pa, pb = mean_pitch(a) if a else None, mean_pitch(b) if b else None
        pc = mean_pitch(c) if c else None
        d_pitch = pct_diff(pa, pb)
        verdict_p = classify(d_pitch)
        row = f"| Mean pitch (X/12) | {pa} | {pb} | "
        if C: row += f"{pc} | "
        row += f"{d_pitch:+.1f}%" if d_pitch is not None else "—"
        row += " | "
        if C: row += "—" + " | "
        row += f"{verdict_p} |"
        lines.append(row)
        if d_pitch is not None: perfield_diffs["mean_pitch"].append(abs(d_pitch))
        if d_pitch is not None and abs(d_pitch) > 20:
            flag_summary.append((t, "Mean pitch", d_pitch))
        lines.append("")

    # Aggregate
    lines.append("## Aggregate per-field A↔B agreement")
    lines.append("")
    lines.append("| Field | mean |Δ|% across tiles | Verdict |")
    lines.append("|---|---|---|")
    for key in [f[0] for f in FIELDS] + ["mean_pitch"]:
        diffs = perfield_diffs[key]
        if not diffs:
            lines.append(f"| {key} | no data | — |"); continue
        m = mean(diffs)
        v = classify(m)
        lines.append(f"| {key} | {m:.1f}% | {v} |")
    lines.append("")

    if flag_summary:
        lines.append("## 🔴 Flagged disagreements (>20%)")
        lines.append("")
        for t, f, d in flag_summary:
            lines.append(f"- **{t}** / {f}: {d:+.1f}% — investigate before trusting either pipeline on this field for this address.")
    else:
        lines.append("## ✅ No flagged disagreements (>20%)")

    Path(args.out).write_text("\n".join(lines))
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
