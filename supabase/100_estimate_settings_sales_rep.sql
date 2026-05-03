-- Sales rep card on estimate result (calculator superiority plan M1.4).
-- Adds 6 optional columns so a roofer can put a human face + booking link
-- on the estimate result page. Matches Roofr's lead_form_profile shape.
-- calendar_url is paste-a-URL (Calendly / Cal.com / Google appt slots / Square / etc).
ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS rep_name text,
  ADD COLUMN IF NOT EXISTS rep_title text,
  ADD COLUMN IF NOT EXISTS rep_email text,
  ADD COLUMN IF NOT EXISTS rep_phone text,
  ADD COLUMN IF NOT EXISTS rep_photo_url text,
  ADD COLUMN IF NOT EXISTS calendar_url text;
