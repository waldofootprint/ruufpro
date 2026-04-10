-- Migration 042: CRM OAuth connections (Jobber, Housecall Pro)
-- Stores OAuth tokens for direct CRM integrations (replaces Zapier)

CREATE TABLE IF NOT EXISTS crm_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('jobber', 'housecall_pro')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active connection per provider per contractor
  UNIQUE (contractor_id, provider)
);

-- Index for quick lookup when pushing leads
CREATE INDEX idx_crm_connections_contractor ON crm_connections(contractor_id) WHERE status = 'active';

-- Index for token refresh cron (find expiring tokens)
CREATE INDEX idx_crm_connections_expires ON crm_connections(expires_at) WHERE status = 'active';

-- RLS
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own connections"
  ON crm_connections FOR SELECT
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can insert own connections"
  ON crm_connections FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update own connections"
  ON crm_connections FOR UPDATE
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete own connections"
  ON crm_connections FOR DELETE
  USING (contractor_id = auth.uid());

-- Service role needs access for OAuth callback + token refresh
CREATE POLICY "Service role full access"
  ON crm_connections FOR ALL
  USING (auth.role() = 'service_role');
