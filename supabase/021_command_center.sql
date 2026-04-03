-- Command Center: Hannah's private business dashboard
-- Tables for tracking revenue plays, positioning, and motivation from the vault

-- Plays (revenue strategies from the vault)
CREATE TABLE command_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done', 'queued')),
  priority integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'active' CHECK (category IN ('active', 'queued', 'completed')),
  summary text,
  vault_details text,
  vault_sources text[] DEFAULT '{}',
  steps jsonb DEFAULT '[]',
  when_to_start text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positioning (current vs target, Hormozi equation, MRR tracking)
CREATE TABLE command_positioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_pos text,
  target_pos text,
  hormozi_json jsonb DEFAULT '{}',
  mrr_target integer DEFAULT 50000,
  mrr_current integer DEFAULT 0,
  pricing_tiers jsonb DEFAULT '[]',
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Motivation (case study stories + guiding principles)
CREATE TABLE command_motivation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  story text,
  vault_entry text,
  type text NOT NULL DEFAULT 'story' CHECK (type IN ('story', 'principle')),
  sort_order integer DEFAULT 0
);

-- RLS: Only authenticated users can access (admin check done in app layer)
ALTER TABLE command_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_positioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_motivation ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (app-layer admin check restricts to Hannah)
CREATE POLICY "Authenticated users can manage command_plays"
  ON command_plays FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage command_positioning"
  ON command_positioning FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage command_motivation"
  ON command_motivation FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_command_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER command_plays_updated_at
  BEFORE UPDATE ON command_plays
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

CREATE TRIGGER command_positioning_updated_at
  BEFORE UPDATE ON command_positioning
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

-- Advisor notes (persistent strategic note + running daily briefs)
CREATE TABLE command_advisor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('note', 'brief')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Outreach tracker (demos, Facebook, cold email)
CREATE TABLE command_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('demo_site', 'facebook', 'cold_email', 'other')),
  company_name text,
  city text,
  contact_name text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'replied', 'call_booked', 'signed_up', 'no_response', 'declined')),
  notes text,
  date_sent timestamptz DEFAULT now(),
  date_responded timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wins & milestones log
CREATE TABLE command_wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  milestone_type text DEFAULT 'win' CHECK (milestone_type IN ('win', 'milestone', 'learning')),
  date_achieved timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Project status (every feature/asset and its current state)
CREATE TABLE command_project_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  category text NOT NULL, -- 'page', 'api', 'template', 'feature', 'research', 'workflow'
  route text, -- URL path if applicable
  status text NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'in_progress', 'planned', 'needs_work')),
  description text,
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- RLS for new tables
ALTER TABLE command_advisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_project_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage command_advisor"
  ON command_advisor FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage command_outreach"
  ON command_outreach FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage command_wins"
  ON command_wins FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage command_project_status"
  ON command_project_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER command_outreach_updated_at
  BEFORE UPDATE ON command_outreach
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

CREATE TRIGGER command_project_status_updated_at
  BEFORE UPDATE ON command_project_status
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();
