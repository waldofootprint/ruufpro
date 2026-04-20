# Phase B — Footprint Stack (Session BJ)

Standalone Python module. Not wired into `lib/` or `app/` — that's BM (runtime).

## Components

| File | Role |
|---|---|
| `ms_download.py` | Download MS Global Building Footprints FL subset (GeoJSON from GitHub release, ~500MB zip → ~1.5GB) |
| `ms_load.py` | ETL: stream GeoJSON → PostGIS `building_footprints` via psycopg2 COPY |
| `footprint_lookup.py` | Main lookup module. MS → self-derive → Overpass with circuit-breaker |
| `build_year_router.py` | Routing: build_year ≥ 2019 → Solar, else LiDAR stack + Solar parallel |
| `bench_ms_lookup.py` | 22-address FL benchmark (p95 ≤ 100ms stop condition) |
| `test_selfderive.py` | Unit test self-derive fallback on 4 Phase A tiles (1, 2, 3, 5) |
| `test_overpass_breaker.py` | Forced-failure test for circuit-breaker behavior |

## Migration

`supabase/079_building_footprints.sql` — PostGIS + `building_footprints` + `footprint_source_health` + `footprint_cache` + `footprint_lookup()` function.

## Run order

```bash
# 1. Apply migration (Supabase management API or `psql`)
psql "$DATABASE_URL" -f supabase/079_building_footprints.sql

# 2. Download MS FL subset (~500MB zip, run once)
python3 scripts/phase_b/ms_download.py --state Florida --out .cache/ms_footprints

# 3. Load into PostGIS (streams — no need to hold whole file in memory)
python3 scripts/phase_b/ms_load.py --geojson .cache/ms_footprints/Florida.geojson --batch 5000

# 4. Benchmark
python3 scripts/phase_b/bench_ms_lookup.py

# 5. Self-derive fallback test
python3 scripts/phase_b/test_selfderive.py

# 6. Circuit-breaker test
python3 scripts/phase_b/test_overpass_breaker.py
```

## Hard rules observed

- Freeze-code-before-reports: commit BEFORE bench report publishes.
- No-fix-loop: one pass. Results are what they are.
- Lib/app untouched this session.

## Integration boundary (for BM session)

`footprint_lookup.resolve(lat, lng) -> FootprintResult` is the single entry point. BM wires this into the TypeScript `/api/estimate` pathway via a Python sidecar or re-implements the lookup in Node (PostGIS query is SQL, trivial to port).
