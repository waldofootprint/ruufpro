-- supabase/081_measurement_pipeline.sql
-- Phase B / Session BM — runtime harness telemetry + feature-flag surface.
-- Target: PROD project (comcpamnxjtldlnnudqc) ONLY, not geospatial.
--
-- Scoping: decisions/phase-b-scoping.md §3 + §5 (rollout gates).
-- BM close will carry this migration hash in the report header per
-- feedback_freeze_code_before_reports.md.
--
-- Three surfaces land here:
--   1. feature_flags — key/value, per-request read, no process-boot cache.
--      Global kill-switch lives here. Flip-first-investigate-second requires
--      DB-side storage (env flip is process-boot only).
--   2. contractors.lidar_enabled — per-contractor opt-in for 1→3→8→full
--      staged rollout per scoping §5 Gate 3.
--   3. measurement_runs — one row per /api/estimate request that reaches
--      the measurement pipeline. Powers Gate-2 cold p95, Gate-3 rollout
--      approval report, and §5 watchpoint telemetry.
--
-- BM ships with lidar_pipeline_global = false (kill-switch armed off).
-- LiDAR adapter is stubbed in BM; real Python service = BN blocker, logged
-- in decisions/phase-b-lidar-runtime-surface.md.

-- ---------------------------------------------------------------------------
-- 1. feature_flags — runtime-toggleable flags, read per-request
-- ---------------------------------------------------------------------------

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

-- Seed the global LiDAR kill-switch. Armed OFF — BM ships Solar-only.
insert into feature_flags (key, enabled, notes)
values (
  'lidar_pipeline_global',
  false,
  'Global kill-switch for LiDAR measurement pathway. BM ships off; per-contractor opt-in via contractors.lidar_enabled gates which contractors see it once global flips on. Flip off any time to route all traffic to Solar (Mode B unaffected).'
)
on conflict (key) do nothing;

-- No RLS on feature_flags — service-role reads only. Client never touches it.
alter table feature_flags enable row level security;
-- deny-all default policy (no policies = locked down under RLS)

-- ---------------------------------------------------------------------------
-- 2. contractors.lidar_enabled — per-contractor staged rollout
-- ---------------------------------------------------------------------------

alter table contractors
  add column if not exists lidar_enabled boolean not null default false;

-- No seeding. BN picks the first contractor per scoping §5.

-- ---------------------------------------------------------------------------
-- 3. measurement_runs — per-request telemetry
-- ---------------------------------------------------------------------------

create table if not exists measurement_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Correlation (all nullable — widget runs may pre-date lead capture)
  contractor_id uuid references contractors(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  widget_event_id uuid,  -- references widget_events(id) loosely; not FK-enforced
                         -- because widget_events churns and we want telemetry to survive

  -- Request input
  address text,
  lat numeric,
  lng numeric,

  -- Outcome routing
  pipeline text not null
    check (pipeline in ('lidar', 'solar', 'mode_b')),
  xcheck_status text not null
    check (xcheck_status in (
      'xcheck_ok_strong',
      'xcheck_ok_borderline',
      'xcheck_warn_high',
      'xcheck_warn_borderline_disagree',
      'xcheck_single_borderline',
      'single_source:solar',
      'xcheck_fail:no_source',
      'xcheck_fail:no_source_lidar_failed'
    )),
  mode_b_tripped boolean not null default false,

  -- LiDAR outcome code — scoping §2 failure taxonomy + ok.
  -- NULL = LiDAR path never attempted (kill-switch off, or contractor not opted in).
  -- Non-null = attempted-with-outcome. Clean filter semantics.
  lidar_outcome text
    check (lidar_outcome in (
      'ok',
      'tnm_5xx_or_timeout',
      'laz_download_failed',
      'no_class_6',
      'no_footprint_lidar',
      'pipeline_crash'
    )),

  -- Cache tier that served this request (Gate 2 + L1-hit watchpoint)
  cache_tier text
    check (cache_tier in ('l1_hit', 'l2_hit', 'cold', 'na_solar_only')),

  -- LiDAR-internal confidence signals (scoping §3 gate table)
  lidar_inlier_ratio numeric,        -- 🟢 ≥0.70 / 🟡 0.50-0.70 / 🔴 <0.50
  lidar_density numeric,             -- pts/m²; 🟢 ≥3 / 🟡 1-3 / 🔴 <1
  lidar_footprint_coverage numeric,  -- 🟢 ≥0.85 / 🟡 0.70-0.85 / 🔴 <0.70
  lidar_residual numeric,            -- TELEMETRY ONLY in v1; not gated
  lidar_gate_status text
    check (lidar_gate_status in ('strong', 'borderline', 'fail', 'n/a')),

  -- Solar cross-check deltas (nullable when single-source)
  solar_delta_horiz_sqft_pct numeric,
  solar_delta_pitch_pct numeric,

  -- Final shipped measurements (pre-override)
  horiz_sqft numeric,
  pitch numeric,
  segment_count integer,
  perimeter_ft numeric,

  -- Latency (Gate 2 cold p95 watchpoint)
  lidar_ms integer,
  solar_ms integer,
  total_ms integer,

  -- Rollout-debug correlation
  flags_snapshot jsonb
);

-- Indexes tuned for the three reporting paths BN→BQ needs:
--   (a) per-contractor trip-rate + pipeline distribution
--   (b) xcheck_status histograms
--   (c) cold-path latency p95 via cache_tier filter
create index if not exists idx_measurement_runs_contractor_created
  on measurement_runs(contractor_id, created_at desc);

create index if not exists idx_measurement_runs_xcheck_status
  on measurement_runs(xcheck_status, created_at desc);

create index if not exists idx_measurement_runs_pipeline_cache
  on measurement_runs(pipeline, cache_tier, created_at desc);

-- RLS: service-role writes only, no client reads in v1.
-- Dashboard Insights surfacing = follow-up session per scoping §3.
alter table measurement_runs enable row level security;
-- no policies = deny-all for anon/authenticated
