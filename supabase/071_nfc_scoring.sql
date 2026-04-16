-- Migration 071: NFC card scoring and assignment columns
-- For direct mail outreach with NFC review cards

-- NFC scoring columns
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS nfc_score INTEGER,
  ADD COLUMN IF NOT EXISTS nfc_tier TEXT,
  ADD COLUMN IF NOT EXISTS nfc_scored_at TIMESTAMPTZ;

-- NFC card assignment columns
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS nfc_card_number INTEGER,
  ADD COLUMN IF NOT EXISTS nfc_assigned_at TIMESTAMPTZ;

-- Review automation detection
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS review_automation_suspected BOOLEAN DEFAULT FALSE;

-- Unique index on card number to prevent double-assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_nfc_card
  ON prospect_pipeline (nfc_card_number)
  WHERE nfc_card_number IS NOT NULL;
