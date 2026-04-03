-- Living Estimates: interactive, shareable web-based proposals.
-- Each estimate gets a unique share token for a public URL.
-- Homeowners can select materials, toggle add-ons, and share with a spouse.

CREATE TABLE IF NOT EXISTS living_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,

  -- Access tokens
  share_token text UNIQUE NOT NULL,
  magic_link_token text UNIQUE,

  -- Homeowner info (snapshot at creation)
  homeowner_name text NOT NULL,
  homeowner_email text,
  homeowner_phone text,
  homeowner_address text,

  -- Roof data (snapshot)
  roof_area_sqft numeric,
  pitch_degrees numeric,
  num_segments integer,
  is_satellite boolean DEFAULT true,

  -- G/B/B estimates (jsonb array from the API)
  estimates jsonb NOT NULL,

  -- Add-ons available for this estimate
  available_addons jsonb DEFAULT '[]',

  -- Homeowner selections (updated live from the interactive page)
  selected_material text,
  selected_addons text[] DEFAULT '{}',

  -- Status tracking
  status text DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired')),
  viewed_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE living_estimates ENABLE ROW LEVEL SECURITY;

-- Contractors can manage their own estimates
CREATE POLICY "Contractors manage own living estimates"
  ON living_estimates FOR ALL
  USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  ));

-- Public can read any estimate (filtered by share_token in the app)
CREATE POLICY "Public can read living estimates"
  ON living_estimates FOR SELECT
  USING (true);

-- Public can update selections (material choice, add-on toggles)
CREATE POLICY "Public can update selections"
  ON living_estimates FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Contractor-configured add-ons (gutter guards, skylights, etc.)
CREATE TABLE IF NOT EXISTS estimate_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estimate_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors manage own addons"
  ON estimate_addons FOR ALL
  USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  ));

-- Public can read active addons (needed when rendering the living estimate page)
CREATE POLICY "Public can read addons"
  ON estimate_addons FOR SELECT
  USING (is_active = true);

-- Add living_estimate_id reference to leads for quick lookup
ALTER TABLE leads ADD COLUMN IF NOT EXISTS living_estimate_id uuid REFERENCES living_estimates(id);
