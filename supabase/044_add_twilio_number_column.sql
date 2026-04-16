-- Add twilio_number column to contractors table.
-- This column is written by activateSMS() and the 043 trigger,
-- and read by inbound SMS + voice webhooks to match caller → contractor.
-- Without it: STOP keywords fail, missed-call textback fails, all inbound routing broken.

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS twilio_number text;

-- Index for webhook lookups (inbound SMS + voice both query by twilio_number)
CREATE INDEX IF NOT EXISTS idx_contractors_twilio_number ON contractors(twilio_number) WHERE twilio_number IS NOT NULL;
