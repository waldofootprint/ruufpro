-- SMS Infrastructure: Twilio numbers, message logs, review requests, TCPA opt-outs
-- Supports: review request automation, missed-call textback, manual SMS from dashboard

-- ============================================================
-- SMS NUMBERS (Twilio phone numbers provisioned per contractor)
-- ============================================================
create table sms_numbers (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  twilio_sid text,
  phone_number text not null,
  area_code text,
  number_type text not null default 'local' check (number_type in ('local', 'toll_free')),
  status text not null default 'pending_registration' check (status in ('pending_registration', 'registering', 'active', 'shared_fallback', 'suspended')),
  "10dlc_brand_sid" text,
  "10dlc_campaign_sid" text,
  brand_status text check (brand_status in ('pending', 'approved', 'failed')),
  campaign_status text check (campaign_status in ('pending', 'approved', 'failed')),
  registered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint sms_numbers_one_per_contractor unique (contractor_id)
);

-- ============================================================
-- SMS MESSAGES (log of all SMS sent and received)
-- ============================================================
create table sms_messages (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_number text not null,
  to_number text not null,
  body text not null,
  message_type text not null check (message_type in ('review_request', 'missed_call_textback', 'follow_up', 'on_my_way', 'status_update', 'manual', 'system')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'received')),
  twilio_message_sid text,
  error_code text,
  error_message text,
  created_at timestamptz default now()
);

-- ============================================================
-- REVIEW REQUESTS (review request lifecycle tracking)
-- ============================================================
create table review_requests (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete cascade not null,
  sms_message_id uuid references sms_messages(id) on delete set null,
  email_followup_message_id text,
  channel text not null check (channel in ('sms', 'email', 'both')),
  status text not null default 'pending' check (status in ('pending', 'sms_sent', 'email_sent', 'clicked', 'reviewed')),
  google_review_url text not null,
  tracking_token text unique not null,
  sent_at timestamptz,
  clicked_at timestamptz,
  reviewed_at timestamptz,
  email_followup_sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- SMS OPT-OUTS (TCPA compliance — STOP request tracking)
-- ============================================================
create table sms_opt_outs (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  contractor_id uuid references contractors(id) on delete cascade not null,
  opted_out_at timestamptz default now(),

  constraint sms_opt_outs_unique_per_contractor unique (phone_number, contractor_id)
);

-- ============================================================
-- ADD SMS COLUMNS TO CONTRACTORS
-- ============================================================
alter table contractors
  add column if not exists google_review_url text,
  add column if not exists sms_enabled boolean default false,
  add column if not exists missed_call_textback_enabled boolean default false,
  add column if not exists review_request_enabled boolean default false,
  add column if not exists legal_entity_type text default 'sole_proprietor' check (legal_entity_type in ('sole_proprietor', 'llc', 'corporation', 'partnership')),
  add column if not exists ein text;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_sms_messages_contractor_created on sms_messages (contractor_id, created_at desc);
create index idx_sms_messages_lead on sms_messages (lead_id);
create index idx_sms_messages_twilio_sid on sms_messages (twilio_message_sid);

create index idx_review_requests_contractor on review_requests (contractor_id);
create index idx_review_requests_lead on review_requests (lead_id);
create index idx_review_requests_token on review_requests (tracking_token);

create index idx_sms_opt_outs_lookup on sms_opt_outs (phone_number, contractor_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- SMS NUMBERS
alter table sms_numbers enable row level security;

create policy "Contractors can read own sms numbers"
  on sms_numbers for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Service role can insert sms numbers"
  on sms_numbers for insert
  with check (true);

create policy "Service role can update sms numbers"
  on sms_numbers for update
  using (true);

-- SMS MESSAGES
alter table sms_messages enable row level security;

create policy "Contractors can read own sms messages"
  on sms_messages for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Service role can insert sms messages"
  on sms_messages for insert
  with check (true);

-- REVIEW REQUESTS
alter table review_requests enable row level security;

create policy "Contractors can read own review requests"
  on review_requests for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Service role can insert review requests"
  on review_requests for insert
  with check (true);

create policy "Service role can update review requests"
  on review_requests for update
  using (true);

-- SMS OPT-OUTS
alter table sms_opt_outs enable row level security;

create policy "Contractors can read own opt-outs"
  on sms_opt_outs for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Anyone can insert opt-outs"
  on sms_opt_outs for insert
  with check (true);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create trigger sms_numbers_updated_at
  before update on sms_numbers
  for each row execute function update_updated_at();
