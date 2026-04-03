-- Sprint 5: Property Intelligence via RentCast API.
-- Caches property data to avoid repeat paid lookups.
-- Each address is looked up once and cached indefinitely.

CREATE TABLE IF NOT EXISTS property_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,               -- normalized address used as cache key
  formatted_address text,                     -- RentCast's cleaned formatted address

  -- Property basics
  year_built integer,
  square_footage integer,
  lot_size integer,
  bedrooms integer,
  bathrooms numeric,
  property_type text,                         -- Single Family, Condo, Townhouse, etc.
  stories integer,

  -- Roof data (huge for a roofing app!)
  roof_type text,                             -- Asphalt, Metal, Tile, etc.

  -- Owner info
  owner_names text[],                         -- array of owner names
  owner_type text,                            -- Individual, Corporate, Trust
  owner_occupied boolean,

  -- Value
  estimated_value integer,                    -- AVM estimate
  value_range_low integer,
  value_range_high integer,

  -- Sale history
  last_sale_date timestamptz,
  last_sale_price integer,
  sale_history jsonb DEFAULT '{}',            -- keyed by date: { "2024-11-18": { price: 270000 } }

  -- Tax data
  tax_assessed_value integer,
  annual_property_tax integer,

  -- Features
  features jsonb DEFAULT '{}',               -- full features blob from RentCast

  -- Meta
  rentcast_id text,                           -- RentCast's property ID
  fetched_at timestamptz DEFAULT now(),       -- when we last pulled this data
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_data_cache ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read cached data (contractors looking at leads)
CREATE POLICY "Authenticated users can read property cache"
  ON property_data_cache FOR SELECT
  USING (true);

-- Only server (service role) inserts cache entries
-- No INSERT/UPDATE policy needed for anon — API uses service role key

-- Link leads to cached property data
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_data_id uuid REFERENCES property_data_cache(id);
