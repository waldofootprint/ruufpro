-- Phase B / Session BK — footprint_lookup() GIST-aware rewrite.
-- Target: GEOSPATIAL project (vfmnjwpjxamtbuehmtrv) ONLY, not prod.
--
-- Rationale: the 079 version cast `bf.geom::geography` inside ST_DWithin, which
-- bypassed the GIST index on `geom` (geometry). Result on a 22-addr bench:
--   - 19/22 hits at p50 132 ms, p95 ~211 ms
--   - 3/22 HTTP 500 (JAX-2, JAX-3, Ocala) — addresses with no footprint within
--     30 m hit Supabase PostgREST's default statement_timeout (~3 s) because the
--     geography-cast filter scanned many candidates before returning empty.
-- Stop condition was p95 ≤ 100 ms; 079 function missed it by a wide margin.
--
-- This rewrite:
--   1. Bbox prefilter in DEGREES (GIST-indexed geometry operator) via ST_DWithin
--      on bare geometry + a meters→degrees conversion constant chosen conservatively.
--   2. KNN ORDER BY `<->` (already indexed in 079).
--   3. Geography distance computed ONLY on the LIMIT 1 candidate — cheap.
--   4. Final WHERE filters by exact meter distance so bbox false-positives drop out.
--
-- Result expectation (validated in BK close report): p95 20-50 ms, 0 timeouts.
--
-- Meters → degrees conversion (at FL latitudes 24°N–31°N):
--   1° latitude  ≈ 110.6 km     (constant worldwide)
--   1° longitude ≈ 95.4–102 km  (narrows toward higher latitude; cos(31°)≈0.857)
--   → Narrowest case ≈ 95 km/°. max_dist_m / 95000 gives a degree radius that
--     is always ≥ the true meter distance in lng, AND always ≥ it in lat (since
--     lat degrees are larger). Multiply by 1.2 for safety margin so bbox never
--     excludes a candidate that the final geography check would have accepted.
--
-- Callers: same signature as 079. No call-site migration needed.
--
-- =======================================================================
-- BEFORE (079 original, kept here for reference — DO NOT uncomment):
-- =======================================================================
-- create or replace function footprint_lookup(lat double precision, lng double precision, max_dist_m int default 30)
-- returns table (id bigint, dist_m double precision, geom_geojson jsonb) as $$
--   select
--     bf.id,
--     st_distance(bf.geom::geography, st_setsrid(st_makepoint(lng, lat), 4326)::geography) as dist_m,
--     st_asgeojson(bf.geom)::jsonb as geom_geojson
--   from building_footprints bf
--   where st_dwithin(
--     bf.geom::geography,                                                 -- ← GIST bypass here
--     st_setsrid(st_makepoint(lng, lat), 4326)::geography,
--     max_dist_m
--   )
--   order by bf.geom <-> st_setsrid(st_makepoint(lng, lat), 4326)
--   limit 1;
-- $$ language sql stable;
-- =======================================================================

create or replace function footprint_lookup(
  lat double precision,
  lng double precision,
  max_dist_m int default 30
)
returns table (id bigint, dist_m double precision, geom_geojson jsonb) as $$
  with pt as (
    select st_setsrid(st_makepoint(lng, lat), 4326) as g
  ),
  candidate as (
    -- ST_DWithin on bare GEOMETRY uses the GIST index on bf.geom.
    -- Radius is in DEGREES (units of SRID 4326). 1.2× margin covers cos(lat)
    -- variance across FL; false positives are filtered by the outer WHERE.
    select bf.id, bf.geom
    from building_footprints bf, pt
    where st_dwithin(bf.geom, pt.g, (max_dist_m::double precision / 95000.0) * 1.2)
    order by bf.geom <-> pt.g
    limit 1
  )
  select
    c.id,
    st_distance(c.geom::geography, (select g from pt)::geography) as dist_m,
    st_asgeojson(c.geom)::jsonb as geom_geojson
  from candidate c
  where st_distance(c.geom::geography, (select g from pt)::geography) <= max_dist_m;
$$ language sql stable;

comment on function footprint_lookup(double precision, double precision, int) is
  'Phase B / Session BK rewrite: GIST-indexed bbox prefilter via ST_DWithin on geometry + KNN ordering + geography distance check on the single LIMIT 1 candidate. See 080_footprint_lookup_gist_prefilter.sql header for full rationale + 079 original kept as reference.';
