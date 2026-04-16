-- 068: Copilot support — conversation type + usage tracking
-- Adds type column to chat_conversations so copilot and Riley conversations
-- are stored in the same table but queryable separately.
-- Adds copilot_messages counter to api_usage_daily for cost tracking.

-- 1. Add type column to chat_conversations (default 'riley' for existing rows)
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'riley';

-- 2. Index for fast copilot-specific queries
CREATE INDEX IF NOT EXISTS chat_conversations_type_idx
  ON chat_conversations(contractor_id, type, created_at DESC);

-- 3. Add copilot message counter to daily usage tracking
ALTER TABLE api_usage_daily
  ADD COLUMN IF NOT EXISTS copilot_messages integer DEFAULT 0;
