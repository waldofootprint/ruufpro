-- supabase/082_solar_delta_pitch_rename.sql
-- Phase B / Session BM CP3 — column rename for trade-convention honesty.
-- Target: PROD project (comcpamnxjtldlnnudqc) ONLY.
--
-- Rationale: migration 081 shipped `solar_delta_pitch_pct`. Semantic
-- interpretation locked at CP3 paste-review: pitch delta = absolute rise/run
-- ratio delta, threshold |Δ| > 0.333. Column name should reflect the unit.
-- Rise/run is how roofers talk about pitch (4/12, 6/12, 10/12), not as a
-- percentage. Column renamed to match.
--
-- Zero rows written yet (migration 081 applied mid-BM CP3; no measurement_runs
-- writes land until CP4). Rename is free.

alter table measurement_runs
  rename column solar_delta_pitch_pct to solar_delta_pitch_ratio;
