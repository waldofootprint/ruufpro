# lidar-measure (Modal service)

Pipeline A runtime surface. Wraps `scripts/lidar-tier3-geometry.py` @ `0367980` (frozen, re-opened 2026-04-22 per `decisions/pipeline-a-reopen-inlier-residual.md` — output-JSON surface only, bit-identical).

## Deploy

```bash
pip install modal
modal token new           # one-time browser OAuth
modal deploy services/lidar-measure/app.py
```

`modal deploy` prints the endpoint URL. Format: `https://<account>--lidar-measure-measure.modal.run`.

Copy that URL into Vercel + `.env.local` as `LIDAR_MEASURE_URL`:

```bash
vercel env add LIDAR_MEASURE_URL production
# paste URL
echo 'LIDAR_MEASURE_URL=https://...modal.run' >> .env.local
```

## Invoke

```
POST <url>
Content-Type: application/json
{ "lat": 30.33, "lng": -81.66, "address": "10632 Brighton Hill Cir S, Jacksonville, FL 32256" }
```

Response shape matches TS `LidarResult` in `lib/measurement-pipeline.types.ts`.

## Outcome codes

| Code | Meaning |
|---|---|
| `ok` | Pipeline A completed, measurements returned |
| `tnm_5xx_or_timeout` | USGS TNM API unreachable |
| `laz_download_failed` | TNM returned a URL but LAZ fetch failed |
| `no_class_6` | LiDAR tile has too few roof points |
| `no_footprint_lidar` | No LiDAR coverage OR no OSM building footprint |
| `pipeline_crash` | Unhandled error (also used for wall-clock timeouts at the harness layer) |

## Smoke

```bash
LIDAR_MEASURE_URL=<url> GOOGLE_MAPS_API_KEY=... node scripts/smoke-lidar-modal.mjs
```

## Coverage (FL residential)

**FL LiDAR coverage: 97.0% of residential addresses (probe 2026-05-03, n=200, Manatee County).**

200-address random sample from `property_pipeline_candidates` (Manatee County
residential), geocoded via Google + run through the production Modal pipeline:

| Outcome | n | % |
|---|---|---|
| `ok` | 194 | 97.0% |
| `no_footprint_lidar` | 4 | 2.0% |
| `http_500` | 2 | 1.0% |

Implications for M2 fallback design:
- LiDAR alone covers 97% of FL residential homes. The Solar+Footprints+homeowner-pitch
  fallback chain is needed only for the ~3% LiDAR can't measure.
- Statewide variance possible — Manatee is the only sampled county.
- Re-run via `node scripts/probe-lidar-coverage.mjs --n 200`.


## Cost / warm-pool

Deployed with `keep_warm=1` per Track A.9-class-2 §3.1 (2026-04-22). Warmth
floor closes the ~22s Brighton-pattern cold-start crash (A.8-timeout-fix §9).
Projected cost ceiling $20/mo per scoping §3.7.

## Port-out trigger

Per Track A.1 §7: if Modal bill exceeds $100/mo or hits a vendor rate limit,
open a fresh `/calculator-advisor` session to re-pick the surface (Fly.io is
the documented fallback).
