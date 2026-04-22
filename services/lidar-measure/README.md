# lidar-measure (Modal service)

Pipeline A runtime surface. Wraps `scripts/lidar-tier3-geometry.py` @ `e95d561` (frozen).

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

## Cost / warm-pool

Deployed **cold-only** per Track A.1 §7 (Hannah 2026-04-22, Option a). Cold start
3-8 s is inside the 20 s cold-path p95 budget.

Flip to warm on the A.8 pilot session if smoke cost analysis supports it:

```python
@app.function(image=image, timeout=60, keep_warm=1)
```

## Port-out trigger

Per Track A.1 §7: if Modal bill exceeds $100/mo or hits a vendor rate limit,
open a fresh `/calculator-advisor` session to re-pick the surface (Fly.io is
the documented fallback).
