-- 059: Add config_snapshot to chat_conversations + daily API usage counter
-- config_snapshot: caches chatbot_config for conversation consistency (ZL-020)
-- api_usage_daily: global cost ceiling enforcement (ZL-003)
-- rate_limits: persistent rate limiting for serverless (ZL-001)

-- 1. Config snapshot column on chat_conversations
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS config_snapshot jsonb;

-- 2. Global daily API usage counter
CREATE TABLE IF NOT EXISTS api_usage_daily (
  date       date PRIMARY KEY DEFAULT CURRENT_DATE,
  chat_messages  integer DEFAULT 0,
  estimate_calls integer DEFAULT 0,
  updated_at     timestamptz DEFAULT now()
);

-- RLS: only service role can write
ALTER TABLE api_usage_daily ENABLE ROW LEVEL SECURITY;

-- 3. Rate limit table (replaces in-memory Map for serverless)
CREATE TABLE IF NOT EXISTS rate_limits (
  key        text PRIMARY KEY,
  count      integer DEFAULT 1,
  reset_at   timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON rate_limits(reset_at);

-- RLS: only service role
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
