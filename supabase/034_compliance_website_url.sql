-- Add compliance_website_url to sms_numbers
-- Stores the A2P Wizard generated compliance website URL per contractor.
-- Required before campaign registration can proceed.
-- Example: https://smithroofingco.nebulabrandgroup.com

ALTER TABLE sms_numbers
ADD COLUMN IF NOT EXISTS compliance_website_url text;

COMMENT ON COLUMN sms_numbers.compliance_website_url IS 'A2P Wizard compliance website URL — required for campaign registration';
