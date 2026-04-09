-- Prospect pipeline: batch-based pipeline tracking for outreach ops.
-- Each week's scrape = a batch. Each prospect in the batch has a stage.
-- Stages flow automatically. 3 approval gates pause the pipeline.

-- 1. Weekly batches (cohorts)
create table prospect_batches (
  id uuid primary key default gen_random_uuid(),
  week_number integer not null,             -- ISO week (1-52)
  week_year integer not null,               -- Year
  week_start date not null,                 -- Monday of that week
  week_end date not null,                   -- Sunday of that week
  city_targets text[] default '{}',         -- Cities scraped for this batch
  lead_count integer default 0,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(week_number, week_year)
);

alter table prospect_batches enable row level security;
create policy "Admin can manage batches" on prospect_batches
  for all using (auth.role() = 'authenticated');

-- 2. Prospect pipeline stage tracking
-- Each prospect gets one row tracking their current stage in the pipeline.
create table prospect_pipeline (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  batch_id uuid references prospect_batches(id) on delete set null,
  stage text not null default 'scraped' check (stage in (
    'scraped',          -- Just scraped from Google Maps
    'enriched',         -- Apollo found email/owner
    'site_built',       -- Preview site generated
    'site_approved',    -- Gate 1 passed: site reviewed by Hannah
    'outreach_approved',-- Gate 2 passed: emails approved to send
    'sent',             -- Email sequence started via Instantly
    'awaiting_reply',   -- Waiting for prospect response
    'replied',          -- Prospect replied (auto-categorized)
    'draft_ready',      -- AI draft response ready (Gate 3 in Slack)
    'responded',        -- Reply approved and sent
    'interested',       -- Prospect expressed interest
    'not_now',          -- Prospect said not now / bad timing
    'objection',        -- Prospect raised objection
    'unsubscribed',     -- Prospect unsubscribed
    'free_signup',      -- Created a free RuufPro account
    'paid'              -- Converted to paid tier
  )),
  stage_entered_at timestamptz default now(),
  -- Enrichment data
  owner_name text,
  owner_email text,
  -- Site data
  preview_site_url text,
  their_website_url text,
  -- Outreach data
  email_sequence_id text,           -- Instantly campaign ID
  emails_sent_count integer default 0,
  -- Reply data
  reply_category text check (reply_category in ('interested', 'question', 'objection', 'not_now', 'unsubscribe')),
  reply_text text,
  draft_response text,
  draft_status text default 'none' check (draft_status in ('none', 'pending', 'approved', 'sent', 'skipped')),
  -- Timestamps
  scraped_at timestamptz default now(),
  enriched_at timestamptz,
  site_built_at timestamptz,
  site_approved_at timestamptz,
  outreach_approved_at timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  responded_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- One pipeline entry per contractor
  unique(contractor_id)
);

alter table prospect_pipeline enable row level security;
create policy "Admin can manage pipeline" on prospect_pipeline
  for all using (auth.role() = 'authenticated');

-- 3. Pipeline gates (batch-level approval tracking)
create table pipeline_gates (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references prospect_batches(id) on delete cascade,
  gate_type text not null check (gate_type in ('site_review', 'outreach_approval', 'draft_approval')),
  items_pending integer default 0,
  items_approved integer default 0,
  items_rejected integer default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'partial', 'skipped')),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  created_at timestamptz default now()
);

alter table pipeline_gates enable row level security;
create policy "Admin can manage gates" on pipeline_gates
  for all using (auth.role() = 'authenticated');

-- 4. Indexes for fast pipeline queries
create index prospect_pipeline_batch_idx on prospect_pipeline(batch_id);
create index prospect_pipeline_stage_idx on prospect_pipeline(stage);
create index prospect_pipeline_contractor_idx on prospect_pipeline(contractor_id);
create index prospect_batches_status_idx on prospect_batches(status);
create index pipeline_gates_batch_idx on pipeline_gates(batch_id);
create index pipeline_gates_status_idx on pipeline_gates(status) where status = 'pending';

-- 5. Auto-update updated_at
create or replace function update_prospect_pipeline_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospect_pipeline_updated
  before update on prospect_pipeline
  for each row execute function update_prospect_pipeline_timestamp();

create trigger prospect_batches_updated
  before update on prospect_batches
  for each row execute function update_prospect_pipeline_timestamp();
