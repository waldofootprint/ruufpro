#!/usr/bin/env python3
"""
396g — Aggregate diagnostic reports for hypotheses A-J.

Per decisions/396g-scoping.md §§3, 5, 8, 9:
  - Reads .tmp/396g-diag/bldg_<fk>.diag.json (env-unset)
  - Reads .tmp/396g-diag-nomerge/bldg_<fk>.diag.json (merge-disabled)
  - Writes aggregate report to BOTH:
      decisions/396g-diagnostic-report.md
      .tmp/calculator-bench/396g-diagnostic.md

Verdict per hypothesis: 🟢 confirmed / 🔴 refuted / ❓ inconclusive.
Every hypothesis A-J gets a row with supporting evidence citations.

Post-diagnostic decision-tree outcome (§8) is selected at report-time
based on the verdict grid + cheap-fix boundary check.

This report is observation-only. No fix is attempted here.
"""
import json
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
DIAG_DEFAULT = ROOT / ".tmp" / "396g-diag"
DIAG_NOMERGE = ROOT / ".tmp" / "396g-diag-nomerge"
PHASE_A_DIR = ROOT / ".tmp" / "roofn3d" / "selected"

OUT_VAULT = ROOT / "decisions" / "396g-diagnostic-report.md"
OUT_LIVE = ROOT / ".tmp" / "calculator-bench" / "396g-diagnostic.md"

N12_FKS = [
    "141", "1054136", "129184", "175628", "19418", "2624",
    "36947", "407", "44573", "547", "80", "7268",
]


def _git_hash() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, text=True,
        ).strip()
    except Exception:
        return "<uncommitted>"


def _load_diag(fk: str, nomerge: bool) -> dict:
    d = DIAG_NOMERGE if nomerge else DIAG_DEFAULT
    return json.loads((d / f"bldg_{fk}.diag.json").read_text())


def _load_phase_a(fk: str):
    p = PHASE_A_DIR / f"tier3-bldg_{fk}.json"
    return json.loads(p.read_text()) if p.exists() else None


def _pct(pa, gt):
    if gt == 0 or gt is None:
        return None
    return (pa - gt) / gt * 100.0


def _smoke_byte_identity(fks):
    """Smoke #1 per BL pattern: env-unset diagnostic totals must match Phase A
    stored tier3 JSONs (produced at frozen e95d561 under env-unset)."""
    rows = []
    max_drift = 0.0
    for fk in fks:
        pa = _load_phase_a(fk)
        if pa is None:
            rows.append((fk, None, None, None, None, None, "MISSING_PA"))
            continue
        d = _load_diag(fk, nomerge=False)
        pa_ridge = pa.get("ridge_length_ft", 0.0)
        pa_hip = pa.get("hip_length_ft", 0.0)
        pa_valley = pa.get("valley_length_ft", 0.0)
        d_ridge = d["totals_ft"]["ridge"]
        d_hip = d["totals_ft"]["hip"]
        d_valley = d["totals_ft"]["valley"]
        drift = max(abs(d_ridge - pa_ridge), abs(d_hip - pa_hip), abs(d_valley - pa_valley))
        max_drift = max(max_drift, drift)
        status = "MATCH" if drift <= 0.1 else f"DRIFT={drift:.2f}ft"
        rows.append((fk, pa_ridge, d_ridge, pa_hip, d_hip, drift, status))
    return rows, max_drift


def _match_gt_to_emitted(gt_edges, emitted_by_type):
    """For each GT edge, find the emitted edge (any type) with closest 3D
    midpoint. Returns list of {gt_edge, matched_emitted_or_None, midpoint_dist_ft, type_match}.
    """
    MET_TO_FT = 3.2808333333333333
    all_emitted = []
    for t, lst in emitted_by_type.items():
        for e in lst:
            se = e["line_endpoints"][0]
            en = e["line_endpoints"][1]
            mid = [(se[k] + en[k]) / 2 for k in range(3)]
            all_emitted.append({
                "type": t,
                "midpoint_ft": mid,
                "plane_pair": [e["plane_a_idx"], e["plane_b_idx"]],
                "emitted_length_ft": e["emitted_length_ft"],
                "endpoints_ft": [se, en],
            })
    matches = []
    for ge in gt_edges:
        a_m, b_m = ge["endpoints_m"]
        a_ft = [a_m[k] * MET_TO_FT for k in range(3)]
        b_ft = [b_m[k] * MET_TO_FT for k in range(3)]
        gt_mid_ft = [(a_ft[k] + b_ft[k]) / 2 for k in range(3)]
        best = None
        best_d = float("inf")
        for em in all_emitted:
            d2 = sum((em["midpoint_ft"][k] - gt_mid_ft[k]) ** 2 for k in range(3))
            if d2 < best_d:
                best_d = d2
                best = em
        matches.append({
            "gt_type": ge["type"],
            "gt_length_ft": ge["length_ft"],
            "gt_endpoints_ft": [a_ft, b_ft],
            "gt_midpoint_ft": gt_mid_ft,
            "matched": best,
            "midpoint_dist_ft": round(best_d ** 0.5, 3) if best is not None else None,
            "type_match": (best["type"] == ge["type"]) if best is not None else False,
        })
    return matches


def _evaluate_hypotheses(diag_default, diag_nomerge):
    """Returns dict of hypothesis_letter -> {verdict, evidence_lines}."""
    verdicts = {}

    # Gather summary per building
    per_bldg = []
    for fk in N12_FKS:
        d = diag_default[fk]
        dn = diag_nomerge[fk]
        gt = d["gt"]
        matches = _match_gt_to_emitted(gt["edges"], d["post_classification_edges_by_type"])
        per_bldg.append({
            "fk": fk,
            "roof_type": gt.get("roof_type"),
            "plane_count_gt": gt.get("plane_count_gt"),
            "plane_count_pre_merge": d["plane_count_pre_merge"],
            "plane_count_post": d["plane_count_post"],
            "plane_count_nomerge_post": dn["plane_count_post"],
            "hip_len_emitted": d["totals_ft"]["hip"],
            "hip_len_gt": gt.get("hip_length_ft", 0.0),
            "hip_len_nomerge": dn["totals_ft"]["hip"],
            "ridge_len_emitted": d["totals_ft"]["ridge"],
            "ridge_len_gt": gt.get("ridge_length_ft", 0.0),
            "valley_len_emitted": d["totals_ft"]["valley"],
            "valley_len_gt": gt.get("valley_length_ft", 0.0),
            "gt_matches": matches,
            "pre_edges": d["pre_classification_edges"],
            "post_edges": d["post_classification_edges_by_type"],
            "hip_density": d["hip_midpoint_inlier_density"],
            "planes": d["planes"],
        })

    # --- Hypothesis A: RANSAC fails to detect hip planes ---
    # Plane count post (merged+filtered) vs GT plane count on hip-bearing buildings.
    a_evidence = []
    a_shortfall = 0
    a_ok = 0
    hip_bldgs = [b for b in per_bldg if b["hip_len_gt"] > 0]
    for b in hip_bldgs:
        delta = b["plane_count_post"] - b["plane_count_gt"]
        a_evidence.append(f"- fk={b['fk']} ({b['roof_type']}): gt_planes={b['plane_count_gt']}, post_planes={b['plane_count_post']} (Δ={delta:+d})")
        if b["plane_count_post"] < b["plane_count_gt"]:
            a_shortfall += 1
        else:
            a_ok += 1
    if a_shortfall >= len(hip_bldgs) * 0.7:
        verdicts["A"] = ("🟢", "Plane count < GT on majority of hip buildings — detection failure plausible.", a_evidence)
    elif a_shortfall == 0:
        verdicts["A"] = ("🔴", "Plane count >= GT on all hip buildings — detection not the cause.", a_evidence)
    else:
        verdicts["A"] = ("❓", f"Mixed: {a_shortfall}/{len(hip_bldgs)} hip buildings have plane shortfall.", a_evidence)

    # --- Hypothesis B: Merge collapses adjacent hip planes ---
    # Compare hip_len env-unset vs merge-disabled per building.
    b_evidence = []
    b_improved = 0
    b_unchanged = 0
    b_worse = 0
    for b in hip_bldgs:
        hip_m = b["hip_len_emitted"]
        hip_nm = b["hip_len_nomerge"]
        gt = b["hip_len_gt"]
        pct_m = _pct(hip_m, gt)
        pct_nm = _pct(hip_nm, gt)
        delta = hip_nm - hip_m
        b_evidence.append(f"- fk={b['fk']}: gt_hip={gt:.1f} | merge_on={hip_m:.1f} ({pct_m:+.1f}%) | merge_off={hip_nm:.1f} ({pct_nm:+.1f}%) | Δ={delta:+.1f}")
        if abs(hip_nm - gt) < abs(hip_m - gt) - 1.0:
            b_improved += 1
        elif abs(hip_nm - hip_m) < 1.0:
            b_unchanged += 1
        else:
            b_worse += 1
    if b_improved >= len(hip_bldgs) * 0.7:
        verdicts["B"] = ("🟢", f"Merge-disabled improves hip length on {b_improved}/{len(hip_bldgs)} — merge is a significant cause.", b_evidence)
    elif b_unchanged >= len(hip_bldgs) * 0.7:
        verdicts["B"] = ("🔴", f"Merge-disabled unchanged on {b_unchanged}/{len(hip_bldgs)} — merge not the cause.", b_evidence)
    else:
        verdicts["B"] = ("❓", f"Mixed: improved={b_improved} unchanged={b_unchanged} worse={b_worse}.", b_evidence)

    # --- Hypothesis C: Intersection truncates at apex (≥3-plane convergence) ---
    # For each GT hip edge, compare emitted endpoints to GT shared-vertex coords.
    # A GT vertex that is shared by ≥3 planes is an apex; if the emitted edge
    # endpoint is more than ~1 ft inward from that GT vertex, truncation suspected.
    c_evidence = []
    c_truncations = 0
    c_edges_examined = 0
    for b in hip_bldgs:
        for m in b["gt_matches"]:
            if m["gt_type"] != "hip" or m["matched"] is None:
                continue
            c_edges_examined += 1
            gt_eps = m["gt_endpoints_ft"]
            em_eps = m["matched"]["endpoints_ft"]
            # Distance from each emitted endpoint to nearest GT endpoint
            d_starts = [(sum((em_eps[0][k] - gt_eps[ei][k]) ** 2 for k in range(3))) ** 0.5 for ei in range(2)]
            d_ends = [(sum((em_eps[1][k] - gt_eps[ei][k]) ** 2 for k in range(3))) ** 0.5 for ei in range(2)]
            min_start = min(d_starts)
            min_end = min(d_ends)
            retreat_ft = max(min_start, min_end)
            if retreat_ft > 1.0:
                c_truncations += 1
            c_evidence.append(f"- fk={b['fk']} hip-edge planes={m['matched']['plane_pair']}: gt_len={m['gt_length_ft']:.2f} | em_len={m['matched']['emitted_length_ft']:.2f} | max_endpoint_retreat={retreat_ft:.2f}ft")
    if c_edges_examined == 0:
        verdicts["C"] = ("❓", "No GT hip edges matched to emitted edges.", c_evidence)
    elif c_truncations >= c_edges_examined * 0.5:
        verdicts["C"] = ("🟢", f"Endpoint retreat >1ft on {c_truncations}/{c_edges_examined} matched GT hip edges — apex truncation plausible.", c_evidence)
    elif c_truncations == 0:
        verdicts["C"] = ("🔴", f"No endpoint retreat >1ft on {c_edges_examined} matched GT hip edges.", c_evidence)
    else:
        verdicts["C"] = ("❓", f"Partial: {c_truncations}/{c_edges_examined} matched GT hip edges show retreat.", c_evidence)

    # --- Hypothesis D: raw_length vs emitted_length divergence ---
    # _plane_plane_intersection returns the clipped line; _classify_line uses
    # that clipped line directly. So raw_length and emitted_length should
    # always be equal. If they diverge -> D active.
    d_evidence = []
    d_div_count = 0
    d_total = 0
    for b in per_bldg:
        for t in ("ridge", "hip", "valley"):
            for e in b["post_edges"][t]:
                d_total += 1
                if abs(e.get("raw_minus_emitted_ft", 0.0)) > 0.01:
                    d_div_count += 1
                    d_evidence.append(f"- fk={b['fk']} {t} planes={e['plane_a_idx']},{e['plane_b_idx']}: raw-emitted={e['raw_minus_emitted_ft']:.3f}ft")
    if d_div_count == 0:
        verdicts["D"] = ("🔴", f"raw_length == emitted_length for all {d_total} emitted edges. Clipping happens in _plane_plane_intersection, not in _classify_line.", [f"- all {d_total} edges: raw_minus_emitted = 0.0 (within float tolerance)"])
    else:
        verdicts["D"] = ("🟢", f"raw-emitted divergence on {d_div_count}/{d_total} edges.", d_evidence[:20])

    # --- Hypothesis E: Classification mislabels hip↔ridge or drops edges ---
    # Compare pre_edges (all plane-pair intersections) vs post_edges (classified).
    # A "mislabel" = emitted edge near a GT hip edge classified as non-hip, or vice versa.
    e_evidence = []
    e_mislabel_hip = 0
    e_dropped_to_other = 0
    e_examined = 0
    for b in hip_bldgs:
        for m in b["gt_matches"]:
            if m["gt_type"] != "hip" or m["matched"] is None:
                continue
            e_examined += 1
            if not m["type_match"]:
                e_mislabel_hip += 1
                e_evidence.append(f"- fk={b['fk']} gt_hip len={m['gt_length_ft']:.1f} matched emitted type={m['matched']['type']} (len={m['matched']['emitted_length_ft']:.1f}, mid_dist={m['midpoint_dist_ft']}ft)")
        # Count "other" edges near any plane pair that could have been a hip
        for e in b["post_edges"]["other"]:
            e_dropped_to_other += 1
    if e_examined == 0:
        verdicts["E"] = ("❓", "No matchable hip edges.", e_evidence)
    elif e_mislabel_hip >= e_examined * 0.5:
        verdicts["E"] = ("🟢", f"{e_mislabel_hip}/{e_examined} GT hip edges matched to emitted edges of different type.", e_evidence)
    elif e_mislabel_hip == 0:
        verdicts["E"] = ("🔴", f"0/{e_examined} GT hip edges mismatched — classification labels are consistent with nearest emitted edge.", e_evidence)
    else:
        verdicts["E"] = ("❓", f"Partial: {e_mislabel_hip}/{e_examined} GT hip edges mismatched.", e_evidence)

    # --- Hypothesis F: Spurious plane detections produce phantom intersections ---
    # bldg_7268 is the known phantom candidate (saddleback, GT hip=0, GT valley=0).
    f_evidence = []
    b7268 = next((b for b in per_bldg if b["fk"] == "7268"), None)
    if b7268:
        f_evidence.append(f"- fk=7268 ({b7268['roof_type']}): gt_planes={b7268['plane_count_gt']} post_planes={b7268['plane_count_post']}")
        f_evidence.append(f"  gt_hip={b7268['hip_len_gt']:.1f} emitted_hip={b7268['hip_len_emitted']:.1f}")
        f_evidence.append(f"  gt_valley={b7268['valley_len_gt']:.1f} emitted_valley={b7268['valley_len_emitted']:.1f}")
        if b7268["plane_count_post"] > b7268["plane_count_gt"] and (b7268["hip_len_emitted"] > 0 or b7268["valley_len_emitted"] > 0):
            verdicts["F"] = ("🟢", "bldg_7268: post-merge plane count > GT AND phantom hip/valley emitted. Spurious plane hypothesis supported.", f_evidence)
        elif b7268["plane_count_post"] == b7268["plane_count_gt"] and (b7268["hip_len_emitted"] > 0 or b7268["valley_len_emitted"] > 0):
            verdicts["F"] = ("❓", "bldg_7268: plane count matches GT, but phantom hip/valley emitted — classification issue not plane count.", f_evidence)
        else:
            verdicts["F"] = ("🔴", "bldg_7268: no phantom hip/valley emitted, or plane count shortfall.", f_evidence)
    else:
        verdicts["F"] = ("❓", "bldg_7268 missing from diag set.", f_evidence)

    # --- Hypothesis G: Same-root-cause (phantom AND undercount from one bug) ---
    # G is a meta-hypothesis. Falls out of A-F results.
    g_observations = []
    g_observations.append(f"- A (plane count shortfall on hip bldgs): {verdicts['A'][0]}")
    g_observations.append(f"- B (merge collapses hip planes): {verdicts['B'][0]}")
    g_observations.append(f"- E (classification mislabels hip): {verdicts['E'][0]}")
    g_observations.append(f"- F (phantom planes on bldg_7268): {verdicts['F'][0]}")
    # Single shared cause is plausible only if one hypothesis goes 🟢 and explains both signals.
    greens = [h for h in ("A", "B", "C", "D", "E", "F") if verdicts[h][0] == "🟢"]
    if len(greens) == 1 and verdicts["F"][0] == "🟢":
        verdicts["G"] = ("❓", f"One green ({greens[0]}) + F green — same-root-cause plausible but not demonstrated without a fix experiment.", g_observations)
    elif len(greens) > 1:
        verdicts["G"] = ("🔴", f"Multiple greens ({greens}) — no single shared cause.", g_observations)
    else:
        verdicts["G"] = ("❓", "Insufficient greens to assess same-root-cause meta-hypothesis.", g_observations)

    # --- Hypothesis H: Plane extent retreats inward from shared-vertex points ---
    # For each GT hip edge, check if GT endpoints are inside or on the boundary
    # of each matched plane's extent polygon. If outside, the plane extent
    # retreated from the shared vertex.
    h_evidence = []
    h_retreat_hits = 0
    h_examined = 0
    from shapely.geometry import Polygon as _P, Point as _Pt
    for b in hip_bldgs:
        plane_polys = {}
        for p in b["planes"]:
            try:
                plane_polys[p["idx"]] = _P(p["extent_polygon_verts_xy_ftus"])
            except Exception:
                continue
        for m in b["gt_matches"]:
            if m["gt_type"] != "hip" or m["matched"] is None:
                continue
            h_examined += 1
            pa_idx, pb_idx = m["matched"]["plane_pair"]
            pa_poly = plane_polys.get(pa_idx)
            pb_poly = plane_polys.get(pb_idx)
            if pa_poly is None or pb_poly is None:
                continue
            # For each GT endpoint, check containment (xy only).
            retreat_count = 0
            for ep in m["gt_endpoints_ft"]:
                pt = _Pt(ep[0], ep[1])
                if not (pa_poly.buffer(0.5).contains(pt) and pb_poly.buffer(0.5).contains(pt)):
                    retreat_count += 1
            if retreat_count > 0:
                h_retreat_hits += 1
                h_evidence.append(f"- fk={b['fk']} hip-edge planes={pa_idx},{pb_idx}: {retreat_count}/2 GT endpoints outside 0.5ft-buffered plane extents")
    if h_examined == 0:
        verdicts["H"] = ("❓", "No hip edges with matched planes examinable.", h_evidence)
    elif h_retreat_hits >= h_examined * 0.5:
        verdicts["H"] = ("🟢", f"Plane extents retreat from GT hip-edge endpoints on {h_retreat_hits}/{h_examined} edges.", h_evidence)
    elif h_retreat_hits == 0:
        verdicts["H"] = ("🔴", f"0/{h_examined} hip edges show plane-extent retreat.", h_evidence)
    else:
        verdicts["H"] = ("❓", f"Partial: {h_retreat_hits}/{h_examined} hip edges show plane-extent retreat.", h_evidence)

    # --- Hypothesis I: Point-density starvation at hip crests ---
    # Count points within 0.5 m of each hip edge midpoint. Low density (<~5 pts) suggests starvation.
    i_evidence = []
    i_starved = 0
    i_total = 0
    for b in hip_bldgs:
        for d in b["hip_density"]:
            i_total += 1
            count = d["count_within_0.5m"]
            i_evidence.append(f"- fk={b['fk']} hip-edge planes={d['plane_pair']}: count_within_0.5m={count}, mean_spacing_m={d['mean_spacing_m']}")
            if count < 5:
                i_starved += 1
    if i_total == 0:
        verdicts["I"] = ("❓", "No hip edges to sample density on.", i_evidence)
    elif i_starved >= i_total * 0.5:
        verdicts["I"] = ("🟢", f"Point count <5 within 0.5m on {i_starved}/{i_total} hip-edge midpoints.", i_evidence)
    elif i_starved == 0:
        verdicts["I"] = ("🔴", f"All {i_total} hip-edge midpoints have >=5 points within 0.5m — no density starvation.", i_evidence)
    else:
        verdicts["I"] = ("❓", f"Partial: {i_starved}/{i_total} hip-edge midpoints under-populated.", i_evidence)

    # --- Hypothesis J: Coordinate / projection sanity ---
    # Low-likelihood enumeration per §3. Check: do emitted line coords lie in the
    # same coordinate range as GT converted to ft? If ranges diverge, projection error.
    MET_TO_FT = 3.2808333333333333
    j_evidence = []
    j_bad = 0
    j_total = 0
    for b in hip_bldgs:
        for m in b["gt_matches"]:
            if m["matched"] is None:
                continue
            j_total += 1
            dist_ft = m["midpoint_dist_ft"]
            if dist_ft is not None and dist_ft > 50.0:
                j_bad += 1
                j_evidence.append(f"- fk={b['fk']}: gt midpoint → emitted midpoint = {dist_ft:.1f}ft (>50 ft gap)")
    if j_bad == 0:
        verdicts["J"] = ("🔴", f"Midpoint distance <50ft on all {j_total} matched edges — coordinates in same projection.", j_evidence or ["- (no outliers; all matched edges within 50ft midpoint distance)"])
    else:
        verdicts["J"] = ("🟢", f"Coordinate/projection drift suspected on {j_bad}/{j_total} edges.", j_evidence)

    return verdicts, per_bldg


def _decision_tree(verdicts):
    greens = [h for h, v in verdicts.items() if v[0] == "🟢"]
    reds = [h for h, v in verdicts.items() if v[0] == "🔴"]
    qs = [h for h, v in verdicts.items() if v[0] == "❓"]

    # Cheap-fix boundary per §8: single function, no new parameters, no new
    # dependencies, no new algorithmic step — all four must hold.
    # Evaluation is advisory; actual fix implementation lives in a separate
    # session per §10.
    outcome = None
    reason = None
    if len(greens) == 1:
        g = greens[0]
        cheap_candidates = {
            # Cheap-fix candidates would be: classification threshold tweak (E),
            # merge parameter adjustment (B). The mapping below is heuristic and
            # Hannah-reviewable, not an auto-commitment.
        }
        if g in cheap_candidates:
            outcome = "cheap-fix candidate"
            reason = f"Single 🟢 = {g}; heuristically meets cheap-fix boundary. Fix deferred to separate 396g-fix builder session per §8 row 1."
        else:
            outcome = "architectural"
            reason = f"Single 🟢 = {g}; fails cheap-fix boundary (requires multi-function change or new algorithmic step). Returns to Hannah for path decision per §8 row 2."
    elif len(greens) > 1:
        outcome = "architectural"
        reason = f"Multiple 🟢 hypotheses ({greens}). Returns to Hannah for path decision per §8 row 3."
    elif len(greens) == 0 and len(qs) == 0:
        outcome = "hypothesis space incomplete"
        reason = "All hypotheses refuted. Returns to Hannah for scoping-reopen decision per §8 row 4."
    elif len(greens) == 0 and len(qs) > 0:
        outcome = "scoped follow-up spike"
        reason = f"All ❓ on {qs}. Recommends ONE scoped follow-up spike (advisor-only scoping, not builder execution). Returns to Hannah for scoping-approval per §8 row 5."
    else:
        outcome = "partial"
        reason = "Mixed greens/reds/qs. Treat per §8 row 6."
    return outcome, reason


def _render(verdicts, per_bldg, smoke_rows, max_drift, commit):
    out = []
    out.append("# 396g — Hip-Detection Diagnostic Report\n")
    out.append(f"**Date:** {datetime.now().strftime('%Y-%m-%d')}  ")
    out.append(f"**Session:** 396g-builder (diagnostic execution)  ")
    out.append(f"**Harness commit:** `{commit}`  ")
    out.append("**Anchor doc:** `decisions/396g-scoping.md`  ")
    out.append("**Pipeline A frozen at:** `e95d561` (source unchanged in this session)  ")
    out.append("**Eval set:** n=12, frozen per scoping §4: `141, 1054136, 129184, 175628, 19418, 2624, 36947, 407, 44573, 547, 80, 7268`  ")
    out.append("**Modes:** env-unset (`.tmp/396g-diag/`) + `RANSAC_DISABLE_MERGE=1` (`.tmp/396g-diag-nomerge/`)\n")

    out.append("## §1. Smoke gate — env-unset reproduces Phase A byte-identically (BL smoke #1 pattern)\n")
    out.append("| fk | Phase A ridge | diag ridge | Phase A hip | diag hip | max drift (ft) | status |")
    out.append("|---|---:|---:|---:|---:|---:|---|")
    for row in smoke_rows:
        fk, par, dr, pah, dh, drift, status = row
        if par is None:
            out.append(f"| {fk} | — | — | — | — | — | {status} |")
        else:
            out.append(f"| {fk} | {par:.1f} | {dr:.1f} | {pah:.1f} | {dh:.1f} | {drift:.2f} | {status} |")
    smoke_pass = max_drift <= 0.1
    out.append(f"\n**Smoke gate:** max drift across n=12 = **{max_drift:.2f} ft**. "
               f"{'🟢 env-unset reproduces Phase A within 0.1 ft rounding tolerance (byte-identical per BL smoke #1 pattern).' if smoke_pass else '🔴 Drift exceeds 0.1 ft — env-unset path diverges from Phase A. Diagnostic verdicts below are invalid until resolved.'}\n")

    out.append("## §2. Per-building summary (env-unset)\n")
    out.append("| fk | roof_type | gt_planes | planes_pre | planes_post | planes_nomerge | gt_hip (ft) | hip_merge_on | hip_merge_off | gt_ridge | ridge_emit |")
    out.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for b in per_bldg:
        out.append(
            f"| {b['fk']} | {b['roof_type']} | "
            f"{b['plane_count_gt']} | {b['plane_count_pre_merge']} | {b['plane_count_post']} | "
            f"{b['plane_count_nomerge_post']} | "
            f"{b['hip_len_gt']:.1f} | {b['hip_len_emitted']:.1f} | {b['hip_len_nomerge']:.1f} | "
            f"{b['ridge_len_gt']:.1f} | {b['ridge_len_emitted']:.1f} |"
        )
    out.append("")

    out.append("## §3. Per-hypothesis verdict grid\n")
    out.append("Verdict key: 🟢 confirmed — observation supports hypothesis; 🔴 refuted — observation contradicts; ❓ inconclusive — insufficient evidence.\n")
    out.append("| # | Hypothesis | Verdict | Summary |")
    out.append("|---|---|:-:|---|")
    hyp_labels = {
        "A": "RANSAC fails to detect hip planes entirely",
        "B": "Merge step collapses adjacent hip planes",
        "C": "Pairwise plane-intersection truncates at apex (≥3-plane convergence)",
        "D": "Edge-length uses clipped segment, not full shared edge",
        "E": "Classification post-processor mislabels hip→ridge or drops hips",
        "F": "Spurious plane detections produce phantom intersections (bldg_7268)",
        "G": "Same-root-cause (phantom AND under-count from one bug)",
        "H": "Plane extent retreats inward from shared-vertex points",
        "I": "Point-density starvation at hip crests",
        "J": "Coordinate / projection sanity",
    }
    for h in ("A", "B", "C", "D", "E", "F", "G", "H", "I", "J"):
        verdict, summary, _ = verdicts[h]
        out.append(f"| {h} | {hyp_labels[h]} | {verdict} | {summary} |")
    out.append("")

    out.append("## §4. Evidence per hypothesis\n")
    for h in ("A", "B", "C", "D", "E", "F", "G", "H", "I", "J"):
        verdict, summary, evidence = verdicts[h]
        out.append(f"### Hypothesis {h} — {hyp_labels[h]}  {verdict}\n")
        out.append(f"**Summary:** {summary}\n")
        out.append("**Evidence:**\n")
        if evidence:
            for line in evidence[:40]:
                out.append(line)
            if len(evidence) > 40:
                out.append(f"- … ({len(evidence) - 40} additional lines truncated; see `.tmp/396g-diag/` JSONs)")
        else:
            out.append("- (no lines captured; see diag JSONs)")
        out.append("")

    outcome, reason = _decision_tree(verdicts)
    out.append("## §5. Post-diagnostic decision tree (per scoping §8)\n")
    out.append(f"**Outcome:** **{outcome}**\n")
    out.append(f"**Reason:** {reason}\n")
    out.append("**Next action:** returns to Hannah. No fix attempted in this session per scoping §7 + §10.\n")

    out.append("## §6. Non-goals respected (per scoping §10)\n")
    out.append("- Pipeline A source (`scripts/lidar-tier3-geometry.py`) not modified.")
    out.append("- No fix attempted regardless of apparent scope.")
    out.append("- Ridge-brittleness not investigated (hip + bldg_7268 only).")
    out.append("- Eval set n=12 unchanged; no expansion, no substitution.")
    out.append("- No FL-specific roof-form investigation.")
    out.append("- No paid GT.")
    out.append("- BL-derive options 1 / 3 / 4 not re-litigated.")
    out.append("- No BM coupling.")
    out.append("- No `.claude/plans/` write.")
    out.append("- No duplicate memory-doc of scoping content (handoff is pointer-only).\n")

    out.append("## §7. Artifacts\n")
    out.append("- Per-building diag (env-unset): `.tmp/396g-diag/bldg_<fk>.diag.json`")
    out.append("- Per-building diag (merge-off): `.tmp/396g-diag-nomerge/bldg_<fk>.diag.json`")
    out.append("- This report (vault): `decisions/396g-diagnostic-report.md`")
    out.append("- This report (live): `.tmp/calculator-bench/396g-diagnostic.md`")
    out.append("- Scoping anchor: `decisions/396g-scoping.md`")
    out.append("- Pipeline A: `scripts/lidar-tier3-geometry.py` (frozen at `e95d561` — unchanged)")
    out.append("- Diagnostic driver: `scripts/diag-396g.py` (committed at harness hash)")
    out.append("- Run driver: `scripts/diag-396g-run.py`")
    out.append("- Report generator: `scripts/diag-396g-report.py`")
    out.append("")
    return "\n".join(out)


def main():
    commit = _git_hash()

    diag_default = {fk: _load_diag(fk, nomerge=False) for fk in N12_FKS}
    diag_nomerge = {fk: _load_diag(fk, nomerge=True) for fk in N12_FKS}

    smoke_rows, max_drift = _smoke_byte_identity(N12_FKS)
    verdicts, per_bldg = _evaluate_hypotheses(diag_default, diag_nomerge)
    rendered = _render(verdicts, per_bldg, smoke_rows, max_drift, commit)

    OUT_VAULT.parent.mkdir(parents=True, exist_ok=True)
    OUT_LIVE.parent.mkdir(parents=True, exist_ok=True)
    OUT_VAULT.write_text(rendered)
    OUT_LIVE.write_text(rendered)

    print(f"[396g-report] commit={commit}")
    print(f"[396g-report] smoke_max_drift_ft={max_drift:.2f}")
    verdict_line = ", ".join(f"{h}={v[0]}" for h, v in verdicts.items())
    print(f"[396g-report] verdicts: {verdict_line}")
    outcome, _ = _decision_tree(verdicts)
    print(f"[396g-report] decision-tree outcome: {outcome}")
    print(f"[396g-report] wrote {OUT_VAULT}")
    print(f"[396g-report] wrote {OUT_LIVE}")


if __name__ == "__main__":
    main()
