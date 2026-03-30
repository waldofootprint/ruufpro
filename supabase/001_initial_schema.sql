-- RuufPro Initial Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- CONTRACTORS (the roofer account)
-- ============================================================
create table contractors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  business_name text not null,
  phone text not null,
  city text not null,
  state text not null,
  zip text,
  address text,
  business_type text not null check (business_type in ('storm_insurance', 'residential', 'full_service')),

  -- Optional profile fields (roofer fills in later)
  tagline text,
  logo_url text,
  service_area_cities text[],
  years_in_business integer,
  license_number text,

  -- Trust signal checkboxes
  is_licensed boolean default false,
  is_insured boolean default false,
  gaf_master_elite boolean default false,
  owens_corning_preferred boolean default false,
  certainteed_select boolean default false,
  bbb_accredited boolean default false,
  bbb_rating text,
  offers_financing boolean default false,
  warranty_years integer,

  -- Paid services (each independent)
  has_estimate_widget boolean default false,
  has_review_automation boolean default false,
  has_auto_reply boolean default false,
  has_seo_pages boolean default false,
  has_custom_domain boolean default false,

  -- Billing
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Widget-only customers (already have their own site)
  has_roofready_site boolean default true,
  external_site_url text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SITES (the generated website — only for roofers using our site)
-- ============================================================
create table sites (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  slug text unique not null,
  template text not null check (template in ('storm_insurance', 'residential', 'full_service')),
  published boolean default false,

  -- Content (all optional — smart defaults used when empty)
  hero_headline text,
  hero_cta_text text,
  about_text text,
  services text[],
  gallery_images text[],
  reviews jsonb default '[]',

  -- SEO (auto-generated from business info if not set)
  meta_title text,
  meta_description text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- LEADS (from contact forms AND estimate widget)
-- ============================================================
create table leads (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  site_id uuid references sites(id) on delete set null,

  name text not null,
  email text,
  phone text,
  address text,
  message text,

  source text not null check (source in ('contact_form', 'estimate_widget', 'external_widget')),
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),

  -- Estimate data (populated when source is estimate_widget or external_widget)
  estimate_low numeric,
  estimate_high numeric,
  estimate_material text,
  estimate_roof_sqft numeric,

  created_at timestamptz default now()
);

-- ============================================================
-- ESTIMATE SETTINGS (contractor's widget pricing config)
-- ============================================================
create table estimate_settings (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade unique not null,

  -- Price per sqft by material (low and high range)
  asphalt_low numeric,
  asphalt_high numeric,
  metal_low numeric,
  metal_high numeric,
  tile_low numeric,
  tile_high numeric,
  flat_low numeric,
  flat_high numeric,

  -- Service area for widget
  service_zips text[],

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- CONTRACTORS: owners can read/update their own row
alter table contractors enable row level security;

create policy "Contractors can read own row"
  on contractors for select
  using (auth.uid() = user_id);

create policy "Contractors can update own row"
  on contractors for update
  using (auth.uid() = user_id);

-- SITES: owners can CRUD their own sites, public can read published sites
alter table sites enable row level security;

create policy "Contractors can manage own sites"
  on sites for all
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Public can read published sites"
  on sites for select
  using (published = true);

-- LEADS: owners can read their leads, public can insert (contact forms)
alter table leads enable row level security;

create policy "Contractors can read own leads"
  on leads for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Contractors can update own leads"
  on leads for update
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Anyone can submit a lead"
  on leads for insert
  with check (true);

-- ESTIMATE SETTINGS: owners can CRUD their own settings
alter table estimate_settings enable row level security;

create policy "Contractors can manage own estimate settings"
  on estimate_settings for all
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Public can read estimate settings for published sites"
  on estimate_settings for select
  using (contractor_id in (
    select contractor_id from sites where published = true
  ));

-- ============================================================
-- AUTO-CREATE CONTRACTOR ROW ON SIGNUP
-- When a user signs up via Supabase Auth, this trigger
-- automatically creates a contractors row linked to their auth user.
-- The roofer fills in the rest during onboarding.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into contractors (user_id, email, business_name, phone, city, state, business_type)
  values (
    new.id,
    new.email,
    '',  -- filled in during onboarding
    '',  -- filled in during onboarding
    '',  -- filled in during onboarding
    '',  -- filled in during onboarding
    'residential'  -- default, changed during onboarding
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- UPDATED_AT AUTO-REFRESH
-- Automatically updates the updated_at column when a row changes.
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contractors_updated_at
  before update on contractors
  for each row execute function update_updated_at();

create trigger sites_updated_at
  before update on sites
  for each row execute function update_updated_at();

create trigger estimate_settings_updated_at
  before update on estimate_settings
  for each row execute function update_updated_at();
