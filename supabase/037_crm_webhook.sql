-- 037: CRM webhook export — push leads to Zapier/Jobber/HCP
-- Date: 2026-04-08

-- Add webhook config to contractors table
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS webhook_url text;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS webhook_enabled boolean DEFAULT false;
