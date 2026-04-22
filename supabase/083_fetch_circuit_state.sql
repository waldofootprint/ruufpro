-- Track A.10 §7.2 — circuit breaker state per fetch path.
--
-- 2 rows (path='ept', path='tnm'), service-role-only. Used by the Modal
-- lidar-measure app's circuit_breaker.py to persist open/closed/half_open
-- state across ephemeral Modal containers.
--
-- v1 ships with in-process fallback — this table is the forward-spec so
-- cross-container persistence activates with a Modal Secret + ~5-line
-- module change, no schema churn needed.

create table if not exists fetch_circuit_state (
  path text primary key check (path in ('ept', 'tnm')),
  state text not null default 'closed' check (state in ('closed', 'open', 'half_open')),
  consecutive_failures integer not null default 0,
  first_failure_at timestamptz,
  opened_at timestamptz,
  cooldown_seconds integer not null default 120,
  updated_at timestamptz not null default now()
);

-- Seed the two rows so upserts from the module can use PK collision.
insert into fetch_circuit_state (path) values ('ept') on conflict (path) do nothing;
insert into fetch_circuit_state (path) values ('tnm') on conflict (path) do nothing;

alter table fetch_circuit_state enable row level security;

-- Service role is the only actor — Modal function carries the service-role key.
-- No policies for anon/authenticated; RLS blocks by default.

-- updated_at trigger so callers can cheaply detect state change
create or replace function fetch_circuit_state_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fetch_circuit_state_updated_at on fetch_circuit_state;
create trigger fetch_circuit_state_updated_at
  before update on fetch_circuit_state
  for each row execute function fetch_circuit_state_touch_updated_at();

comment on table fetch_circuit_state is
  'Track A.10 §7.2 — cross-container circuit breaker for EPT + TNM LiDAR fetch paths. Service-role only.';
