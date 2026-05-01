-- Phase 2 step 1 (2026-05-01) — extend find_building_footprint_area to also
-- return the building polygon as GeoJSON, for use as a results-page overlay.
--
-- Target: GEOSPATIAL project (vfmnjwpjxamtbuehmtrv) ONLY, not prod.
--
-- Non-breaking: this is a CREATE OR REPLACE on the existing function. The
-- return TABLE gains one column (geom_geojson). Existing Phase 1 callers
-- (lib/footprints-api.ts -> getBuildingFootprintArea) read area_sqm and
-- building_id by name and ignore the new column.
--
-- Selection logic preserved from 097: ST_Contains primary, ST_DWithin 50m
-- fallback, with the bbox prefilter pattern from 080 to keep p95 latency
-- under the PostgREST statement_timeout.

create or replace function public.find_building_footprint_area(
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
