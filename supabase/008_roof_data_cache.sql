-- Roof data cache: stores Solar API results so we never pay for the same address twice.
-- Multiple roofers serving the same neighborhood = one API call, not dozens.

create table roof_data_cache (
  id uuid primary key default gen_random_uuid(),
  address_hash text unique not null,
  address_text text not null,
  roof_area_sqft numeric not null,
  pitch_degrees numeric,
  num_segments integer,
  segment_data jsonb,
  ridge_length_ft numeric,
  hip_length_ft numeric,
  valley_length_ft numeric,
  perimeter_ft numeric,
  source text default 'google_solar',
  created_at timestamptz default now()
);

-- Allow server-side code to read and write cache (public access for server anon key)
alter table roof_data_cache enable row level security;

create policy "Anyone can read cache"
  on roof_data_cache for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert cache"
  on roof_data_cache for insert
  to anon, authenticated
  with check (true);

-- Calibration fields on leads table
alter table leads add column if not exists actual_price numeric;
alter table leads add column if not exists estimate_accuracy_pct numeric;
alter table leads add column if not exists accuracy_feedback text
  check (accuracy_feedback in ('too_low', 'about_right', 'too_high'));
