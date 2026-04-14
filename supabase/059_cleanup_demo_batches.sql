-- Remove all prospect batches + pipeline entries that aren't from the real Apr 14 scrape.
-- Keep only batches created on or after 2026-04-14.

-- First delete pipeline entries for old batches
DELETE FROM prospect_pipeline
WHERE batch_id IN (
  SELECT id FROM prospect_batches
  WHERE created_at < '2026-04-14T00:00:00Z'
);

-- Then delete the old batches themselves
DELETE FROM prospect_batches
WHERE created_at < '2026-04-14T00:00:00Z';

-- Delete orphaned pipeline_gates for deleted batches
DELETE FROM pipeline_gates
WHERE batch_id NOT IN (SELECT id FROM prospect_batches);

-- Delete orphaned contractor records (prospect placeholders with no pipeline entry)
DELETE FROM contractors
WHERE email LIKE 'prospect-%@placeholder.com'
  AND id NOT IN (SELECT contractor_id FROM prospect_pipeline WHERE contractor_id IS NOT NULL);
