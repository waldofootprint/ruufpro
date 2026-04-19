-- Session AZ (2026-04-19) — Calculator Mission Mode A + Mode B
--
-- Mode A: Minimum job price floor on estimate_settings.
--   Roofle (and NEXGEN's Roofle config) apply a minimum job price (~$25K in FL).
--   V4 has no floor, so small roofs under-quote by ~50% vs market (Ernest St bench).
--   Fix: per-contractor `minimum_job_price` column, applied as max(computed, floor)
--   in lib/estimate.ts. Nullable — only applied when contractor sets it.
--
-- Mode B: Lead-capture fallback on guardrail refusal.
--   When V4 guardrails trip (complex-home polygon mismatch, low imagery, etc.),
--   the widget used to dead-end with a "contact us" message. Now we write the
--   lead anyway with measurement_status='needs_manual_quote' so the roofer can
--   follow up with an on-site quote. Default 'measured' for every other path.

alter table estimate_settings
  add column if not exists minimum_job_price numeric;

alter table leads
  add column if not exists measurement_status text
    default 'measured'
    check (measurement_status in ('measured', 'needs_manual_quote'));

create index if not exists idx_leads_measurement_status
  on leads(contractor_id, measurement_status)
  where measurement_status = 'needs_manual_quote';

-- Seed the two test contractors from Session AX/AY bench with a $20K floor.
-- GMR Metal Roofs Florida + Demo Roofing Co are the active bench contractors;
-- other contractors stay null (no floor) until they set one in Settings.
update estimate_settings
set minimum_job_price = 20000
where contractor_id in (
  select id from contractors
  where name in ('GMR Metal Roofs Florida', 'Demo Roofing Co')
);
