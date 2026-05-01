-- Phase 1 shippable calculator (2026-05-01) — Footprints-direct fallback
-- for /api/estimate when Google Solar returns null.
--
-- Target: GEOSPATIAL project (vfmnjwpjxamtbuehmtrv) ONLY, not prod.
-- Coexists with the existing footprint_lookup() function from 080. That
-- function returns geometry GeoJSON for nearest-within-30m use cases. This
-- one returns area in square meters for the calculator-fallback use case
-- (we only need an area number, never the polygon).
--
-- Lookup strategy:
--   1. ST_Contains — point falls inside a polygon. Cheap, GIST-indexed,
--      handles the common case (geocode lands on a building).
--   2. ST_DWithin nearest-within-50m — handles edges where the geocoded
--      point falls between buildings (driveways, edges of large parcels).
--      50m matches the calculator's tolerance for "this point is on the
--      building"; existing footprint_lookup uses 30m for a different
--      latency budget.
--
-- Returns NULL when no candidate is found within either bound.
--
-- Column names per actual schema (079): geom (not "geometry"), id (bigint).

create or replace function public.find_building_footprint_area(
  p_lat double precision,
  p_lng double precision
)
returns table(area_sqm double precision, building_id bigint)
language plpgsql stable as $$
declare
  pt geometry := st_setsrid(st_makepoint(p_lng, p_lat), 4326);
begin
  -- 1. Containment first (point inside polygon).
  return query
    select st_area(bf.geom::geography) as area_sqm, bf.id as building_id
    from building_footprints bf
    where st_contains(bf.geom, pt)
    order by st_area(bf.geom::geography) desc
    limit 1;

  if found then
    return;
  end if;

  -- 2. Nearest-neighbor within 50m. Bbox prefilter on bare geometry uses the
  --    GIST index; final distance check on geography drops bbox false
  --    positives. Conversion: 50 m / ~95000 m-per-degree at FL latitudes
  --    (worst case 31°N), with a 1.2× safety margin so the bbox never
  --    excludes a candidate the geography filter would accept.
  return query
    with candidate as (
      select bf.id, bf.geom
      from building_footprints bf
      where st_dwithin(bf.geom, pt, (50::double precision / 95000.0) * 1.2)
      order by bf.geom <-> pt
      limit 1
    )
    select st_area(c.geom::geography) as area_sqm, c.id as building_id
    from candidate c
    where st_distance(c.geom::geography, pt::geography) <= 50;
end;
$$;

comment on function public.find_building_footprint_area(double precision, double precision) is
  'Phase 1 shippable calculator (2026-05-01): ST_Contains primary + ST_DWithin 50m fallback. Returns area in square meters; caller converts to sqft (× 10.764). Used by /api/estimate Footprints fallback when Solar returns null.';
