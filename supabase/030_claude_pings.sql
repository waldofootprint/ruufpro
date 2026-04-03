-- Claude ping system: Hannah pings Claude when she needs attention on something
-- Also auto-logged when workflow actions are taken
-- Run via: node tools/run-migration.mjs supabase/030_claude_pings.sql

CREATE TABLE claude_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual',  -- 'manual' (button) or 'workflow_action'
  message text,                           -- optional message from Hannah
  workflow_id text,                       -- which workflow (if workflow-related)
  step_id uuid,                           -- which step (if workflow-related)
  action text,                            -- what action was taken (approve_to_build, approve, send_back, skip)
  acknowledged boolean NOT NULL DEFAULT false,  -- Claude sets true after reading
  created_at timestamptz DEFAULT now()
);

-- RLS — service role key bypasses this, anon can insert (for the UI)
ALTER TABLE claude_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert pings" ON claude_pings FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read pings" ON claude_pings FOR ALL TO authenticated USING (true) WITH CHECK (true);
