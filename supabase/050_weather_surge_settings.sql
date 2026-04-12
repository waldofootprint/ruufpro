-- Add buffer percent + weather surge opt-in columns to estimate_settings.
--
-- buffer_percent: widens the high end of estimates (0-20%).
-- weather_surge_enabled: roofer has actively turned on storm pricing.
-- weather_surge_multiplier: roofer's chosen multiplier (e.g. 1.20 = +20%).
-- weather_surge_duration_days: how many days surge stays active once enabled.
-- weather_surge_expires_at: when the current surge period ends (null = manual off only).
-- weather_surge_auto_expire: if true, surge auto-disables at expires_at.

ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS buffer_percent integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS weather_surge_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS weather_surge_multiplier numeric(3,2),
  ADD COLUMN IF NOT EXISTS weather_surge_duration_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS weather_surge_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS weather_surge_auto_expire boolean DEFAULT true;
