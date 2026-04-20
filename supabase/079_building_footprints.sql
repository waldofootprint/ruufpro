-- Phase B / Session BJ — MS Global Building Footprints (FL subset)
-- Primary footprint source for LiDAR calculator pipeline. Replaces Overpass as runtime dependency.
-- Pipeline: MS lookup → class-6 self-derive → Overpass circuit-breaker.

create extension if not exists postgis;

create table if not exists building_footprints (
  id bigserial primary key,
  geom geometry(Polygon, 4326) not null,
  state_code text not null default 'FL',
  source text not null default 'microsoft_us_building_footprints',
  vintage_year int,
  loaded_at timestamptz not null default now()
);

create index if not exists building_footprints_geom_gist
  on building_footprints using gist (geom);

create index if not exists building_footprints_state_idx
  on building_footprints (state_code);

-- Circuit-breaker state for Overpass last-resort fallback.
create table if not exists footprint_source_health (
  source text primary key,
  consecutive_failures int not null default 0,
  circuit_opened_at timestamptz,
  last_failure_at timestamptz,
  last_success_at timestamptz
);

insert into footprint_source_health (source) values ('overpass') on conflict do nothing;

-- Per-address footprint cache (near-permanent; buildings don't move).
create table if not exists footprint_cache (
  cache_key text primary key,                 -- "{lat:.6f},{lng:.6f}"
  geom geometry(Polygon, 4326) not null,
  source text not null,                       -- 'microsoft' | 'selfderive' | 'overpass'
  build_year_hint int,                        -- if known (MS doesn't carry; future parcel API does)
  resolved_at timestamptz not null default now()
);

create index if not exists footprint_cache_geom_gist
  on footprint_cache using gist (geom);

-- Lookup helper: nearest footprint to a point within N meters.
create or replace function footprint_lookup(lat double precision, lng double precision, max_dist_m int default 30)
returns table (id bigint, dist_m double precision, geom_geojson jsonb) as $$
  select
    bf.id,
    st_distance(bf.geom::geography, st_setsrid(st_makepoint(lng, lat), 4326)::geography) as dist_m,
    st_asgeojson(bf.geom)::jsonb as geom_geojson
  from building_footprints bf
  where st_dwithin(
    bf.geom::geography,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    max_dist_m
  )
  order by bf.geom <-> st_setsrid(st_makepoint(lng, lat), 4326)
  limit 1;
$$ language sql stable;

comment on table building_footprints is 'Phase B (Session BJ): MS Global Building Footprints FL subset. GIST index for <100ms point-in-polygon lookup. Vintage ~2018. Post-2018 construction falls through to self-derive or Overpass fallback.';
