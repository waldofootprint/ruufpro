-- Prospect support: allow tool-generated contractor/site records for cold email outreach.
-- These records have no user_id (no auth account) and are flagged as prospects.

-- 1. Make user_id nullable so tools can insert without an auth user
alter table contractors alter column user_id drop not null;

-- 2. Add prospect tracking columns
alter table contractors add column if not exists is_prospect boolean default false;
alter table contractors add column if not exists prospect_expires_at timestamptz;

-- 3. Add blueprint to the sites template constraint
alter table sites drop constraint if exists sites_template_check;
alter table sites add constraint sites_template_check
  check (template in (
    'storm_insurance', 'residential', 'full_service',
    'modern_clean', 'chalkboard', 'blueprint',
    'bold_confident', 'warm_trustworthy'
  ));

-- 4. Allow public read of prospect contractors (needed for /preview/[slug] route)
create policy "Public can read prospect contractors"
  on contractors for select
  using (is_prospect = true);

-- 5. Prospect view tracking table
create table prospect_views (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  slug text not null,
  viewed_at timestamptz default now(),
  ip_hash text,
  user_agent text,
  referrer text
);

alter table prospect_views enable row level security;

-- Anyone can insert a view (tracking pixel from preview page)
create policy "Anyone can track a prospect view"
  on prospect_views for insert
  with check (true);

-- Only authenticated users (Hannah) can read views
create policy "Authenticated users can read prospect views"
  on prospect_views for select
  using (auth.role() = 'authenticated');

-- 6. Index for fast view lookups
create index prospect_views_slug_idx on prospect_views(slug);
create index prospect_views_site_id_idx on prospect_views(site_id);
create index contractors_is_prospect_idx on contractors(is_prospect) where is_prospect = true;
