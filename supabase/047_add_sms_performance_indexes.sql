-- Performance indexes for SMS monitoring and conversation queries.
-- Prevents full table scans on dashboard, cron jobs, and conversation threads.

-- sms_messages: monitoring dashboard queries by status (failed messages)
create index if not exists sms_messages_status_idx on sms_messages(status);

-- sms_messages: conversation thread lookups (contractor + lead)
create index if not exists sms_messages_contractor_lead_idx on sms_messages(contractor_id, lead_id);

-- review_requests: daily digest cron queries by status
create index if not exists review_requests_status_idx on review_requests(status);
