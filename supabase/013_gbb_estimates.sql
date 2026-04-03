-- Add multi-material estimate storage for Good/Better/Best pricing.
-- The estimate_materials column stores the full G/B/B array from the API response.
-- Existing estimate_low/high/material columns are kept for backward compatibility
-- and store the homeowner's selected (or primary) material.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimate_materials jsonb;
-- Example value:
-- [
--   { "material": "asphalt", "tier": "Good", "price_low": 8500, "price_high": 12000 },
--   { "material": "metal", "tier": "Better", "price_low": 16000, "price_high": 22000 },
--   { "material": "tile", "tier": "Best", "price_low": 20000, "price_high": 28000 }
-- ]
