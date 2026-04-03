-- Business metrics — key-value metrics store for Mission Control
-- Run via: node tools/run-migration.mjs supabase/029_business_metrics.sql

CREATE TABLE business_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text UNIQUE NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metric_label text NOT NULL,
  category text DEFAULT 'revenue',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage business_metrics"
  ON business_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER business_metrics_updated_at
  BEFORE UPDATE ON business_metrics
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

-- Seed with initial metrics (all zero — infrastructure ready for Stripe)
INSERT INTO business_metrics (metric_key, metric_value, metric_label, category) VALUES
  ('mrr', 0, 'MRR', 'revenue'),
  ('total_signups', 0, 'Total Signups', 'growth'),
  ('active_trials', 0, 'Active Trials', 'growth'),
  ('leads_this_week', 0, 'Leads This Week', 'growth'),
  ('sites_published', 0, 'Sites Published', 'product');
