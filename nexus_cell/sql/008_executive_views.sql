-- ============================================================
-- NEXUS CELL — Executive Command Center
-- One row per (organization, principal) pairing. Stores the EA-curated
-- widget config the principal sees on /. Also adds principal_visible
-- to briefs so EA can pick which briefs surface in the Briefings widget.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS executive_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  principal_user_id UUID NOT NULL
    REFERENCES profiles(id) ON DELETE CASCADE,
  -- Ordered widget list. Each item: { widget_id: string, settings?: object }
  -- See lib/widgets.ts for the widget catalog.
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  greeting_style TEXT NOT NULL DEFAULT 'time_of_day'
    CHECK (greeting_style IN ('none', 'time_of_day', 'custom')),
  custom_greeting TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, principal_user_id)
);

CREATE INDEX IF NOT EXISTS idx_executive_views_org_principal
  ON executive_views(organization_id, principal_user_id);

ALTER TABLE executive_views ENABLE ROW LEVEL SECURITY;

-- SELECT: EA/admin can read all configs for their org; principal can read
-- their own row only.
CREATE POLICY "EA/admin read org executive views"
  ON executive_views FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );

CREATE POLICY "Principal read own executive view"
  ON executive_views FOR SELECT
  USING (
    principal_user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'principal'
    )
  );

-- INSERT/UPDATE/DELETE: EA/admin only
CREATE POLICY "EA/admin write executive views"
  ON executive_views FOR ALL
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

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION executive_views_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS executive_views_updated_at ON executive_views;
CREATE TRIGGER executive_views_updated_at
  BEFORE UPDATE ON executive_views
  FOR EACH ROW
  EXECUTE FUNCTION executive_views_set_updated_at();

-- ============================================================
-- briefs.principal_visible — EA toggles which briefs surface to principal
-- ============================================================

ALTER TABLE briefs
  ADD COLUMN IF NOT EXISTS principal_visible BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_briefs_principal_visible
  ON briefs(organization_id, principal_visible)
  WHERE principal_visible = true;
