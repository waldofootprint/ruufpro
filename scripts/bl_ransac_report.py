#!/usr/bin/env python3
"""
BL RANSAC tuning grid aggregator.

Reads grid output (from bl_ransac_grid.py) and produces:
  - Hard-reject-filtered cell list (FL guardrails as hard filter, not warning)
  - Deterministic rank: win / partial-win / rejected, with FL-preferred tiebreaker
  - Before/after tables for RoofN3D (plane count, pitch, horiz sqft) + FL guardrails
  - Chosen config (or "ship-as-is")

FL guardrails (from advisor ruling, 2026-04-21) — any breach DROPS the cell:
  - tile1 plane count ∈ [8, 10]
  - tile3 plane count ∈ [10, 14]
  - tile1 + tile3 perimeter Δ (A↔B) ≤ 5% each
  - tile1 + tile3 horiz sqft Δ (A↔B) ≤ 20% each

Baseline = cell at Phase A defaults (0.49 / 50 / 5.0 / 0.98) measured on n=20.
"+15 pp" improvement is vs that baseline.

Tiebreaker (ascending; pre-encoded, not operator pick):
  (FL horiz Δ sum, FL perim Δ sum, FL plane-count centrality |p1-9|+|p3-12|)

Usage:
  python3 scripts/bl_ransac_report.py \\
      --grid_dir .tmp/bl-grid \\
      --eval_dir bench-assets/roofn3d-n20 \\
      --tile1_b_ref .tmp/lidar-spike/tier3b-tile1.json \\
      --tile3_b_ref .tmp/lidar-spike/tier3b-tile3.json \\
      --out .tmp/calculator-bench/bl-ransac-grid-report.md \\
      [--commit <hash>]
"""
import argparse, json
from pathlib import Path
from statistics import mean

METERS_TO_FTUS = 3.28084
# Scoping §4 canonical baseline: 0.15 m (the "current value" cell in the threshold grid).
# Phase A constant is stored as 0.49 ft — a display-rounded version of 0.15 m * 3.28084
# = 0.4921 ft (0.42% higher than 0.49). Smoke gate #2 validates the drift is negligible.
PHASE_A_CFG = {
    "threshold_m": 0.15, "min_inliers": 50,
    "merge_angle_deg": 5.0, "merge_offset_ft": 0.98,
}

# Guardrail bounds
TILE1_PLANES_RANGE = (8, 10)
TILE3_PLANES_RANGE = (10, 14)
PERIM_MAX_PCT = 5.0
HORIZ_MAX_PCT = 20.0

# Win/partial-win criteria
WIN_PP = 15.0


def pct_diff(a, b):
    if a is None or b is None: return None
    denom = max(abs(a) + abs(b), 1e-9) / 2
    return 100.0 * (a - b) / denom


def load_cell(cell_dir):
    cfg = json.loads((cell_dir / "config.json").read_text())
    runs = json.loads((cell_dir / "runs.json").read_text())
    outputs = {}
    for r in runs:
        if not r["ok"]: continue
        try:
            outputs[(r["kind"], r["id"])] = json.loads(Path(r["out"]).read_text())
        except Exception:
            continue
    return cfg, runs, outputs


def mean_pitch_ratio(segments):
    vals = [s.get("pitch_ratio_over_12") for s in segments
            if s.get("pitch_ratio_over_12") is not None]
    return mean(vals) if vals else 0.0


def roofn3d_metrics(outputs, gt_by_fk):
    """Compute per-cell RoofN3D aggregates.

    Returns dict:
      plane_exact_rate, plane_pm1_rate, pitch_g10_rate, horiz_g10_rate, n
    """
    plane_exact = plane_pm1 = pitch_g10 = horiz_g10 = 0
    n = 0
    per_bldg = []
    for fk, gt in gt_by_fk.items():
        out = outputs.get(("roofn3d", fk))
        if out is None: continue
        n += 1
        gt_planes = gt["plane_count"]
        a_planes = out["num_segments"]
        delta = a_planes - gt_planes
        if delta == 0: plane_exact += 1
        if abs(delta) <= 1: plane_pm1 += 1
        gt_pitch = sum(p["pitch_ratio_over_12"] for p in gt["planes"]) / max(gt_planes, 1)
        a_pitch = mean_pitch_ratio(out.get("segments") or [])
        pitch_pct = pct_diff(a_pitch, gt_pitch) if gt_pitch else 0.0
        if abs(pitch_pct) <= 10: pitch_g10 += 1
        gt_horiz = sum(p["horiz_area_sqft"] for p in gt["planes"])
        a_horiz = out["roof_horiz_sqft"]
        horiz_pct = pct_diff(a_horiz, gt_horiz) if gt_horiz else 0.0
        if abs(horiz_pct) <= 10: horiz_g10 += 1
        per_bldg.append({"fk": fk, "gt_planes": gt_planes, "a_planes": a_planes,
                         "delta": delta, "pitch_pct": round(pitch_pct, 2),
                         "horiz_pct": round(horiz_pct, 2)})
    if n == 0:
        return None
    return {
        "n": n,
        "plane_exact_rate": 100 * plane_exact / n,
        "plane_pm1_rate": 100 * plane_pm1 / n,
        "pitch_g10_rate": 100 * pitch_g10 / n,
        "horiz_g10_rate": 100 * horiz_g10 / n,
        "per_bldg": per_bldg,
    }


def fl_metrics(outputs, tile1_b, tile3_b):
    """FL guardrails against frozen Pipeline B reference."""
    t1 = outputs.get(("fl", "tile1"))
    t3 = outputs.get(("fl", "tile3"))
    if t1 is None or t3 is None:
        return None, "missing FL tile output"
    t1_p = t1["num_segments"]
    t3_p = t3["num_segments"]
    t1_peri_pct = pct_diff(t1["roof_perimeter_ft"], tile1_b["roof_perimeter_ft"])
    t3_peri_pct = pct_diff(t3["roof_perimeter_ft"], tile3_b["roof_perimeter_ft"])
    t1_horiz_pct = pct_diff(t1["roof_horiz_sqft"], tile1_b["roof_horiz_sqft"])
    t3_horiz_pct = pct_diff(t3["roof_horiz_sqft"], tile3_b["roof_horiz_sqft"])

    breaches = []
    if not (TILE1_PLANES_RANGE[0] <= t1_p <= TILE1_PLANES_RANGE[1]):
        breaches.append(f"tile1_planes={t1_p} out of {TILE1_PLANES_RANGE}")
    if not (TILE3_PLANES_RANGE[0] <= t3_p <= TILE3_PLANES_RANGE[1]):
        breaches.append(f"tile3_planes={t3_p} out of {TILE3_PLANES_RANGE}")
    if abs(t1_peri_pct) > PERIM_MAX_PCT:
        breaches.append(f"tile1_peri_pct={t1_peri_pct:.1f}% > {PERIM_MAX_PCT}%")
    if abs(t3_peri_pct) > PERIM_MAX_PCT:
        breaches.append(f"tile3_peri_pct={t3_peri_pct:.1f}% > {PERIM_MAX_PCT}%")
    if abs(t1_horiz_pct) > HORIZ_MAX_PCT:
        breaches.append(f"tile1_horiz_pct={t1_horiz_pct:.1f}% > {HORIZ_MAX_PCT}%")
    if abs(t3_horiz_pct) > HORIZ_MAX_PCT:
        breaches.append(f"tile3_horiz_pct={t3_horiz_pct:.1f}% > {HORIZ_MAX_PCT}%")
    m = {
        "t1_planes": t1_p, "t3_planes": t3_p,
        "t1_peri_pct": round(t1_peri_pct, 2), "t3_peri_pct": round(t3_peri_pct, 2),
        "t1_horiz_pct": round(t1_horiz_pct, 2), "t3_horiz_pct": round(t3_horiz_pct, 2),
        "tiebreak_horiz_sum": abs(t1_horiz_pct) + abs(t3_horiz_pct),
        "tiebreak_perim_sum": abs(t1_peri_pct) + abs(t3_peri_pct),
        "tiebreak_plane_centrality": abs(t1_p - 9) + abs(t3_p - 12),
    }
    return m, breaches if breaches else None


def classify(cell_r3d, cell_fl, baseline_r3d):
    """Returns 'win', 'partial', or 'neither'.
    Regression = any of plane_exact / plane_pm1 / pitch_g10 / horiz_g10 dropped.
    """
    if baseline_r3d is None: return "neither"
    def delta(k): return cell_r3d[k] - baseline_r3d[k]
    d_exact = delta("plane_exact_rate")
    d_pm1 = delta("plane_pm1_rate")
    d_pitch = delta("pitch_g10_rate")
    d_horiz = delta("horiz_g10_rate")
    any_regression = (d_exact < 0 or d_pm1 < 0 or d_pitch < 0 or d_horiz < 0)
    if d_exact >= WIN_PP and d_pitch >= WIN_PP and not any_regression:
        return "win"
    # Partial: one metric up ≥+15 pp, no tracked metric regresses
    if any(d >= WIN_PP for d in (d_exact, d_pitch)) and not any_regression:
        return "partial"
    return "neither"


def tiebreak_key(cell):
    fl = cell["fl"]
    return (fl["tiebreak_horiz_sum"], fl["tiebreak_perim_sum"], fl["tiebreak_plane_centrality"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid_dir", required=True)
    ap.add_argument("--eval_dir", required=True)
    ap.add_argument("--tile1_b_ref", required=True)
    ap.add_argument("--tile3_b_ref", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--commit", default="<uncommitted>")
    args = ap.parse_args()

    eval_dir = Path(args.eval_dir)
    gt_by_fk = {}
    for gt_path in sorted(eval_dir.glob("bldg_*.gt.json")):
        gt = json.loads(gt_path.read_text())
        gt_by_fk[str(gt["fk_buildings"])] = gt

    tile1_b = json.loads(Path(args.tile1_b_ref).read_text())
    tile3_b = json.loads(Path(args.tile3_b_ref).read_text())

    cells = []
    for cell_dir in sorted(Path(args.grid_dir).glob("cell_*")):
        cfg, runs, outputs = load_cell(cell_dir)
        r3d = roofn3d_metrics(outputs, gt_by_fk)
        fl, fl_breaches = fl_metrics(outputs, tile1_b, tile3_b)
        cells.append({
            "dir": str(cell_dir), "cfg": cfg, "r3d": r3d,
            "fl": fl, "fl_breaches": fl_breaches,
        })

    # Identify baseline
    baseline = None
    for c in cells:
        if (abs(c["cfg"]["threshold_m"] - PHASE_A_CFG["threshold_m"]) < 1e-6
                and c["cfg"]["min_inliers"] == PHASE_A_CFG["min_inliers"]
                and abs(c["cfg"]["merge_angle_deg"] - PHASE_A_CFG["merge_angle_deg"]) < 1e-6
                and abs(c["cfg"]["merge_offset_ft"] - PHASE_A_CFG["merge_offset_ft"]) < 1e-6):
            baseline = c
            break
    baseline_r3d = baseline["r3d"] if baseline else None

    # Classify + filter
    for c in cells:
        c["classification"] = classify(c["r3d"], c["fl"], baseline_r3d) if c["r3d"] else "neither"
        c["survives_fl"] = (c["fl"] is not None and c["fl_breaches"] is None)

    wins = [c for c in cells if c["classification"] == "win" and c["survives_fl"]]
    partials = [c for c in cells if c["classification"] == "partial" and c["survives_fl"]]
    wins.sort(key=tiebreak_key)
    partials.sort(key=tiebreak_key)

    if wins:
        chosen = wins[0]
        outcome = "WIN"
    elif partials:
        chosen = partials[0]
        outcome = "PARTIAL"
    else:
        chosen = None
        outcome = "SHIP-AS-IS"

    # Write report
    lines = [
        "# BL RANSAC Grid Report",
        "",
        f"**Harness commit:** `{args.commit}`",
        f"**Grid dir:** `{args.grid_dir}`",
        f"**Total cells:** {len(cells)}",
        f"**FL guardrail survivors:** {sum(1 for c in cells if c['survives_fl'])}",
        f"**Wins:** {len(wins)} | **Partial wins:** {len(partials)}",
        f"**Outcome:** {outcome}",
        "",
        "## Baseline (Phase A defaults, n=20 RoofN3D)",
        "",
    ]
    if baseline and baseline_r3d:
        lines += [
            f"- plane_exact_rate: {baseline_r3d['plane_exact_rate']:.1f}% ({int(baseline_r3d['plane_exact_rate'] * baseline_r3d['n'] / 100)}/{baseline_r3d['n']})",
            f"- plane_pm1_rate:   {baseline_r3d['plane_pm1_rate']:.1f}%",
            f"- pitch_g10_rate:   {baseline_r3d['pitch_g10_rate']:.1f}%",
            f"- horiz_g10_rate:   {baseline_r3d['horiz_g10_rate']:.1f}%",
            f"- FL survives: {baseline['survives_fl']}",
        ]
    else:
        lines.append("- BASELINE CELL NOT FOUND — grid is missing Phase A defaults cell. Report invalid.")

    lines += [
        "",
        "## Chosen config",
        "",
    ]
    if chosen:
        c = chosen
        lines += [
            f"- cfg: {json.dumps(c['cfg'])}",
            f"- classification: **{c['classification'].upper()}**",
            f"- r3d: plane_exact {c['r3d']['plane_exact_rate']:.1f}% "
            f"(Δ{c['r3d']['plane_exact_rate'] - baseline_r3d['plane_exact_rate']:+.1f} pp) | "
            f"pitch_g10 {c['r3d']['pitch_g10_rate']:.1f}% "
            f"(Δ{c['r3d']['pitch_g10_rate'] - baseline_r3d['pitch_g10_rate']:+.1f} pp) | "
            f"horiz_g10 {c['r3d']['horiz_g10_rate']:.1f}% "
            f"(Δ{c['r3d']['horiz_g10_rate'] - baseline_r3d['horiz_g10_rate']:+.1f} pp) | "
            f"plane_pm1 {c['r3d']['plane_pm1_rate']:.1f}% "
            f"(Δ{c['r3d']['plane_pm1_rate'] - baseline_r3d['plane_pm1_rate']:+.1f} pp)",
            f"- FL: t1_planes={c['fl']['t1_planes']} t3_planes={c['fl']['t3_planes']} | "
            f"t1_peri_Δ={c['fl']['t1_peri_pct']:+.1f}% t3_peri_Δ={c['fl']['t3_peri_pct']:+.1f}% | "
            f"t1_horiz_Δ={c['fl']['t1_horiz_pct']:+.1f}% t3_horiz_Δ={c['fl']['t3_horiz_pct']:+.1f}%",
            f"- tiebreaker_keys: horiz_sum={c['fl']['tiebreak_horiz_sum']:.2f} "
            f"perim_sum={c['fl']['tiebreak_perim_sum']:.2f} "
            f"plane_centrality={c['fl']['tiebreak_plane_centrality']}",
        ]
    else:
        lines.append("**Ship as-is.** No cell cleared win/partial-win criteria with FL guardrails passing.")
        lines.append("Phase A config stands. 'Tuning doesn't help' is a valid, publishable outcome.")

    lines += [
        "",
        "## Top 5 wins",
        "",
        "| threshold_m | min_inl | merge° | merge_ft | plane_exact | pitch_g10 | horiz_g10 | pm1 | t1_p | t3_p | t1_peri% | t3_peri% | t1_horiz% | t3_horiz% |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for c in wins[:5]:
        cfg = c["cfg"]; r = c["r3d"]; f = c["fl"]
        lines.append(
            f"| {cfg['threshold_m']:.3f} | {cfg['min_inliers']} | {cfg['merge_angle_deg']:.1f} | "
            f"{cfg['merge_offset_ft']:.2f} | {r['plane_exact_rate']:.1f}% | "
            f"{r['pitch_g10_rate']:.1f}% | {r['horiz_g10_rate']:.1f}% | {r['plane_pm1_rate']:.1f}% | "
            f"{f['t1_planes']} | {f['t3_planes']} | {f['t1_peri_pct']:+.2f} | "
            f"{f['t3_peri_pct']:+.2f} | {f['t1_horiz_pct']:+.2f} | {f['t3_horiz_pct']:+.2f} |"
        )
    if not wins:
        lines.append("| — | — | — | — | — | — | — | — | — | — | — | — | — | — |")

    lines += [
        "",
        "## Top 5 partial wins",
        "",
        "| threshold_m | min_inl | merge° | merge_ft | plane_exact | pitch_g10 | horiz_g10 | pm1 | t1_p | t3_p | t1_peri% | t3_peri% | t1_horiz% | t3_horiz% |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for c in partials[:5]:
        cfg = c["cfg"]; r = c["r3d"]; f = c["fl"]
        lines.append(
            f"| {cfg['threshold_m']:.3f} | {cfg['min_inliers']} | {cfg['merge_angle_deg']:.1f} | "
            f"{cfg['merge_offset_ft']:.2f} | {r['plane_exact_rate']:.1f}% | "
            f"{r['pitch_g10_rate']:.1f}% | {r['horiz_g10_rate']:.1f}% | {r['plane_pm1_rate']:.1f}% | "
            f"{f['t1_planes']} | {f['t3_planes']} | {f['t1_peri_pct']:+.2f} | "
            f"{f['t3_peri_pct']:+.2f} | {f['t1_horiz_pct']:+.2f} | {f['t3_horiz_pct']:+.2f} |"
        )
    if not partials:
        lines.append("| — | — | — | — | — | — | — | — | — | — | — | — | — | — |")

    lines += [
        "",
        "## Rejection summary",
        "",
        f"- Total cells: {len(cells)}",
        f"- Passed FL guardrails: {sum(1 for c in cells if c['survives_fl'])}",
        f"- Rejected FL guardrails: {sum(1 for c in cells if not c['survives_fl'])}",
        "",
        "Top rejection reasons:",
    ]
    from collections import Counter
    breach_counter = Counter()
    for c in cells:
        if c.get("fl_breaches"):
            for b in c["fl_breaches"]:
                # normalize to reason name
                key = b.split("=")[0] if "=" in b else b
                breach_counter[key] += 1
    for reason, n in breach_counter.most_common(10):
        lines.append(f"- `{reason}`: {n}")

    Path(args.out).write_text("\n".join(lines))
    print(f"wrote {args.out}")
    print(f"outcome: {outcome}")
    if chosen:
        print(f"chosen: {chosen['cfg']}")


if __name__ == "__main__":
    main()
