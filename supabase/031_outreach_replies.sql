-- Reply handler: stores inbound replies, AI categorization, draft responses, and send status.
-- Supports multi-channel (Instantly, LinkedIn, Facebook) with Slack-based approval workflow.

create table if not exists outreach_replies (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  prospect_email text,
  prospect_company text,
  prospect_city text,
  prospect_state text,
  channel text not null default 'instantly',  -- 'instantly' | 'linkedin' | 'facebook'
  category text,                               -- 'interested' | 'question' | 'objection' | 'not_now' | 'unsubscribe'
  confidence text,                             -- 'high' | 'medium' | 'low'
  inbound_text text not null,                  -- their reply
  original_outreach text,                      -- what we sent them
  original_subject text,                       -- email subject thread
  draft_reply text,                            -- AI-generated draft
  final_reply text,                            -- what actually got sent (may differ if edited)
  status text not null default 'pending',      -- 'pending' | 'draft' | 'sent' | 'skipped' | 'removed'
  slack_message_ts text,                       -- Slack message ID for updating after action
  slack_channel_id text,                       -- Slack channel where notification was sent
  prospect_score integer,                      -- from prospect-scorer
  prospect_tier text,                          -- 'gold' | 'silver' | 'bronze'
  instantly_campaign_id text,                  -- Instantly campaign reference
  instantly_reply_id text,                     -- Instantly unique reply ID
  follow_up_date timestamptz,                  -- for 'not_now' replies: when to follow up
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  responded_by text default 'hannah'
);

-- Index for quick lookups
create index if not exists idx_outreach_replies_status on outreach_replies(status);
create index if not exists idx_outreach_replies_channel on outreach_replies(channel);
create index if not exists idx_outreach_replies_category on outreach_replies(category);
create index if not exists idx_outreach_replies_created on outreach_replies(created_at desc);

-- RLS: only admin can access (this is Hannah's outreach data, not roofer data)
alter table outreach_replies enable row level security;

create policy "Admin full access to outreach_replies"
  on outreach_replies for all
  using (true)
  with check (true);
