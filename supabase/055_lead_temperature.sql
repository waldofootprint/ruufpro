-- 055: Add temperature column to leads for AI-scored lead priority.
-- Values: 'hot' (emergency/ready to buy), 'warm' (pricing/comparing), 'browsing' (general info)
-- Chat leads scored automatically. Estimate leads derived from timeline field.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature text;

-- Add check constraint matching the LeadTemperature type
ALTER TABLE leads ADD CONSTRAINT leads_temperature_check
  CHECK (temperature IS NULL OR temperature IN ('hot', 'warm', 'browsing'));
