-- Workflow approval system: tracks build steps for autonomous pipeline
-- Run via: node tools/run-migration.mjs supabase/026_workflow_steps.sql

-- Overall workflow status (10 rows — one per workflow)
CREATE TABLE workflow_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'awaiting_review', 'complete')),
  priority int NOT NULL DEFAULT 50,
  current_step int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual step status (~55 rows)
CREATE TABLE workflow_step_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id text NOT NULL,
  sort_order int NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved_to_build', 'building', 'review', 'revision', 'approved', 'skipped')),
  review_notes text,
  context_notes text,
  build_summary text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, sort_order)
);

-- RLS — only logged-in users can access (same as all other command center tables)
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage workflow_status"
  ON workflow_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE workflow_step_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage workflow_step_status"
  ON workflow_step_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update triggers — keeps updated_at current when rows change
-- (reuses the same function your other command center tables use)
CREATE TRIGGER workflow_status_updated_at
  BEFORE UPDATE ON workflow_status
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

CREATE TRIGGER workflow_step_status_updated_at
  BEFORE UPDATE ON workflow_step_status
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();

-- ============================
-- SEED DATA: 10 workflows
-- Priority: lower number = more urgent in your queue
-- ============================
INSERT INTO workflow_status (workflow_id, status, priority) VALUES
  ('auth-fix',             'not_started', 5),   -- trivial, unblocks everything
  ('stripe-billing',       'not_started', 10),  -- can't collect revenue without it
  ('dashboard-editing',    'not_started', 20),  -- roofer self-service
  ('seo-city-pages',       'not_started', 30),  -- $149/mo upsell
  ('roofer-scraping',      'not_started', 40),  -- feeds the pipeline
  ('bulk-demo-generation', 'not_started', 45),  -- depends on scraping
  ('cold-email-sequences', 'not_started', 50),  -- depends on demo gen
  ('outreach-tracking',    'not_started', 55),  -- depends on email sequences
  ('churn-prevention',     'not_started', 60),  -- depends on stripe
  ('upsell-prompts',       'not_started', 65);  -- depends on stripe + dashboard

-- ============================
-- SEED DATA: All workflow steps
-- sort_order maps 1:1 to the steps array in workflow-registry.ts
-- ============================

-- roofer-scraping (6 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('roofer-scraping', 0),
  ('roofer-scraping', 1),
  ('roofer-scraping', 2),
  ('roofer-scraping', 3),
  ('roofer-scraping', 4),
  ('roofer-scraping', 5);

-- bulk-demo-generation (4 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('bulk-demo-generation', 0),
  ('bulk-demo-generation', 1),
  ('bulk-demo-generation', 2),
  ('bulk-demo-generation', 3);

-- cold-email-sequences (5 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('cold-email-sequences', 0),
  ('cold-email-sequences', 1),
  ('cold-email-sequences', 2),
  ('cold-email-sequences', 3),
  ('cold-email-sequences', 4);

-- outreach-tracking (5 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('outreach-tracking', 0),
  ('outreach-tracking', 1),
  ('outreach-tracking', 2),
  ('outreach-tracking', 3),
  ('outreach-tracking', 4);

-- stripe-billing (8 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('stripe-billing', 0),
  ('stripe-billing', 1),
  ('stripe-billing', 2),
  ('stripe-billing', 3),
  ('stripe-billing', 4),
  ('stripe-billing', 5),
  ('stripe-billing', 6),
  ('stripe-billing', 7);

-- auth-fix (3 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('auth-fix', 0),
  ('auth-fix', 1),
  ('auth-fix', 2);

-- dashboard-editing (7 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('dashboard-editing', 0),
  ('dashboard-editing', 1),
  ('dashboard-editing', 2),
  ('dashboard-editing', 3),
  ('dashboard-editing', 4),
  ('dashboard-editing', 5),
  ('dashboard-editing', 6);

-- seo-city-pages (6 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('seo-city-pages', 0),
  ('seo-city-pages', 1),
  ('seo-city-pages', 2),
  ('seo-city-pages', 3),
  ('seo-city-pages', 4),
  ('seo-city-pages', 5);

-- churn-prevention (5 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('churn-prevention', 0),
  ('churn-prevention', 1),
  ('churn-prevention', 2),
  ('churn-prevention', 3),
  ('churn-prevention', 4);

-- upsell-prompts (4 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('upsell-prompts', 0),
  ('upsell-prompts', 1),
  ('upsell-prompts', 2),
  ('upsell-prompts', 3);
