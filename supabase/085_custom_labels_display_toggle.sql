-- 085: Custom material labels + homeowner display toggle.
--
-- Labels: nullable text per material. NULL = use hardcoded default.
-- show_roof_details: controls whether homeowners see sqft/pitch/segments
-- in the widget and chat. Default true (current behavior preserved).

ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS asphalt_label text,
  ADD COLUMN IF NOT EXISTS metal_label text,
  ADD COLUMN IF NOT EXISTS tile_label text,
  ADD COLUMN IF NOT EXISTS flat_label text,
  ADD COLUMN IF NOT EXISTS show_roof_details boolean NOT NULL DEFAULT true;
