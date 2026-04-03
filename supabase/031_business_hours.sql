-- Add business_hours JSON field to contractors
-- Stores: { "mon": { "open": "8:00", "close": "17:00" }, "tue": { ... }, ... }
-- Null entries mean closed that day.

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS business_hours jsonb;
