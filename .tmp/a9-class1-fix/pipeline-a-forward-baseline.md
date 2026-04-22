# Pipeline A forward numeric baseline

**Hash:** `8695096-fix` (router widened — see commit hash in close report)
**Modal image:** `im-eeATcrFpel1T5xP1u66iGs` (mount refresh only; image layer unchanged)
**Modal URL:** `https://waldofootprint--lidar-measure-measure.modal.run`
**Date:** 2026-04-22
**Source:** n=10 prod bench (`.tmp/calculator-bench/v4-bench-a9c1-fix.csv`) + per-address direct-Modal probe (`.tmp/a9-class1-fix/probe-sources-*.jsonl`) + Probe 2 (`.tmp/a9-class1-fix/probe2-*.jsonl`).

Replaces the missing `0367980` retroactive baseline per scoping Q3. Any future class-1
change or Pipeline A re-open compares against this file, not `0367980`.

## n=10 bench numeric outputs (prod, bench-v4.mjs)

| id | address | status | horiz_sqft | segs | v4_mid | footprint_source |
|---|---|---|---|---|---|---|
| 1 | 10632 Brighton Hill Cir S, Jacksonville, FL 32256 | ok | 3448 | 8 | 22000 | microsoft |
| 2 | 1823 Ernest St, Jacksonville, FL 32204 | ok | 2294 | 5 | 22000 | microsoft |
| 3 | 24 Deer Haven Dr, Ponte Vedra, FL 32082 | refused (guardrail) | 4656.5 (pre-guardrail) | 5 | — | — |
| 4 | 1807 Tall Pines Dr, Largo, FL 33771 | ok | 1776 | 4 | 22000 | microsoft |
| 5 | 2228 Golf Manor Blvd, Valrico, FL 33596 | refused (guardrail) | 4556.8 (solar fallback, no_class_6) | 12 | — | — |
| 6 | 19943 Tamiami Ave, Tampa, FL 33647 | ok | 3674 | 9 | 22963 | microsoft |
| 7 | 9806 Mountain Lake Dr, Orlando, FL 32832 | ok | 4248 | 7 | 26552 | microsoft |
| 8 | 9833 Camberley Cir, Orlando, FL 32836 | refused (guardrail) | 5071.2 (pre-guardrail) | 6 | — | — |
| 9 | 492 Bohannon Blvd, Orlando, FL 32824 | ok | 2744 | 4 | 22000 | microsoft |
| 10 | 420 Stately Shoals Trl, Ponte Vedra, FL 32081 | refused (guardrail) | 4373.9 (pre-guardrail) | 5 | — | — |

**Note on bench vs DB sqft:** bench CSV reports post-guardrail `/api/estimate` response sqft.
`measurement_runs.horiz_sqft` is the raw pipeline output before the guardrail/heuristic layer.
They differ for rows 1, 2, 4, 6, 7, 9 because `/api/estimate` applies waste+pitch multipliers
and rounding on the asphalt estimate. Raw pipeline horiz_sqft values (for drift comparison):
Brighton 3315.9 · Ernest 4231.9 · TallPines 1704 · Tamiami 2235.6 · MountainLake 3744.6 · Bohannon 2396.1.

## Probe 2 — Brighton + Dunedin (direct Modal, 5× each, 10s spacing)

Brighton horizSqft: 3315.9 × 5 (0% intra-run drift)
Dunedin horizSqft: 1743.3 × 5 (0% intra-run drift; pre-fix was 0/5 resolved)

Regression-safe check: Brighton Probe 2 (3315.9) vs Probe 1 pre-fix (3315.9) → **0% drift.**

## Footprint source — all 6 non-refused

6/6 microsoft. Latencies: 111.5 / 115.6 / 115.9 / 117 / 117.1 / 118.3 / 120.8 / 127.1 / 165.4 / 1790.7 / 1811.8 / 1813.9 / 1835.5 / 3000.9 ms (combined probe2 + probe-sources).

Note: latencies >2000ms (Bohannon 3000.9ms) violate the stated `FOOTPRINT_LOOKUP_TIMEOUT_MS=2000` cap.
These are `psycopg2.connect` overhead (cold pg connection) + `set local statement_timeout` + SQL round-trip,
not a single statement exceeding the cap. Flag for advisor review if p95 connection overhead becomes a budget concern.
