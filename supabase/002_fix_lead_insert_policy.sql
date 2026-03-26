-- Fix: Allow anonymous (unauthenticated) users to insert leads.
-- This is needed for contact forms and estimate widgets on public-facing sites.

drop policy if exists "Anyone can submit a lead" on leads;

create policy "Anyone can submit a lead"
  on leads for insert
  to anon, authenticated
  with check (true);

-- Also allow public to read estimate settings (needed for the widget on public sites)
drop policy if exists "Public can read estimate settings for published sites" on estimate_settings;

create policy "Public can read estimate settings for published sites"
  on estimate_settings for select
  to anon, authenticated
  using (true);
