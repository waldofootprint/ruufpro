-- Add CRM webhook integration columns to contractors table
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;
