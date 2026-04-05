-- Email sequence tracking — onboarding + upsell drip campaigns.
-- Each row = one email sent (or scheduled) in a sequence.

create table if not exists email_sequence_events (
  id uuid default gen_random_uuid() primary key,
  contractor_id uuid references contractors(id) on delete cascade not null,
  sequence text not null check (sequence in ('onboarding', 'upsell')),
  email_number int not null,
  subject text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz default now()
);

-- Unsubscribe tracking — CAN-SPAM compliance.
create table if not exists email_unsubscribes (
  id uuid default gen_random_uuid() primary key,
  contractor_id uuid references contractors(id) on delete cascade not null unique,
  unsubscribed_at timestamptz default now(),
  reason text
);

-- Index for the cron job: find emails that need sending now.
create index if not exists idx_email_seq_pending
  on email_sequence_events (scheduled_for)
  where sent_at is null;

-- Index for checking if contractor is unsubscribed.
create index if not exists idx_email_unsub_contractor
  on email_unsubscribes (contractor_id);

-- RLS: contractors can only see their own email events.
alter table email_sequence_events enable row level security;
alter table email_unsubscribes enable row level security;

create policy "Contractors see own email events"
  on email_sequence_events for select
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

create policy "Contractors can unsubscribe themselves"
  on email_unsubscribes for insert
  with check (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));
