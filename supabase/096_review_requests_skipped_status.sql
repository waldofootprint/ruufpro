-- 096: Allow status='skipped' on review_requests
-- New review-push-prompt flow lets the roofer dismiss a prompt from their phone.
-- We insert a 'skipped' row so follow-ups don't fire and re-prompts dedupe.

ALTER TABLE review_requests DROP CONSTRAINT IF EXISTS review_requests_status_check;
ALTER TABLE review_requests ADD CONSTRAINT review_requests_status_check
  CHECK (status IN ('pending', 'sms_sent', 'email_sent', 'clicked', 'reviewed', 'reminder_sent', 'skipped'));
