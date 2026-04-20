#!/usr/bin/env python3
"""
RoofN3D vs Pipeline A comparison report.

Reads selected/buildings/bldg_*.gt.json + selected/tier3-bldg_*.json,
emits a side-by-side table with 🟢/🟡/🔴 verdicts per field.

Tolerance (matches Phase A cross-val framework):
  ≤10% diff → 🟢 high-xval
  10-20% → 🟡 medium
  >20% → 🔴 flag
  Plane count: exact match 🟢, ±1 🟡, ±2+ 🔴

Usage:
  python3 scripts/roofn3d_compare.py --selected_dir .tmp/roofn3d/selected \\
      --out .tmp/calculator-bench/tier3-roofn3d.md
"""
import argparse, json
from pathlib import Path


def verdict_pct(pct):
    a = abs(pct)
    if a <= 10: return "🟢"
    if a <= 20: return "🟡"
    return "🔴"


def verdict_planes(delta):
    if delta == 0: return "🟢"
    if abs(delta) == 1: return "🟡"
    return "🔴"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selected_dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--commit", default="e95d561",
                    help="Pipeline commit hash to stamp in report header")
    args = ap.parse_args()

    sel = Path(args.selected_dir)
    rows = []
    summary = {"plane_match": 0, "plane_total": 0,
               "pitch_green": 0, "pitch_total": 0,
               "horiz_green": 0, "horiz_total": 0,
               "perim_green": 0, "perim_total": 0}
    for gt_path in sorted((sel / "buildings").glob("bldg_*.gt.json")):
        gt = json.loads(gt_path.read_text())
        fk = gt["fk_buildings"]
        a_path = sel / f"tier3-bldg_{fk}.json"
        if not a_path.exists():
            rows.append({"fk": fk, "roof_type": gt["roof_type"], "error": "no Pipeline A output"})
            continue
        a = json.loads(a_path.read_text())
        gt_planes = gt["plane_count"]
        a_planes = a["num_segments"]
        gt_pitch = sum(p["pitch_ratio_over_12"] for p in gt["planes"]) / max(gt_planes, 1)
        a_pitch = (sum(p["pitch_ratio_over_12"] for p in a["segments"]) / a_planes) if a_planes else 0
        gt_horiz = sum(p["horiz_area_sqft"] for p in gt["planes"])
        a_horiz = a["roof_horiz_sqft"]
        # Perimeter: GT doesn't give us a perimeter directly — use footprint_sqft's
        # convex-hull equivalent derived at scan time vs A's alpha-shape perimeter.
        # Skip perim-vs-GT; just report A's number.
        rows.append({
            "fk": fk,
            "roof_type": gt["roof_type"].replace(" roof", ""),
            "footprint_sqft": gt["footprint_sqft"],
            "n_points": gt.get("n_points", 0),
            "gt_planes": gt_planes,
            "a_planes": a_planes,
            "plane_delta": a_planes - gt_planes,
            "plane_verdict": verdict_planes(a_planes - gt_planes),
            "gt_pitch": round(gt_pitch, 2),
            "a_pitch": round(a_pitch, 2),
            "pitch_pct": round(100 * (a_pitch - gt_pitch) / max(gt_pitch, 0.01), 1) if gt_pitch else 0,
            "pitch_verdict": verdict_pct(100 * (a_pitch - gt_pitch) / max(gt_pitch, 0.01)) if gt_pitch else "—",
            "gt_horiz": round(gt_horiz, 0),
            "a_horiz": round(a_horiz, 0),
            "horiz_pct": round(100 * (a_horiz - gt_horiz) / max(gt_horiz, 1), 1),
            "horiz_verdict": verdict_pct(100 * (a_horiz - gt_horiz) / max(gt_horiz, 1)),
            "a_perim_ft": a["roof_perimeter_ft"],
        })
        summary["plane_total"] += 1
        if a_planes - gt_planes == 0: summary["plane_match"] += 1
        summary["pitch_total"] += 1
        if abs(100 * (a_pitch - gt_pitch) / max(gt_pitch, 0.01)) <= 10: summary["pitch_green"] += 1
        summary["horiz_total"] += 1
        if abs(100 * (a_horiz - gt_horiz) / max(gt_horiz, 1)) <= 10: summary["horiz_green"] += 1

    # Write markdown
    lines = [
        "# Tier 3 Pipeline A vs RoofN3D Ground Truth",
        "",
        f"**Pipeline A frozen at:** `{args.commit}`",
        f"**Dataset:** RoofN3D (Wichmann et al. 2018, TU Berlin) — 118k NYC buildings with per-building LiDAR + per-plane GT.",
        f"**Selection:** {summary['plane_total']} residential pitched buildings (saddleback + hip + pyramid), "
        "footprint 1500-6000 sqft (matches FL single-family-home range).",
        "",
        "**Tolerance:** ≤10% → 🟢 high-xval | 10-20% → 🟡 medium | >20% → 🔴 flag. "
        "Plane count: exact → 🟢, ±1 → 🟡, ±2+ → 🔴.",
        "",
        "## Per-building comparison",
        "",
        "| fk | type | sqft | pts | GT planes | A planes | Δ | plane | GT pitch | A pitch | % | pitch | GT horiz | A horiz | % | horiz | A perim |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        if "error" in r:
            lines.append(f"| {r['fk']} | {r['roof_type']} | | | | | | | | | | | | | | | {r['error']} |")
            continue
        lines.append(
            f"| {r['fk']} | {r['roof_type']} | {r['footprint_sqft']:.0f} | {r['n_points']} | "
            f"{r['gt_planes']} | {r['a_planes']} | {r['plane_delta']:+d} | {r['plane_verdict']} | "
            f"{r['gt_pitch']}/12 | {r['a_pitch']}/12 | {r['pitch_pct']:+.1f}% | {r['pitch_verdict']} | "
            f"{r['gt_horiz']:.0f} | {r['a_horiz']:.0f} | {r['horiz_pct']:+.1f}% | {r['horiz_verdict']} | "
            f"{r['a_perim_ft']:.0f}ft |"
        )

    lines += [
        "",
        "## Aggregate",
        "",
        f"- **Plane count match:** {summary['plane_match']}/{summary['plane_total']} exact "
        f"({100*summary['plane_match']//max(summary['plane_total'],1)}%)",
        f"- **Pitch 🟢 (≤10%):** {summary['pitch_green']}/{summary['pitch_total']} "
        f"({100*summary['pitch_green']//max(summary['pitch_total'],1)}%)",
        f"- **Horiz sqft 🟢 (≤10%):** {summary['horiz_green']}/{summary['horiz_total']} "
        f"({100*summary['horiz_green']//max(summary['horiz_total'],1)}%)",
        "",
        "## Notes",
        "",
        "- RoofN3D GT horiz areas are *sum of roof plane areas* (NOT convex-hull footprint). "
        "Pipeline A's `roof_horiz_sqft` is convex hull of all roof points. For single-story "
        "pitched roofs these are nearly identical. Where they differ, GT is slightly smaller "
        "(ridge/valley intersection double-counting), so A > GT by a few percent is expected.",
        "- RoofN3D is NYC. FL-specific effects (deeper eaves, more complex multi-wing plans) "
        "not captured in this bench. FL cross-validation (tiles 1-5) complements this.",
        "- Perimeter GT not directly comparable — RoofN3D emits per-plane polygons, not "
        "building-level perimeter. A's alpha-shape perimeter reported for reference only.",
    ]
    Path(args.out).write_text("\n".join(lines))
    print(f"wrote {args.out}")
    print(f"  plane exact match: {summary['plane_match']}/{summary['plane_total']}")
    print(f"  pitch 🟢: {summary['pitch_green']}/{summary['pitch_total']}")
    print(f"  horiz 🟢: {summary['horiz_green']}/{summary['horiz_total']}")


if __name__ == "__main__":
    main()
