-- Sprint 4: E-Signatures on Living Estimates
-- ESIGN Act / UETA compliance: store signer IP, timestamp, and frozen snapshot
-- of exactly what the homeowner agreed to at the moment of signing.

ALTER TABLE living_estimates
  ADD COLUMN IF NOT EXISTS signature_data text,           -- base64 PNG of hand-drawn signature
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,         -- when they signed
  ADD COLUMN IF NOT EXISTS signer_name text,              -- full legal name typed
  ADD COLUMN IF NOT EXISTS signer_email text,             -- signer's email (may differ from homeowner)
  ADD COLUMN IF NOT EXISTS signer_ip text,                -- IP address for audit trail
  ADD COLUMN IF NOT EXISTS signed_estimate_snapshot jsonb; -- frozen copy of material + addons + totals at sign time
