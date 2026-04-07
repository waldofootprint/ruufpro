-- Add PDF section toggles + financing fields to estimate_settings
-- Step 1B: Contractors can toggle property protection & change order sections
-- Step 2.1: Contractors can configure their financing options

ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS property_protection_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS change_order_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS financing_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS financing_provider text,
  ADD COLUMN IF NOT EXISTS financing_term_months integer,
  ADD COLUMN IF NOT EXISTS financing_apr numeric(5,2),
  ADD COLUMN IF NOT EXISTS financing_note text;
