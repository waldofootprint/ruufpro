-- Coverage check upfront on estimate widget (calculator superiority plan M1.6).
-- Stops homeowners from spending 8 funnel questions before being told the
-- roofer doesn't service their ZIP. New behavior: when a contractor has set
-- service_zips AND coverage_check_enabled is true, the widget checks the
-- selected address ZIP at the Continue step and branches out-of-zone visitors
-- to an email capture screen (lead written with status='out_of_zone').

ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS coverage_check_enabled boolean NOT NULL DEFAULT true;

-- Allow leads.status='out_of_zone' for the email-capture branch above.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'new',
    'contacted',
    'appointment_set',
    'quoted',
    'won',
    'completed',
    'lost',
    'address_only_followup',
    'out_of_zone'
  ));
