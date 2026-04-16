-- Copilot Lead Console enhancements
-- Adds columns for status progression pills, action logging, and lead scoring.
-- Status pills are MANUAL milestones (Called, Inspection Set, Quote Sent, Won).
-- Action log tracks texted/called/emailed events with timestamps.

-- Manual status progression pills (roofer taps to confirm milestones)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS copilot_status_pills jsonb DEFAULT '[]'::jsonb;

-- Action log: [{action: "Texted", timestamp: "2026-04-15T..."}]
ALTER TABLE leads ADD COLUMN IF NOT EXISTS copilot_action_log jsonb DEFAULT '[]'::jsonb;

-- Lead scoring (0-100)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_factors jsonb;

-- Index for quick filtering by score
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads (lead_score DESC NULLS LAST)
  WHERE lead_score IS NOT NULL;
