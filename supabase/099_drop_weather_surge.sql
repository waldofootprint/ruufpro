-- Drop weather-surge pricing feature.
-- Replaces migration 050_weather_surge_settings.sql.
-- Killed 2026-05-03 per calculator superiority plan M1.1:
-- legally exposed in FL post-emergency price-gouging statute, zero adoption,
-- and ~60 lines of dashboard clutter.
ALTER TABLE estimate_settings
  DROP COLUMN IF EXISTS weather_surge_enabled,
  DROP COLUMN IF EXISTS weather_surge_multiplier,
  DROP COLUMN IF EXISTS weather_surge_duration_days,
  DROP COLUMN IF EXISTS weather_surge_expires_at,
  DROP COLUMN IF EXISTS weather_surge_auto_expire;
