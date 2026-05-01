-- Phase 2 step 1 (2026-05-01) — extend find_building_footprint_area to also
-- return the building polygon as GeoJSON, for use as a results-page overlay.
--
-- Target: GEOSPATIAL project (vfmnjwpjxamtbuehmtrv) ONLY, not prod.
--
-- DROP-then-CREATE pattern: Postgres rejects CREATE OR REPLACE FUNCTION when
-- the RETURNS TABLE shape changes (adding `geom_geojson` is a return-type
-- change). Wrapped in BEGIN/COMMIT so the brief window where the function
-- is absent is atomic — no caller can hit a half-state.
--
-- Application-side compatibility: the existing Phase 1 caller
-- (lib/footprints-api.ts -> getBuildingFootprintArea) reads fields by name,
-- so the added `geom_geojson` column is purely additive at the JS level.
--
-- Selection logic preserved from 097: ST_Contains primary, ST_DWithin 50m
-- fallback, with the bbox prefilter pattern from 080 to keep p95 latency
-- under the PostgREST statement_timeout.

begin;

drop function if exists public.find_building_footprint_area(double precision, double precision);

create function public.find_building_footprint_area(
  p_lat double precision,
  p_lng double precision
)
returns table(
  area_sqm double precision,
  building_id bigint,
  geom_geojson jsonb
)
language plpgsql stable as $$
declare
  pt geometry := st_setsrid(st_makepoint(p_lng, p_lat), 4326);
begin
  -- 1. Containment first (point inside polygon).
  return query
    select
      st_area(bf.geom::geography)        as area_sqm,
      bf.id                              as building_id,
      st_asgeojson(bf.geom)::jsonb       as geom_geojson
    from building_footprints bf
    where st_contains(bf.geom, pt)
    order by st_area(bf.geom::geography) desc
    limit 1;

  if found then
    return;
  end if;

  -- 2. Nearest-neighbor within 50m. Bbox prefilter on bare geometry uses the
  --    GIST index; final distance check on geography drops bbox false
  --    positives. See 080 header for the meters-to-degrees rationale.
  return query
    with candidate as (
      select bf.id, bf.geom
      from building_footprints bf
      where st_dwithin(bf.geom, pt, (50::double precision / 95000.0) * 1.2)
      order by bf.geom <-> pt
      limit 1
    )
    select
      st_area(c.geom::geography)         as area_sqm,
      c.id                               as building_id,
      st_asgeojson(c.geom)::jsonb        as geom_geojson
    from candidate c
    where st_distance(c.geom::geography, pt::geography) <= 50;
end;
$$;

comment on function public.find_building_footprint_area(double precision, double precision) is
  'Phase 2 step 1 (2026-05-01): extends 097 to also return geom_geojson for results-page polygon overlay. Selection logic unchanged: ST_Contains primary + ST_DWithin 50m fallback.';

commit;
