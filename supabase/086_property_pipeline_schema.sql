-- Migration 086: Property Pipeline schema
--
-- Adds 4 new tables + amends 2 existing tables to support the Property Pipeline
-- feature (in-market homeowner direct-mail leads). MVP scope: Manatee County,
-- one design partner.
--
-- Companion: 087_property_pipeline_universe_load.sql (one-time data load)
-- Locked plan refs:
--   research/property-pipeline-build-plan-2026-04-26.md
--   decisions/property-pipeline-round4-and-simplifications.md
--
-- Order matters: contractors columns added FIRST so the candidates RLS policy
-- can reference service_area_zips. RLS uses security-definer helper fns
-- (pp_current_contractor_id, pp_current_service_zips) per the RLS-perf rule —
-- avoids the `zip = ANY(scalar_subquery)` parser ambiguity AND keeps auth.uid()
-- evaluated once per query instead of per row.
--
-- Idempotency: every block uses IF NOT EXISTS or DO-block existence checks.
-- Reversible: see ROLLBACK block at bottom (commented).
--
-- APPLIED: 2026-04-26 via Supabase MCP. 28,920 candidate rows loaded.

-- =============================================================================
-- 0. Amend contractors first (RLS policies below depend on these columns)
-- =============================================================================

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS service_area_zips text[] DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS direct_mail_authorized_at timestamptz DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS direct_mail_authorization_ip text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS direct_mail_authorization_user_agent text DEFAULT NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS design_partner boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contractors_service_area_zips_size_check') THEN
    ALTER TABLE contractors ADD CONSTRAINT contractors_service_area_zips_size_check
      CHECK (service_area_zips IS NULL OR (array_length(service_area_zips, 1) BETWEEN 1 AND 25));
  END IF;
END $$;

COMMENT ON COLUMN contractors.service_area_zips IS
  'ZIP multi-select per R2.4. Min 1 / max 25. Drives property_pipeline_candidates SELECT scope.';
COMMENT ON COLUMN contractors.design_partner IS
  'True for the Common Paper Design Partner Agreement participant (R3.19). Flag exists so post-pilot auto-conversion to $99/mo can target the right account.';

-- =============================================================================
-- 1. direct_mail_authorization_versions (versioned legal-text snapshots)
-- -----------------------------------------------------------------------------
-- ESIGN/UETA require the audit trail to be "reproducible" — storing only a
-- version_hash on contractors is meaningless without a retrievable text source.
-- This table IS the source. S3 object-lock deferred to v1.1 per R3.13;
-- Postgres-only retention is defensible per FL ESIGN unless P6 attorney memo
-- says otherwise.
-- =============================================================================

CREATE TABLE IF NOT EXISTS direct_mail_authorization_versions (
  version_hash  text PRIMARY KEY,
  text          text NOT NULL,
  effective_at  timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz NULL,
  notes         text NULL
);

COMMENT ON TABLE direct_mail_authorization_versions IS
  'Versioned snapshots of the direct-mail authorization clickwrap text. Joined from contractors.direct_mail_authorization_version_hash for ESIGN-reproducible audit trails.';
COMMENT ON COLUMN direct_mail_authorization_versions.version_hash IS
  'SHA256 of normalized text. Generated app-side at version publish; never recomputed (changing text = new version row).';

ALTER TABLE direct_mail_authorization_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read authorization versions"
  ON direct_mail_authorization_versions;
CREATE POLICY "Authenticated can read authorization versions"
  ON direct_mail_authorization_versions FOR SELECT TO authenticated USING (true);

-- Add the FK column on contractors now that the versions table exists.
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS direct_mail_authorization_version_hash text
    REFERENCES direct_mail_authorization_versions(version_hash) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS contractors_dma_version_hash_idx
  ON contractors (direct_mail_authorization_version_hash)
  WHERE direct_mail_authorization_version_hash IS NOT NULL;

COMMENT ON COLUMN contractors.direct_mail_authorization_version_hash IS
  'FK to direct_mail_authorization_versions. Joins to retrieve the exact legal text the roofer agreed to (ESIGN reproducibility).';

-- =============================================================================
-- 2. RLS helper functions (security-definer + locked search_path)
-- -----------------------------------------------------------------------------
-- Per security-rls-performance.md best practice. SECURITY DEFINER bypasses RLS
-- for the lookup itself (cheap, indexed by user_id), STABLE makes the planner
-- cache the result per query.
-- =============================================================================

CREATE OR REPLACE FUNCTION pp_current_contractor_id()
RETURNS uuid LANGUAGE sql
SECURITY DEFINER SET search_path = '' STABLE
AS $$
  SELECT id FROM public.contractors
   WHERE user_id = (SELECT auth.uid())
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION pp_current_service_zips()
RETURNS text[] LANGUAGE sql
SECURITY DEFINER SET search_path = '' STABLE
AS $$
  SELECT COALESCE(service_area_zips, ARRAY[]::text[])
    FROM public.contractors
   WHERE user_id = (SELECT auth.uid())
   LIMIT 1;
$$;

-- =============================================================================
-- 3. property_pipeline_candidates (the universe of in-market homes)
-- -----------------------------------------------------------------------------
-- contractor_id is NULLABLE on purpose at MVP per R2.3 deferral. At N=1 design
-- partner there is no race / tiebreak / centroid math worth running. Dashboard
-- queries select WHERE zip = ANY(contractor.service_area_zips). When customer
-- #2 signs, run a one-time backfill that pre-assigns based on R2.3 (subscription
-- seniority + service-area centroid) — pure data migration, no schema change.
-- =============================================================================

CREATE TABLE IF NOT EXISTS property_pipeline_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id       text NOT NULL UNIQUE,
  county          text NOT NULL DEFAULT 'manatee',
  contractor_id   uuid NULL REFERENCES contractors(id) ON DELETE SET NULL,
  address_raw        text NOT NULL,
  address_normalized text NOT NULL,
  address_hash       text NOT NULL,
  city               text NOT NULL,
  zip                text NOT NULL,
  year_built       integer NOT NULL,
  assessed_value   numeric NULL,
  status           text NOT NULL DEFAULT 'active',
  score            integer NULL,
  tier             text NULL,
  score_factors    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppc_status_check') THEN
    ALTER TABLE property_pipeline_candidates ADD CONSTRAINT ppc_status_check
      CHECK (status IN ('active','engaged','suppressed','cooled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppc_tier_check') THEN
    ALTER TABLE property_pipeline_candidates ADD CONSTRAINT ppc_tier_check
      CHECK (tier IS NULL OR tier IN ('hot','warm','cool'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppc_score_range_check') THEN
    ALTER TABLE property_pipeline_candidates ADD CONSTRAINT ppc_score_range_check
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppc_year_built_check') THEN
    ALTER TABLE property_pipeline_candidates ADD CONSTRAINT ppc_year_built_check
      CHECK (year_built BETWEEN 1850 AND 2100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ppc_zip_status_idx
  ON property_pipeline_candidates (zip, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS ppc_address_hash_idx
  ON property_pipeline_candidates (address_hash);
CREATE INDEX IF NOT EXISTS ppc_contractor_id_idx
  ON property_pipeline_candidates (contractor_id) WHERE contractor_id IS NOT NULL;

COMMENT ON COLUMN property_pipeline_candidates.contractor_id IS
  'Nullable on purpose: at MVP we leave NULL and query by zip in contractor.service_area_zips. Backfill assignment per R2.3 when customer #2 signs.';
COMMENT ON COLUMN property_pipeline_candidates.address_hash IS
  'SHA256 of address_normalized. Indexed for fast suppression lookup.';
COMMENT ON COLUMN property_pipeline_candidates.score_factors IS
  'Live state, NOT journaled (R3.6 audit-trail decision). Per-send hash captured separately on mailing_history.score_at_send.';

CREATE OR REPLACE FUNCTION ppc_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS ppc_updated_at_trigger ON property_pipeline_candidates;
CREATE TRIGGER ppc_updated_at_trigger
  BEFORE UPDATE ON property_pipeline_candidates
  FOR EACH ROW EXECUTE FUNCTION ppc_set_updated_at();

ALTER TABLE property_pipeline_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read candidates in their service area"
  ON property_pipeline_candidates;
CREATE POLICY "Contractors read candidates in their service area"
  ON property_pipeline_candidates FOR SELECT TO authenticated
  USING (zip = ANY(pp_current_service_zips()));

-- =============================================================================
-- 4. mailing_history (one row per postcard sent)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mailing_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL REFERENCES property_pipeline_candidates(id) ON DELETE RESTRICT,
  contractor_id   uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  parcel_id       text NOT NULL,
  touch_number    integer NOT NULL DEFAULT 1,
  qr_short_code   text NOT NULL UNIQUE,
  lob_postcard_id text NULL,
  sent_at         timestamptz NULL,
  qr_scanned_at   timestamptz NULL,
  lead_id         uuid NULL REFERENCES leads(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'pending',
  score_at_send   integer NULL,
  tier_at_send    text NULL,
  credits_consumed numeric NOT NULL DEFAULT 1.0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mh_status_check') THEN
    ALTER TABLE mailing_history ADD CONSTRAINT mh_status_check
      CHECK (status IN ('pending','sent','delivered','returned','scanned','engaged','failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mh_touch_number_check') THEN
    ALTER TABLE mailing_history ADD CONSTRAINT mh_touch_number_check
      CHECK (touch_number BETWEEN 1 AND 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mh_qr_short_code_format_check') THEN
    ALTER TABLE mailing_history ADD CONSTRAINT mh_qr_short_code_format_check
      -- 6-char base32-Crockford (no 0/O/1/I/L)
      CHECK (qr_short_code ~ '^[023456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS mh_qr_short_code_idx ON mailing_history (qr_short_code);
CREATE INDEX IF NOT EXISTS mh_lob_postcard_id_idx ON mailing_history (lob_postcard_id) WHERE lob_postcard_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mh_contractor_sent_at_idx ON mailing_history (contractor_id, sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS mh_parcel_id_sent_at_idx ON mailing_history (parcel_id, sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS mh_candidate_id_idx ON mailing_history (candidate_id);
CREATE INDEX IF NOT EXISTS mh_lead_id_idx ON mailing_history (lead_id) WHERE lead_id IS NOT NULL;

COMMENT ON COLUMN mailing_history.qr_short_code IS
  '6-char base32-Crockford (no 0/O/1/I/L) - typo-resistant for the printed mention code on postcards.';
COMMENT ON COLUMN mailing_history.parcel_id IS
  'Denormalized from candidates.parcel_id. Avoids JOIN on hot dedup queries.';

ALTER TABLE mailing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read own mailing history" ON mailing_history;
CREATE POLICY "Contractors read own mailing history"
  ON mailing_history FOR SELECT TO authenticated
  USING (contractor_id = pp_current_contractor_id());

-- =============================================================================
-- 5. mail_suppressions (opt-out registry)
-- -----------------------------------------------------------------------------
-- NULL contractor_id = global suppression. Non-NULL = per-roofer (R3.11
-- two-tier model). Pre-send suppression check is the legal hot path.
-- =============================================================================

CREATE TABLE IF NOT EXISTS mail_suppressions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_hash    text NOT NULL,
  contractor_id   uuid NULL REFERENCES contractors(id) ON DELETE CASCADE,
  source          text NOT NULL,
  reason          text NULL,
  suppressed_at   timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ms_source_check') THEN
    ALTER TABLE mail_suppressions ADD CONSTRAINT ms_source_check
      CHECK (source IN ('postcard_qr','web_form','text','phone','dmachoice','ncoa','dbpr_complaint','manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ms_address_contractor_idx
  ON mail_suppressions (address_hash, contractor_id);
-- Treat NULL contractor as a single global slot via partial unique index pair.
CREATE UNIQUE INDEX IF NOT EXISTS ms_unique_per_contractor_idx
  ON mail_suppressions (address_hash, contractor_id) WHERE contractor_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ms_unique_global_idx
  ON mail_suppressions (address_hash) WHERE contractor_id IS NULL;

COMMENT ON COLUMN mail_suppressions.contractor_id IS
  'NULL = global suppression (applies to all roofers). Non-NULL = per-roofer only (R3.11 two-tier suppression).';

ALTER TABLE mail_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read own + global suppressions" ON mail_suppressions;
CREATE POLICY "Contractors read own + global suppressions"
  ON mail_suppressions FOR SELECT TO authenticated
  USING (contractor_id IS NULL OR contractor_id = pp_current_contractor_id());

-- =============================================================================
-- 6. Amend leads (after PP tables exist for FK references)
-- =============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_candidate_id uuid
  REFERENCES property_pipeline_candidates(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mailing_history_id uuid
  REFERENCES mailing_history(id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('contact_form','estimate_widget','external_widget','property_pipeline'));

CREATE INDEX IF NOT EXISTS leads_pipeline_candidate_id_idx
  ON leads (pipeline_candidate_id) WHERE pipeline_candidate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_mailing_history_id_idx
  ON leads (mailing_history_id) WHERE mailing_history_id IS NOT NULL;

-- =============================================================================
-- ROLLBACK (commented; uncomment + run if needed)
-- =============================================================================
-- /*
-- ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
-- ALTER TABLE leads ADD CONSTRAINT leads_source_check
--   CHECK (source IN ('contact_form','estimate_widget','external_widget'));
-- ALTER TABLE leads DROP COLUMN IF EXISTS mailing_history_id;
-- ALTER TABLE leads DROP COLUMN IF EXISTS pipeline_candidate_id;
-- DROP TABLE IF EXISTS mail_suppressions;
-- DROP TABLE IF EXISTS mailing_history;
-- DROP TRIGGER IF EXISTS ppc_updated_at_trigger ON property_pipeline_candidates;
-- DROP FUNCTION IF EXISTS ppc_set_updated_at();
-- DROP TABLE IF EXISTS property_pipeline_candidates;
-- DROP FUNCTION IF EXISTS pp_current_service_zips();
-- DROP FUNCTION IF EXISTS pp_current_contractor_id();
-- ALTER TABLE contractors DROP COLUMN IF EXISTS direct_mail_authorization_version_hash;
-- DROP TABLE IF EXISTS direct_mail_authorization_versions;
-- ALTER TABLE contractors DROP COLUMN IF EXISTS design_partner;
-- ALTER TABLE contractors DROP COLUMN IF EXISTS direct_mail_authorization_user_agent;
-- ALTER TABLE contractors DROP COLUMN IF EXISTS direct_mail_authorization_ip;
-- ALTER TABLE contractors DROP COLUMN IF EXISTS direct_mail_authorized_at;
-- ALTER TABLE contractors DROP COLUMN IF EXISTS service_area_zips;
-- */
