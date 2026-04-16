-- Migration 073: Consolidate preview_site_url, rename timestamps, update stages + gates
-- Applied 2026-04-16

-- Step 1: Update check constraints to include new values
ALTER TABLE prospect_pipeline DROP CONSTRAINT prospect_pipeline_stage_check;
ALTER TABLE prospect_pipeline ADD CONSTRAINT prospect_pipeline_stage_check CHECK (stage = ANY (ARRAY[
  'scraped', 'google_enriched', 'awaiting_triage', 'parked', 'enriched',
  'site_built', 'site_approved',
  'demo_built', 'demo_approved',
  'contact_lookup', 'contact_ready', 'outreach_approved',
  'sent', 'awaiting_reply', 'replied', 'draft_ready', 'responded',
  'interested', 'not_now', 'objection', 'unsubscribed', 'free_signup', 'paid',
  'ai_rewritten'
]));

ALTER TABLE pipeline_gates DROP CONSTRAINT pipeline_gates_gate_type_check;
ALTER TABLE pipeline_gates ADD CONSTRAINT pipeline_gates_gate_type_check CHECK (gate_type = ANY (ARRAY[
  'site_review', 'demo_review', 'outreach_approval', 'draft_approval'
]));

-- Step 2: Copy preview_site_url data into demo_page_url where needed, then drop old column
UPDATE prospect_pipeline SET demo_page_url = preview_site_url WHERE demo_page_url IS NULL AND preview_site_url IS NOT NULL;
ALTER TABLE prospect_pipeline DROP COLUMN preview_site_url;

-- Step 3: Rename timestamp columns
ALTER TABLE prospect_pipeline RENAME COLUMN site_built_at TO demo_page_built_at;
ALTER TABLE prospect_pipeline RENAME COLUMN site_approved_at TO demo_page_approved_at;

-- Step 4: Update stage values for any existing rows
UPDATE prospect_pipeline SET stage = 'demo_built' WHERE stage = 'site_built';
UPDATE prospect_pipeline SET stage = 'demo_approved' WHERE stage = 'site_approved';

-- Step 5: Update gate types
UPDATE pipeline_gates SET gate_type = 'demo_review' WHERE gate_type = 'site_review';
