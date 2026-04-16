-- 070: Review email customization columns + status constraint fix
-- Adds email template fields to contractors table (dashboard already reads these).
-- Fixes review_requests status constraint to include 'reminder_sent'.

-- ============================================================
-- 1. Email customization columns on contractors
-- ============================================================
-- The reviews dashboard (app/dashboard/reviews/page.tsx) already saves
-- these fields, but the columns didn't exist. All nullable with defaults
-- so existing rows are unaffected.

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS review_email_subject text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS review_email_heading text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS review_email_body text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS review_email_button text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS review_email_delay text DEFAULT 'immediate';

-- Validate delay values
ALTER TABLE contractors ADD CONSTRAINT contractors_review_email_delay_check
  CHECK (review_email_delay IS NULL OR review_email_delay IN ('immediate', '1_hour', '1_day', '3_days'));

-- ============================================================
-- 2. Fix review_requests status constraint
-- ============================================================
-- BUG: The follow-up cron sets status='reminder_sent' but the constraint
-- only allows ('pending','sms_sent','email_sent','clicked','reviewed').
-- Every 3-day follow-up reminder has been silently failing.

ALTER TABLE review_requests DROP CONSTRAINT IF EXISTS review_requests_status_check;
ALTER TABLE review_requests ADD CONSTRAINT review_requests_status_check
  CHECK (status IN ('pending', 'sms_sent', 'email_sent', 'clicked', 'reviewed', 'reminder_sent'));
