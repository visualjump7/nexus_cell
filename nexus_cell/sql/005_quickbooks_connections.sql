-- ============================================================
-- NEXUS CELL — QuickBooks Online Connections
-- One row per organization. Stores OAuth tokens for QBO sandbox/prod.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE
    REFERENCES organizations(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox'
    CHECK (environment IN ('sandbox', 'production')),
  -- TODO(prod-hardening): wrap tokens with pgcrypto pgp_sym_encrypt before GA
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  connected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qb_connections_org
  ON quickbooks_connections(organization_id);

ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: any active member of the org
CREATE POLICY "Org members can view QB connection"
  ON quickbooks_connections FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- INSERT/UPDATE/DELETE: only EA or admin
CREATE POLICY "EA/admin can write QB connection"
  ON quickbooks_connections FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );
