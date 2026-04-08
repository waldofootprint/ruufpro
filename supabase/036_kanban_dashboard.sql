-- 036: Kanban dashboard — add notes column + appointment_set status
-- Date: 2026-04-08

-- Add notes column for roofer's free-text notes on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- Update status CHECK constraint to include appointment_set
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'appointment_set', 'quoted', 'won', 'completed', 'lost'));
