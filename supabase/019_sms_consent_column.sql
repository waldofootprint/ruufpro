-- Add sms_consent to leads table for TCPA compliance tracking.
-- Records whether the homeowner opted in to receive SMS from the contractor.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent boolean DEFAULT false;
