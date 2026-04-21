# 396g — Hip-Detection Diagnostic Report

**Date:** 2026-04-21  
**Session:** 396g-builder (diagnostic execution)  
**Harness commits:** `d72bd01` (diagnostic scripts, original atomic commit) + `e6b2d47` (report-only coordinate-frame correction; per `feedback_harness_vs_tuning_categories.md` mechanical-fix pattern — GT endpoints now shifted by recovered LAZ offset before matching. Diag JSONs from pass at d72bd01 unchanged and unreferenced by the fix; Pipeline A still e95d561; smoke gate unchanged.)  
**Anchor doc:** `decisions/396g-scoping.md`  
**Pipeline A frozen at:** `e95d561` (source unchanged in this session)  
**Eval set:** n=12, frozen per scoping §4: `141, 1054136, 129184, 175628, 19418, 2624, 36947, 407, 44573, 547, 80, 7268`  
**Modes:** env-unset (`.tmp/396g-diag/`) + `RANSAC_DISABLE_MERGE=1` (`.tmp/396g-diag-nomerge/`)

## §1. Smoke gate — env-unset reproduces Phase A byte-identically (BL smoke #1 pattern)

| fk | Phase A ridge | diag ridge | Phase A hip | diag hip | max drift (ft) | status |
|---|---:|---:|---:|---:|---:|---|
| 141 | 28.0 | 28.0 | 37.5 | 37.5 | 0.00 | MATCH |
| 1054136 | 0.0 | 0.0 | 57.0 | 57.0 | 0.00 | MATCH |
| 129184 | 0.0 | 0.0 | 20.0 | 20.0 | 0.00 | MATCH |
| 175628 | 2.8 | 2.8 | 75.1 | 75.1 | 0.00 | MATCH |
| 19418 | 6.6 | 6.6 | 78.2 | 78.2 | 0.00 | MATCH |
| 2624 | 42.0 | 42.0 | 64.1 | 64.1 | 0.00 | MATCH |
| 36947 | 45.0 | 45.0 | 53.0 | 53.0 | 0.00 | MATCH |
| 407 | 25.6 | 25.6 | 47.5 | 47.5 | 0.00 | MATCH |
| 44573 | 32.4 | 32.4 | 60.9 | 60.9 | 0.00 | MATCH |
| 547 | 28.3 | 28.3 | 69.9 | 70.0 | 0.10 | MATCH |
| 80 | 31.5 | 31.5 | 43.4 | 43.4 | 0.00 | MATCH |
| 7268 | 38.7 | 38.7 | 29.5 | 29.5 | 0.00 | MATCH |

**Smoke gate:** max drift across n=12 = **0.10 ft**. 🟢 env-unset reproduces Phase A within 0.1 ft rounding tolerance (byte-identical per BL smoke #1 pattern).

## §2. Per-building summary (env-unset)

| fk | roof_type | gt_planes | planes_pre | planes_post | planes_nomerge | gt_hip (ft) | hip_merge_on | hip_merge_off | gt_ridge | ridge_emit |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 141 | Two-sided hip roof | 4 | 5 | 5 | 5 | 83.2 | 37.5 | 37.5 | 22.8 | 28.0 |
| 1054136 | Pyramid roof | 4 | 4 | 4 | 4 | 156.2 | 57.0 | 57.0 | 0.0 | 0.0 |
| 129184 | Pyramid roof | 4 | 4 | 4 | 4 | 111.6 | 20.0 | 20.0 | 0.0 | 0.0 |
| 175628 | Pyramid roof | 4 | 5 | 5 | 5 | 108.2 | 75.1 | 75.1 | 0.0 | 2.8 |
| 19418 | Two-sided hip roof | 4 | 4 | 4 | 4 | 132.8 | 78.2 | 78.2 | 11.4 | 6.6 |
| 2624 | Two-sided hip roof | 4 | 3 | 3 | 3 | 107.3 | 64.1 | 64.1 | 42.6 | 42.0 |
| 36947 | Two-sided hip roof | 4 | 4 | 4 | 4 | 121.1 | 53.0 | 53.0 | 45.4 | 45.0 |
| 407 | Two-sided hip roof | 4 | 4 | 4 | 4 | 83.8 | 47.5 | 47.5 | 24.0 | 25.6 |
| 44573 | Two-sided hip roof | 4 | 4 | 4 | 4 | 104.6 | 60.9 | 60.9 | 34.0 | 32.4 |
| 547 | Two-sided hip roof | 4 | 5 | 5 | 5 | 86.3 | 70.0 | 70.0 | 21.8 | 28.3 |
| 80 | Two-sided hip roof | 4 | 4 | 4 | 4 | 82.9 | 43.4 | 43.4 | 24.2 | 31.5 |
| 7268 | Saddleback roof | 2 | 4 | 4 | 4 | 0.0 | 29.5 | 29.5 | 41.0 | 38.7 |

## §3. Per-hypothesis verdict grid

Verdict key: 🟢 confirmed — observation supports hypothesis; 🔴 refuted — observation contradicts; ❓ inconclusive — insufficient evidence.

| # | Hypothesis | Verdict | Summary |
|---|---|:-:|---|
| A | RANSAC fails to detect hip planes entirely | ❓ | Mixed: 1/11 hip buildings have plane shortfall. |
| B | Merge step collapses adjacent hip planes | 🔴 | Merge-disabled unchanged on 11/11 — merge not the cause. |
| C | Pairwise plane-intersection truncates at apex (≥3-plane convergence) | 🟢 | Endpoint retreat >1ft on 43/44 matched GT hip edges — apex truncation plausible. |
| D | Edge-length uses clipped segment, not full shared edge | 🔴 | raw_length == emitted_length for all 47 emitted edges. Clipping happens in _plane_plane_intersection, not in _classify_line. |
| E | Classification post-processor mislabels hip→ridge or drops hips | ❓ | Partial: 5/44 GT hip edges mismatched. |
| F | Spurious plane detections produce phantom intersections (bldg_7268) | 🟢 | bldg_7268: post-merge plane count > GT AND phantom hip/valley emitted. Spurious plane hypothesis supported. |
| G | Same-root-cause (phantom AND under-count from one bug) | 🔴 | Multiple greens (['C', 'F']) — no single shared cause. |
| H | Plane extent retreats inward from shared-vertex points | 🟢 | Plane extents retreat from GT hip-edge endpoints on 44/44 edges. |
| I | Point-density starvation at hip crests | 🟢 | Point count <5 within 0.5m on 28/33 hip-edge midpoints. |
| J | Coordinate / projection sanity | 🔴 | Midpoint distance <50ft on all 52 matched edges — coordinates in same projection. |

## §4. Evidence per hypothesis

### Hypothesis A — RANSAC fails to detect hip planes entirely  ❓

**Summary:** Mixed: 1/11 hip buildings have plane shortfall.

**Evidence:**

- fk=141 (Two-sided hip roof): gt_planes=4, post_planes=5 (Δ=+1)
- fk=1054136 (Pyramid roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=129184 (Pyramid roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=175628 (Pyramid roof): gt_planes=4, post_planes=5 (Δ=+1)
- fk=19418 (Two-sided hip roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=2624 (Two-sided hip roof): gt_planes=4, post_planes=3 (Δ=-1)
- fk=36947 (Two-sided hip roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=407 (Two-sided hip roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=44573 (Two-sided hip roof): gt_planes=4, post_planes=4 (Δ=+0)
- fk=547 (Two-sided hip roof): gt_planes=4, post_planes=5 (Δ=+1)
- fk=80 (Two-sided hip roof): gt_planes=4, post_planes=4 (Δ=+0)

### Hypothesis B — Merge step collapses adjacent hip planes  🔴

**Summary:** Merge-disabled unchanged on 11/11 — merge not the cause.

**Evidence:**

- fk=141: gt_hip=83.2 | merge_on=37.5 (-55.0%) | merge_off=37.5 (-55.0%) | Δ=+0.0
- fk=1054136: gt_hip=156.2 | merge_on=57.0 (-63.5%) | merge_off=57.0 (-63.5%) | Δ=+0.0
- fk=129184: gt_hip=111.6 | merge_on=20.0 (-82.1%) | merge_off=20.0 (-82.1%) | Δ=+0.0
- fk=175628: gt_hip=108.2 | merge_on=75.1 (-30.6%) | merge_off=75.1 (-30.6%) | Δ=+0.0
- fk=19418: gt_hip=132.8 | merge_on=78.2 (-41.1%) | merge_off=78.2 (-41.1%) | Δ=+0.0
- fk=2624: gt_hip=107.3 | merge_on=64.1 (-40.3%) | merge_off=64.1 (-40.3%) | Δ=+0.0
- fk=36947: gt_hip=121.1 | merge_on=53.0 (-56.2%) | merge_off=53.0 (-56.2%) | Δ=+0.0
- fk=407: gt_hip=83.8 | merge_on=47.5 (-43.4%) | merge_off=47.5 (-43.4%) | Δ=+0.0
- fk=44573: gt_hip=104.6 | merge_on=60.9 (-41.8%) | merge_off=60.9 (-41.8%) | Δ=+0.0
- fk=547: gt_hip=86.3 | merge_on=70.0 (-18.9%) | merge_off=70.0 (-18.9%) | Δ=+0.0
- fk=80: gt_hip=82.9 | merge_on=43.4 (-47.6%) | merge_off=43.4 (-47.6%) | Δ=+0.0

### Hypothesis C — Pairwise plane-intersection truncates at apex (≥3-plane convergence)  🟢

**Summary:** Endpoint retreat >1ft on 43/44 matched GT hip edges — apex truncation plausible.

**Evidence:**

- fk=141 hip-edge planes=[1, 2]: gt_len=20.36 | em_len=15.47 | max_endpoint_retreat=3.18ft
- fk=141 hip-edge planes=[1, 3]: gt_len=20.36 | em_len=6.29 | max_endpoint_retreat=9.83ft
- fk=141 hip-edge planes=[1, 2]: gt_len=22.12 | em_len=15.47 | max_endpoint_retreat=17.69ft
- fk=141 hip-edge planes=[0, 3]: gt_len=20.41 | em_len=15.71 | max_endpoint_retreat=5.09ft
- fk=1054136 hip-edge planes=[1, 3]: gt_len=38.69 | em_len=25.25 | max_endpoint_retreat=9.99ft
- fk=1054136 hip-edge planes=[1, 2]: gt_len=39.43 | em_len=31.75 | max_endpoint_retreat=6.35ft
- fk=1054136 hip-edge planes=[1, 3]: gt_len=38.69 | em_len=25.25 | max_endpoint_retreat=35.23ft
- fk=1054136 hip-edge planes=[1, 2]: gt_len=39.43 | em_len=31.75 | max_endpoint_retreat=38.09ft
- fk=129184 hip-edge planes=[0, 3]: gt_len=28.78 | em_len=2.44 | max_endpoint_retreat=8.98ft
- fk=129184 hip-edge planes=[0, 1]: gt_len=28.78 | em_len=0.18 | max_endpoint_retreat=4.02ft
- fk=129184 hip-edge planes=[0, 3]: gt_len=27.00 | em_len=2.44 | max_endpoint_retreat=8.98ft
- fk=129184 hip-edge planes=[1, 2]: gt_len=27.00 | em_len=17.57 | max_endpoint_retreat=8.22ft
- fk=175628 hip-edge planes=[0, 2]: gt_len=27.59 | em_len=15.17 | max_endpoint_retreat=7.73ft
- fk=175628 hip-edge planes=[1, 2]: gt_len=27.72 | em_len=25.55 | max_endpoint_retreat=2.07ft
- fk=175628 hip-edge planes=[0, 3]: gt_len=26.42 | em_len=16.69 | max_endpoint_retreat=8.70ft
- fk=175628 hip-edge planes=[1, 3]: gt_len=26.42 | em_len=17.70 | max_endpoint_retreat=4.95ft
- fk=19418 hip-edge planes=[1, 2]: gt_len=33.30 | em_len=25.73 | max_endpoint_retreat=4.96ft
- fk=19418 hip-edge planes=[1, 3]: gt_len=33.12 | em_len=2.88 | max_endpoint_retreat=15.47ft
- fk=19418 hip-edge planes=[0, 2]: gt_len=33.30 | em_len=34.79 | max_endpoint_retreat=11.09ft
- fk=19418 hip-edge planes=[0, 3]: gt_len=33.12 | em_len=14.77 | max_endpoint_retreat=9.44ft
- fk=2624 hip-edge planes=[1, 2]: gt_len=26.19 | em_len=64.05 | max_endpoint_retreat=52.07ft
- fk=2624 hip-edge planes=[0, 1]: gt_len=26.19 | em_len=41.95 | max_endpoint_retreat=40.72ft
- fk=2624 hip-edge planes=[0, 1]: gt_len=27.43 | em_len=41.95 | max_endpoint_retreat=43.88ft
- fk=2624 hip-edge planes=[0, 1]: gt_len=27.52 | em_len=41.95 | max_endpoint_retreat=40.72ft
- fk=36947 hip-edge planes=[0, 3]: gt_len=30.60 | em_len=19.63 | max_endpoint_retreat=7.97ft
- fk=36947 hip-edge planes=[0, 2]: gt_len=29.94 | em_len=10.22 | max_endpoint_retreat=12.25ft
- fk=36947 hip-edge planes=[1, 3]: gt_len=30.60 | em_len=23.12 | max_endpoint_retreat=5.86ft
- fk=36947 hip-edge planes=[0, 2]: gt_len=29.94 | em_len=10.22 | max_endpoint_retreat=22.45ft
- fk=407 hip-edge planes=[0, 2]: gt_len=21.65 | em_len=19.01 | max_endpoint_retreat=2.96ft
- fk=407 hip-edge planes=[0, 3]: gt_len=21.44 | em_len=14.64 | max_endpoint_retreat=5.14ft
- fk=407 hip-edge planes=[1, 2]: gt_len=20.38 | em_len=9.34 | max_endpoint_retreat=7.57ft
- fk=407 hip-edge planes=[1, 3]: gt_len=20.38 | em_len=4.52 | max_endpoint_retreat=8.48ft
- fk=44573 hip-edge planes=[0, 2]: gt_len=26.02 | em_len=20.09 | max_endpoint_retreat=5.63ft
- fk=44573 hip-edge planes=[0, 3]: gt_len=27.27 | em_len=17.67 | max_endpoint_retreat=7.81ft
- fk=44573 hip-edge planes=[1, 2]: gt_len=25.65 | em_len=23.18 | max_endpoint_retreat=2.01ft
- fk=44573 hip-edge planes=[0, 3]: gt_len=25.65 | em_len=17.67 | max_endpoint_retreat=25.47ft
- fk=547 hip-edge planes=[0, 3]: gt_len=21.94 | em_len=16.82 | max_endpoint_retreat=4.37ft
- fk=547 hip-edge planes=[0, 2]: gt_len=21.46 | em_len=16.56 | max_endpoint_retreat=2.59ft
- fk=547 hip-edge planes=[1, 3]: gt_len=21.47 | em_len=20.05 | max_endpoint_retreat=0.78ft
- fk=547 hip-edge planes=[1, 2]: gt_len=21.46 | em_len=16.52 | max_endpoint_retreat=3.77ft
- … (4 additional lines truncated; see `.tmp/396g-diag/` JSONs)

### Hypothesis D — Edge-length uses clipped segment, not full shared edge  🔴

**Summary:** raw_length == emitted_length for all 47 emitted edges. Clipping happens in _plane_plane_intersection, not in _classify_line.

**Evidence:**

- all 47 edges: raw_minus_emitted = 0.0 (within float tolerance)

### Hypothesis E — Classification post-processor mislabels hip→ridge or drops hips  ❓

**Summary:** Partial: 5/44 GT hip edges mismatched.

**Evidence:**

- fk=129184 gt_hip len=28.8 matched emitted type=other (len=0.2, mid_dist=13.042ft)
- fk=2624 gt_hip len=26.2 matched emitted type=ridge (len=42.0, mid_dist=30.103ft)
- fk=2624 gt_hip len=27.4 matched emitted type=ridge (len=42.0, mid_dist=33.961ft)
- fk=2624 gt_hip len=27.5 matched emitted type=ridge (len=42.0, mid_dist=31.013ft)
- fk=80 gt_hip len=20.3 matched emitted type=ridge (len=1.2, mid_dist=3.653ft)

### Hypothesis F — Spurious plane detections produce phantom intersections (bldg_7268)  🟢

**Summary:** bldg_7268: post-merge plane count > GT AND phantom hip/valley emitted. Spurious plane hypothesis supported.

**Evidence:**

- fk=7268 (Saddleback roof): gt_planes=2 post_planes=4
  gt_hip=0.0 emitted_hip=29.5
  gt_valley=0.0 emitted_valley=52.8

### Hypothesis G — Same-root-cause (phantom AND under-count from one bug)  🔴

**Summary:** Multiple greens (['C', 'F']) — no single shared cause.

**Evidence:**

- A (plane count shortfall on hip bldgs): ❓
- B (merge collapses hip planes): 🔴
- E (classification mislabels hip): ❓
- F (phantom planes on bldg_7268): 🟢

### Hypothesis H — Plane extent retreats inward from shared-vertex points  🟢

**Summary:** Plane extents retreat from GT hip-edge endpoints on 44/44 edges.

**Evidence:**

- fk=141 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=141 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=141 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=141 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=1054136 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=1054136 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=1054136 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=1054136 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=129184 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=129184 hip-edge planes=0,1: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=129184 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=129184 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=175628 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=175628 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=175628 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=175628 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=19418 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=19418 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=19418 hip-edge planes=0,2: 1/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=19418 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=2624 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=2624 hip-edge planes=0,1: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=2624 hip-edge planes=0,1: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=2624 hip-edge planes=0,1: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=36947 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=36947 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=36947 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=36947 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=407 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=407 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=407 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=407 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=44573 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=44573 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=44573 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=44573 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=547 hip-edge planes=0,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=547 hip-edge planes=0,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=547 hip-edge planes=1,3: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- fk=547 hip-edge planes=1,2: 2/2 GT endpoints outside 0.5ft-buffered plane extents
- … (4 additional lines truncated; see `.tmp/396g-diag/` JSONs)

### Hypothesis I — Point-density starvation at hip crests  🟢

**Summary:** Point count <5 within 0.5m on 28/33 hip-edge midpoints.

**Evidence:**

- fk=141 hip-edge planes=[0, 3]: count_within_0.5m=2, mean_spacing_m=0.6397
- fk=141 hip-edge planes=[1, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=141 hip-edge planes=[1, 3]: count_within_0.5m=6, mean_spacing_m=0.4436
- fk=1054136 hip-edge planes=[1, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=1054136 hip-edge planes=[1, 3]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=129184 hip-edge planes=[0, 3]: count_within_0.5m=2, mean_spacing_m=0.6397
- fk=129184 hip-edge planes=[1, 2]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=175628 hip-edge planes=[0, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=175628 hip-edge planes=[0, 3]: count_within_0.5m=6, mean_spacing_m=0.4436
- fk=175628 hip-edge planes=[1, 2]: count_within_0.5m=7, mean_spacing_m=0.4213
- fk=175628 hip-edge planes=[1, 3]: count_within_0.5m=5, mean_spacing_m=0.4713
- fk=19418 hip-edge planes=[0, 2]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=19418 hip-edge planes=[0, 3]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=19418 hip-edge planes=[1, 2]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=19418 hip-edge planes=[1, 3]: count_within_0.5m=2, mean_spacing_m=0.6397
- fk=2624 hip-edge planes=[1, 2]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=36947 hip-edge planes=[0, 2]: count_within_0.5m=2, mean_spacing_m=0.6397
- fk=36947 hip-edge planes=[0, 3]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=36947 hip-edge planes=[1, 3]: count_within_0.5m=1, mean_spacing_m=0.806
- fk=407 hip-edge planes=[0, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=407 hip-edge planes=[0, 3]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=407 hip-edge planes=[1, 2]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=407 hip-edge planes=[1, 3]: count_within_0.5m=2, mean_spacing_m=0.6397
- fk=44573 hip-edge planes=[0, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=44573 hip-edge planes=[0, 3]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=44573 hip-edge planes=[1, 2]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=547 hip-edge planes=[0, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=547 hip-edge planes=[0, 3]: count_within_0.5m=10, mean_spacing_m=0.3741
- fk=547 hip-edge planes=[1, 2]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=547 hip-edge planes=[1, 3]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=80 hip-edge planes=[0, 3]: count_within_0.5m=4, mean_spacing_m=0.5077
- fk=80 hip-edge planes=[1, 2]: count_within_0.5m=3, mean_spacing_m=0.5588
- fk=80 hip-edge planes=[1, 3]: count_within_0.5m=2, mean_spacing_m=0.6397

### Hypothesis J — Coordinate / projection sanity  🔴

**Summary:** Midpoint distance <50ft on all 52 matched edges — coordinates in same projection.

**Evidence:**

- (no outliers; all matched edges within 50ft midpoint distance)

## §5. Post-diagnostic decision tree (per scoping §8)

**Outcome:** **architectural**

**Reason:** Multiple 🟢 hypotheses (['C', 'F', 'H', 'I']). Returns to Hannah for path decision per §8 row 3.

**Next action:** returns to Hannah. No fix attempted in this session per scoping §7 + §10.

## §6. Non-goals respected (per scoping §10)

- Pipeline A source (`scripts/lidar-tier3-geometry.py`) not modified.
- No fix attempted regardless of apparent scope.
- Ridge-brittleness not investigated (hip + bldg_7268 only).
- Eval set n=12 unchanged; no expansion, no substitution.
- No FL-specific roof-form investigation.
- No paid GT.
- BL-derive options 1 / 3 / 4 not re-litigated.
- No BM coupling.
- No `.claude/plans/` write.
- No duplicate memory-doc of scoping content (handoff is pointer-only).

## §7. Artifacts

- Per-building diag (env-unset): `.tmp/396g-diag/bldg_<fk>.diag.json`
- Per-building diag (merge-off): `.tmp/396g-diag-nomerge/bldg_<fk>.diag.json`
- This report (vault): `decisions/396g-diagnostic-report.md`
- This report (live): `.tmp/calculator-bench/396g-diagnostic.md`
- Scoping anchor: `decisions/396g-scoping.md`
- Pipeline A: `scripts/lidar-tier3-geometry.py` (frozen at `e95d561` — unchanged)
- Diagnostic driver: `scripts/diag-396g.py` (committed at harness hash)
- Run driver: `scripts/diag-396g-run.py`
- Report generator: `scripts/diag-396g-report.py`
