-- Migration 063: Add ON DELETE CASCADE to prospect_pipeline.batch_id
-- Deleting a batch now auto-deletes its pipeline rows. No more orphans.

-- Step 1: Drop the existing foreign key (find it dynamically)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'prospect_pipeline'::regclass
    AND confrelid = 'prospect_batches'::regclass
    AND contype = 'f';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE prospect_pipeline DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Step 2: Re-add with CASCADE
ALTER TABLE prospect_pipeline
  ADD CONSTRAINT prospect_pipeline_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES prospect_batches(id) ON DELETE CASCADE;

-- Step 3: Clean up any existing orphaned rows (batch_id references deleted batches)
DELETE FROM prospect_pipeline
WHERE batch_id IS NOT NULL
  AND batch_id NOT IN (SELECT id FROM prospect_batches);
