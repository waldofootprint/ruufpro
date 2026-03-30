-- Dashboard V2: Add lead qualification + roof intel columns
-- All nullable so existing leads are unaffected.

-- Lead qualification (from widget form)
alter table leads add column if not exists timeline text
  check (timeline in ('no_timeline', '1_3_months', 'now'));

alter table leads add column if not exists financing_interest text
  check (financing_interest in ('yes', 'no', 'maybe'));

-- Speed-to-lead tracking
alter table leads add column if not exists contacted_at timestamptz;

-- Roof intel data (from estimate engine)
alter table leads add column if not exists estimate_pitch_degrees numeric;
alter table leads add column if not exists estimate_segments integer;
