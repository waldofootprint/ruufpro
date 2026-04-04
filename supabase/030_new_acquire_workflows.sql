-- Add 3 new Acquire workflows from Vault entries 057-061
-- Run via: node tools/run-migration.mjs supabase/030_new_acquire_workflows.sql

-- New workflow statuses
INSERT INTO workflow_status (workflow_id, status, priority) VALUES
  ('video-outreach',        'not_started', 47),  -- after cold-email, before outreach-tracking
  ('visual-outreach-assets','not_started', 48),  -- after video-outreach
  ('lead-scoring',          'not_started', 15);  -- high priority, no dependencies

-- video-outreach (5 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('video-outreach', 0),
  ('video-outreach', 1),
  ('video-outreach', 2),
  ('video-outreach', 3),
  ('video-outreach', 4);

-- visual-outreach-assets (4 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('visual-outreach-assets', 0),
  ('visual-outreach-assets', 1),
  ('visual-outreach-assets', 2),
  ('visual-outreach-assets', 3);

-- lead-scoring (4 steps)
INSERT INTO workflow_step_status (workflow_id, sort_order) VALUES
  ('lead-scoring', 0),
  ('lead-scoring', 1),
  ('lead-scoring', 2),
  ('lead-scoring', 3);
