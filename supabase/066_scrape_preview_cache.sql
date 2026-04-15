-- 066: Scrape preview cache — one search, zero divergence
-- Dry run saves results here. Confirm reads from here. No second Google search.

CREATE TABLE IF NOT EXISTS scrape_preview_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES prospect_batches(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}',
  prospects jsonb NOT NULL DEFAULT '[]',
  preview_meta jsonb NOT NULL DEFAULT '{}',
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Only one live (unconsumed) preview per batch
CREATE UNIQUE INDEX idx_scrape_preview_one_live
  ON scrape_preview_cache (batch_id) WHERE consumed = false;

-- For cleanup cron: find expired unconsumed previews
CREATE INDEX idx_scrape_preview_expired
  ON scrape_preview_cache (expires_at) WHERE consumed = false;

-- Add scrape_status to prospect_batches
ALTER TABLE prospect_batches
  ADD COLUMN IF NOT EXISTS scrape_status text NOT NULL DEFAULT 'pending'
  CHECK (scrape_status IN ('pending', 'confirmed', 'expired'));

-- RLS: only service role touches this table (ops routes use service role key)
ALTER TABLE scrape_preview_cache ENABLE ROW LEVEL SECURITY;
