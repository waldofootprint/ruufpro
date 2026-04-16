-- Fix RLS policies on crm_connections and ops pipeline tables.
--
-- crm_connections: policies used contractor_id = auth.uid() which is wrong.
-- auth.uid() returns the auth user UUID, not the contractor UUID.
-- Correct check: contractor_id matches the contractor owned by this user.
--
-- prospect_batches/prospect_pipeline/pipeline_gates: policies allowed any
-- authenticated user to read/write. These are internal ops tables — restrict
-- to service role only (API routes use service role key, not user sessions).

-- ═══════════════════════════════════════════════════════════════════
-- Fix crm_connections RLS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Contractors can view own connections" ON crm_connections;
DROP POLICY IF EXISTS "Contractors can insert own connections" ON crm_connections;
DROP POLICY IF EXISTS "Contractors can update own connections" ON crm_connections;
DROP POLICY IF EXISTS "Contractors can delete own connections" ON crm_connections;
DROP POLICY IF EXISTS "Service role full access" ON crm_connections;

CREATE POLICY "Contractors can view own connections"
  ON crm_connections FOR SELECT
  USING (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "Contractors can insert own connections"
  ON crm_connections FOR INSERT
  WITH CHECK (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "Contractors can update own connections"
  ON crm_connections FOR UPDATE
  USING (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "Contractors can delete own connections"
  ON crm_connections FOR DELETE
  USING (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════
-- Fix ops pipeline RLS — restrict to service role only
-- These tables are only accessed by API routes (which use service role)
-- and the ops dashboard (which also uses service role).
-- No end-user should ever query these directly.
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admin can manage batches" ON prospect_batches;
DROP POLICY IF EXISTS "Admin can manage pipeline" ON prospect_pipeline;
DROP POLICY IF EXISTS "Admin can manage gates" ON pipeline_gates;

-- Service role bypasses RLS entirely, so no explicit policy needed.
-- But we add a restrictive policy so if someone does query via anon/user key,
-- they get zero rows instead of everything.
CREATE POLICY "No direct access" ON prospect_batches FOR ALL USING (false);
CREATE POLICY "No direct access" ON prospect_pipeline FOR ALL USING (false);
CREATE POLICY "No direct access" ON pipeline_gates FOR ALL USING (false);
