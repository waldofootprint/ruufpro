-- Sprint items — DB-backed sprint board for Mission Control
-- Run via: node tools/run-migration.mjs supabase/028_sprint_items.sql

CREATE TABLE sprint_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'next' CHECK (status IN ('next', 'in_progress', 'shipped', 'dropped')),
  tags text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sprint_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sprint_items"
  ON sprint_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER sprint_items_updated_at
  BEFORE UPDATE ON sprint_items
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

-- Seed with existing hardcoded sprint items
INSERT INTO sprint_items (title, status, tags, sort_order) VALUES
  ('Pricing — Free / $149 Pro / $299 Growth', 'shipped', ARRAY['3 tiers', 'annual toggle', 'competitor math', 'all components'], 0),
  ('Onboarding v3 — 3-Screen Flow', 'shipped', ARRAY['magic generation', 'live preview', 'scroll sync', 'edit mode'], 1),
  ('Auth flow — remove bypass, wire signup', 'next', ARRAY['auth', 'critical path'], 2),
  ('Stripe billing — subscription gating', 'next', ARRAY['payments', 'revenue'], 3),
  ('Template auto-defaults', 'next', ARRAY['reviews', 'hours', 'FAQ'], 4);
