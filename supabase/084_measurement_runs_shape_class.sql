-- PRICING.1c-corrected (2026-04-24) — shape class + source audit columns
-- on measurement_runs. Written on every pipeline insert so post-ship
-- observability distinguishes widget-driven vs auto-classified rows.
--
-- Per scoping decisions/pricing-1c-corrected-scoping.md §0 Q2=c (stable-fields
-- auto + telemetry column). Shape class drives getSizeShapeMultiplier in
-- lib/estimate.ts; source tells us whether the homeowner picked a value or
-- the server auto-classified from Pipeline A geometry.

alter table measurement_runs
  add column if not exists shape_class text
    check (shape_class in ('simple_gable', 'hip', 'complex_multiplane')),
  add column if not exists shape_class_source text
    check (shape_class_source in ('widget', 'auto_complex', 'auto_hip_default'));

-- Nullable: pre-migration rows have no value. Post-migration inserts write
-- both fields atomically from lib/measurement-pipeline.ts.
