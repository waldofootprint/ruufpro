#!/usr/bin/env python3
"""
Tier 3 GT comparison — diffs LiDAR output vs hand-measured ground truth.

Reads:
  - .tmp/calculator-bench/tier3-gt-template.json (multi-source GT, per design §7)
  - .tmp/lidar-spike/tier3-tile{N}.json (one per address, from lidar-tier3-geometry.py)

Writes:
  - .tmp/calculator-bench/tier3-bench.md — per-address, per-field scorecard

Pass bars (design doc §8, updated per Hannah):
  sqft_horiz      ≤10% MAE
  pitch           ≤15% MAE (loosened from 10% — Street-View GT is ±8–15% noisy)
  segments        exact match on ≥3/4
  ridge/hip/vly   ±15%
  perimeter       ±8%

Usage:
  python3 scripts/lidar-tier3-gt.py \
      --gt .tmp/calculator-bench/tier3-gt-template.json \
      --outputs .tmp/lidar-spike/tier3-tile1.json .tmp/lidar-spike/tier3-tile2.json ... \
      --out .tmp/calculator-bench/tier3-bench.md
"""
import argparse, json, sys
from pathlib import Path
from statistics import mean

PASS_BARS = {
    "sqft_horiz": {"type": "mae_pct", "bar": 10.0, "label": "Sqft horizontal MAE"},
    "sqft_sloped": {"type": "mae_pct", "bar": 10.0, "label": "Sqft sloped MAE"},
    "pitch": {"type": "mae_pct", "bar": 15.0, "label": "Pitch per-segment MAE"},
    "segments": {"type": "exact_fraction", "bar": 0.75, "label": "Segment exact-match"},
    "ridge_length": {"type": "pct_within", "bar": 15.0, "label": "Ridge length ±15%"},
    "hip_length": {"type": "pct_within", "bar": 15.0, "label": "Hip length ±15%"},
    "valley_length": {"type": "pct_within", "bar": 15.0, "label": "Valley length ±15%"},
    "perimeter": {"type": "pct_within", "bar": 8.0, "label": "Perimeter ±8%"},
}


def pct_err(measured, gt):
    if gt is None or gt == 0 or measured is None: return None
    return 100.0 * (measured - gt) / gt


def classify(err_pct, bar):
    if err_pct is None: return "—"
    return "✅" if abs(err_pct) <= bar else "❌"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gt", required=True)
    ap.add_argument("--outputs", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    gt_doc = json.loads(Path(args.gt).read_text())
    gt_by_label = {entry["address_label"]: entry for entry in gt_doc["addresses"]}

    outs_by_label = {}
    for p in args.outputs:
        o = json.loads(Path(p).read_text())
        lbl = o.get("address_label") or Path(p).stem
        outs_by_label[lbl] = o

    lines = ["# Tier 3 Bench — Comparison", "", f"GT: `{args.gt}`", ""]
    lines.append("## Per-address scorecard")
    lines.append("")

    all_results = []  # for aggregate
    for label, lidar in outs_by_label.items():
        gt = gt_by_label.get(label)
        if gt is None:
            lines.append(f"### {label}  \n**NO GT RECORD — skipped**\n")
            continue
        row = _compare_one(label, lidar, gt)
        all_results.append(row)
        lines += _render_address(row)

    lines.append("## Aggregate — pass bars")
    lines.append("")
    lines += _render_aggregate(all_results)

    lines.append("")
    lines.append("## Flagged addresses — what paid GT would change")
    lines.append("")
    for row in all_results:
        if row["gt_uncertain_fields"] or row["low_confidence"]:
            lines.append(f"- **{row['label']}**: "
                f"{'low point density + ' if row['low_confidence'] else ''}"
                f"GT-uncertain on {', '.join(row['gt_uncertain_fields']) or '—'}. "
                f"EagleView/Hover on this address (~$20–50) would lock in measured sloped sqft, "
                f"pitch per face, and ridge/hip/valley lengths. Upgrade would move pass/fail "
                f"from GT-limited to measurement-limited.")

    Path(args.out).write_text("\n".join(lines))
    print(f"wrote {args.out}")


def _compare_one(label, lidar, gt):
    results = {"label": label, "fields": {}, "gt_uncertain_fields": [],
               "low_confidence": bool(lidar.get("low_confidence_density"))}
    # sqft horiz
    m = lidar.get("roof_horiz_sqft")
    g = _resolved_gt(gt, "sqft_horiz")
    results["fields"]["sqft_horiz"] = {"measured": m, "gt": g["value"],
                                       "conf": g["confidence"], "err_pct": pct_err(m, g["value"])}
    if g["confidence"] == "low": results["gt_uncertain_fields"].append("sqft_horiz")
    # sloped
    m = lidar.get("roof_sloped_sqft_sum")
    g = _resolved_gt(gt, "sqft_sloped")
    results["fields"]["sqft_sloped"] = {"measured": m, "gt": g["value"],
                                        "conf": g["confidence"], "err_pct": pct_err(m, g["value"])}
    # pitch — MAE across segments
    g = _resolved_gt(gt, "pitch")
    if g["value"] is not None and lidar.get("segments"):
        measured_pitches = sorted([s["pitch_ratio_over_12"] for s in lidar["segments"]], reverse=True)
        gt_pitches = sorted(g["value"], reverse=True)
        n = min(len(measured_pitches), len(gt_pitches))
        errs = [abs(pct_err(measured_pitches[i], gt_pitches[i])) for i in range(n)
                if measured_pitches[i] is not None and gt_pitches[i]]
        mae = mean(errs) if errs else None
    else:
        mae = None
    results["fields"]["pitch"] = {"measured_count": len(lidar.get("segments", [])),
                                  "gt": g["value"], "conf": g["confidence"], "err_pct": mae}
    if g["confidence"] == "low": results["gt_uncertain_fields"].append("pitch")
    # segments
    m = lidar.get("num_segments")
    g = _resolved_gt(gt, "segments")
    exact = (m == g["value"]) if g["value"] is not None else None
    results["fields"]["segments"] = {"measured": m, "gt": g["value"],
                                     "conf": g["confidence"], "exact": exact}
    if g["confidence"] == "low": results["gt_uncertain_fields"].append("segments")
    # R/H/V lengths
    for k, lk in (("ridge_length", "ridge_length_ft"),
                  ("hip_length", "hip_length_ft"),
                  ("valley_length", "valley_length_ft")):
        m = lidar.get(lk)
        g = _resolved_gt(gt, k)
        results["fields"][k] = {"measured": m, "gt": g["value"], "conf": g["confidence"],
                                "err_pct": pct_err(m, g["value"])}
        if g["confidence"] == "low": results["gt_uncertain_fields"].append(k)
    # perimeter
    m = lidar.get("roof_perimeter_ft")
    g = _resolved_gt(gt, "perimeter")
    results["fields"]["perimeter"] = {"measured": m, "gt": g["value"],
                                      "conf": g["confidence"], "err_pct": pct_err(m, g["value"])}
    if g["confidence"] == "low": results["gt_uncertain_fields"].append("perimeter")
    return results


def _resolved_gt(gt_entry, field):
    """Extract {value, confidence} from multi-source GT entry, using agreement rule."""
    f = gt_entry.get("fields", {}).get(field, {})
    return {"value": f.get("resolved_value"),
            "confidence": f.get("confidence", "unknown")}


def _render_address(row):
    lines = [f"### {row['label']}"]
    if row["low_confidence"]: lines.append("*⚠️ low point density — reported, excluded from aggregate*")
    if row["gt_uncertain_fields"]:
        lines.append(f"*⚠️ GT-uncertain fields: {', '.join(row['gt_uncertain_fields'])}*")
    lines.append("")
    lines.append("| Field | LiDAR | GT | Err % | GT conf | Pass (strict) |")
    lines.append("|---|---|---|---|---|---|")
    for fname in ["sqft_horiz", "sqft_sloped", "pitch", "ridge_length", "hip_length", "valley_length", "perimeter"]:
        f = row["fields"].get(fname, {})
        bar = PASS_BARS[fname]["bar"]
        err = f.get("err_pct")
        err_s = f"{err:+.1f}%" if err is not None else "—"
        status = classify(err, bar) if f.get("gt") is not None else "—"
        lines.append(f"| {PASS_BARS[fname]['label']} | {f.get('measured')} | {f.get('gt')} | {err_s} | {f.get('conf', '?')} | {status} |")
    seg = row["fields"].get("segments", {})
    status = "✅" if seg.get("exact") else ("❌" if seg.get("exact") is False else "—")
    lines.append(f"| Segment count | {seg.get('measured')} | {seg.get('gt')} | — | {seg.get('conf', '?')} | {status} |")
    lines.append("")
    return lines


def _render_aggregate(results):
    lines = []
    # Exclude low-confidence-density addresses from aggregate
    elig = [r for r in results if not r["low_confidence"]]
    legacy = [r for r in results if r["low_confidence"]]
    lines.append(f"_N eligible = {len(elig)} | excluded (low density) = {len(legacy)}_")
    lines.append("")
    lines.append("| Field | Bar | MAE / % passing (strict) | MAE / % (bar + GT uncertainty) | Verdict |")
    lines.append("|---|---|---|---|---|")
    for fname, spec in PASS_BARS.items():
        errs = []
        exacts = []
        for r in elig:
            f = r["fields"].get(fname, {})
            if spec["type"] in ("mae_pct", "pct_within"):
                if f.get("err_pct") is not None:
                    errs.append(abs(f["err_pct"]))
            elif spec["type"] == "exact_fraction":
                if f.get("exact") is not None:
                    exacts.append(f["exact"])
        if spec["type"] in ("mae_pct", "pct_within"):
            if not errs:
                lines.append(f"| {spec['label']} | ≤{spec['bar']}% | no data | no data | — |"); continue
            mae = mean(errs)
            strict = f"{mae:.1f}% MAE"
            # "Bar + GT uncertainty": pad strict bar by +5% to acknowledge GT noise floor
            pad = mae <= (spec["bar"] + 5.0)
            strict_pass = mae <= spec["bar"]
            lines.append(f"| {spec['label']} | ≤{spec['bar']}% | {strict} {'✅' if strict_pass else '❌'} "
                         f"| {mae:.1f}% (+5 pad) {'✅' if pad else '❌'} | "
                         f"{'PASS' if strict_pass else ('MARGINAL' if pad else 'FAIL')} |")
        else:
            if not exacts:
                lines.append(f"| {spec['label']} | ≥{int(spec['bar']*100)}% | no data | no data | — |"); continue
            frac = sum(1 for e in exacts if e) / len(exacts)
            strict_pass = frac >= spec["bar"]
            lines.append(f"| {spec['label']} | ≥{int(spec['bar']*100)}% | {frac:.0%} {'✅' if strict_pass else '❌'} "
                         f"| same | {'PASS' if strict_pass else 'FAIL'} |")
    if legacy:
        lines.append("")
        lines.append("### Legacy (2007) tile — reported separately")
        for r in legacy:
            lines.append(f"- **{r['label']}**: see per-address block above. Counted as signal for Phase B coverage strategy, not for main scorecard.")
    return lines


if __name__ == "__main__":
    main()
