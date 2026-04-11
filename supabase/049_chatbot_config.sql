-- 049: chatbot_config — per-contractor Riley training data.
-- 1:1 with contractors. Contractor fills this in via "Train Riley" dashboard page.
-- API route joins this when building the system prompt.

CREATE TABLE IF NOT EXISTS chatbot_config (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id          uuid REFERENCES contractors(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Tier 1: Top 5 homeowner questions
  price_range_low        integer,
  price_range_high       integer,
  offers_free_inspection boolean DEFAULT false,
  typical_timeline_days  text,
  materials_brands       text[],
  process_steps          text,

  -- Tier 2: Insurance, financing, warranty, emergency
  does_insurance_work    boolean DEFAULT false,
  insurance_description  text,
  financing_provider     text,
  financing_terms        text,
  warranty_description   text,
  emergency_available    boolean DEFAULT false,
  emergency_description  text,

  -- Tier 3: Stickiness / differentiation
  custom_faqs            jsonb DEFAULT '[]',
  differentiators        text,
  team_description       text,
  payment_methods        text[],
  current_promotions     text,
  referral_program       text,

  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- Index for the API route join (contractor_id lookup)
CREATE INDEX IF NOT EXISTS chatbot_config_contractor_idx
  ON chatbot_config(contractor_id);

-- RLS: only the owning contractor can read/write their own config
ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractor can manage own chatbot config"
  ON chatbot_config FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );
