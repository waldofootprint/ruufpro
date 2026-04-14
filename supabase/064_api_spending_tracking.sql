-- Migration 064: API spending tracking
-- Daily totals + audit log for all paid API calls.
-- Spending guard checks this before every paid operation.

-- Daily spending summary
CREATE TABLE IF NOT EXISTS api_spending_daily (
  date        date PRIMARY KEY DEFAULT CURRENT_DATE,
  total_cost  numeric(10,4) DEFAULT 0,
  call_count  integer DEFAULT 0,
  breakdown   jsonb DEFAULT '{}',
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE api_spending_daily ENABLE ROW LEVEL SECURITY;

-- Audit log — every paid API call gets a row
CREATE TABLE IF NOT EXISTS api_spending_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service     text NOT NULL,
  calls       integer NOT NULL DEFAULT 1,
  cost_per_call numeric(10,4) NOT NULL DEFAULT 0,
  total_cost  numeric(10,4) NOT NULL DEFAULT 0,
  context     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE api_spending_log ENABLE ROW LEVEL SECURITY;

-- Index for date range queries on the log
CREATE INDEX IF NOT EXISTS idx_spending_log_created
  ON api_spending_log(created_at);
