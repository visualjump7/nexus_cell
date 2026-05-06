-- ============================================================
-- NEXUS CELL — Pending Invitations
-- EAs propose new users; admins must approve before the auth user is
-- actually created. See app/api/admin/invitations + /admin/users for the flow.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL
    REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('principal', 'ea', 'cfo', 'admin', 'viewer')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One pending invite per email per org at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_invites_unique_pending
  ON pending_invitations(organization_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_invites_org_status
  ON pending_invitations(organization_id, status);

ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: EAs see invites they proposed in their org; admins see all in their org.
CREATE POLICY "EA sees own invites; admin sees all"
  ON pending_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
    OR (
      proposed_by = auth.uid()
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('ea', 'admin')
      )
    )
  );

-- INSERT: EA or admin in the org may propose
CREATE POLICY "EA/admin propose invites"
  ON pending_invitations FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );

-- UPDATE / DELETE: admin only (approve, reject, retract)
CREATE POLICY "Admin updates invites"
  ON pending_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );

CREATE POLICY "Admin deletes invites"
  ON pending_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION pending_invitations_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pending_invitations_updated_at ON pending_invitations;
CREATE TRIGGER pending_invitations_updated_at
  BEFORE UPDATE ON pending_invitations
  FOR EACH ROW
  EXECUTE FUNCTION pending_invitations_set_updated_at();
