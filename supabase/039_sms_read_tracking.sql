-- Migration 039: Add read tracking for two-way SMS conversations
-- Enables unread badges + mark-as-read in dashboard

-- Add read_at timestamp to track when contractor viewed inbound messages
alter table sms_messages
  add column if not exists read_at timestamptz;

-- Index for efficient unread count queries (inbound messages not yet read)
create index if not exists idx_sms_messages_unread
  on sms_messages (contractor_id, direction, read_at)
  where direction = 'inbound' and read_at is null;

-- Expand message_type constraint to include inbound message types
-- (original constraint only had outbound types)
alter table sms_messages drop constraint if exists sms_messages_message_type_check;
alter table sms_messages add constraint sms_messages_message_type_check
  check (message_type in (
    'review_request', 'missed_call_textback', 'follow_up', 'on_my_way',
    'status_update', 'manual', 'system',
    'inbound', 'opt_out', 'help'
  ));
