-- Add contact form outreach columns to prospect_pipeline.
--
-- contact_form_url: URL of the page where the form was detected.
-- form_field_mapping: JSON with CSS selectors for name/email/phone/message/submit + honeypot markers + select defaults.
-- has_captcha: true if reCAPTCHA/Turnstile detected — skip submission, route to email fallback.
-- form_detected_at: when detection ran (null = not yet scanned).
-- outreach_method: which channel was used to contact this prospect ('form' or 'email').
-- form_submitted_at: when the form was successfully submitted.
-- form_submission_status: tracks submission lifecycle.
-- form_submission_error: error message on failure.
-- form_submission_attempts: guards against double-submission (max 1).

ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS contact_form_url text,
  ADD COLUMN IF NOT EXISTS form_field_mapping jsonb,
  ADD COLUMN IF NOT EXISTS has_captcha boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS form_detected_at timestamptz,
  ADD COLUMN IF NOT EXISTS outreach_method text CHECK (outreach_method IN ('form', 'cold_email', 'linkedin_draft')),
  ADD COLUMN IF NOT EXISTS form_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_submission_status text DEFAULT 'pending'
    CHECK (form_submission_status IN ('pending', 'success', 'failed', 'captcha_blocked', 'duplicate_skipped')),
  ADD COLUMN IF NOT EXISTS form_submission_error text,
  ADD COLUMN IF NOT EXISTS form_submission_attempts integer DEFAULT 0;

-- Fast lookup for prospects ready for form submission
CREATE INDEX IF NOT EXISTS idx_prospect_form_status
  ON prospect_pipeline (form_submission_status)
  WHERE stage = 'outreach_approved';

-- Fast lookup for duplicate detection (same website = same roofer)
CREATE INDEX IF NOT EXISTS idx_prospect_website_url
  ON prospect_pipeline (their_website_url)
  WHERE their_website_url IS NOT NULL;
