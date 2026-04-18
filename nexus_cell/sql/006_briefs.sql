-- ============================================
-- 006: Daily Briefs System
-- ============================================
-- Ported from Fusion Cell migrations 009 + 010 + 015.
-- Adaptations for Nexus:
--   * RLS uses Nexus roles (principal, ea, cfo) instead of Fusion's
--     (executive, admin, manager).
--   * brief_blocks has no asset_id / project_id FK — briefs are org-level.
--     If per-project briefs are needed later, add a nullable project_id.
--   * brief_blocks.type starts at the post-015 enum (no 'holdings' value).
--   * Cover page columns are folded into the CREATE TABLE.

CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Daily Brief',
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  cover_title TEXT DEFAULT 'Daily Brief',
  cover_subtitle TEXT,
  cover_logo_url TEXT,
  cover_show_date BOOLEAN DEFAULT true,
  cover_show_principal BOOLEAN DEFAULT true,
  cover_accent_color TEXT DEFAULT '#4ade80',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brief_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'cashflow', 'bills', 'projects', 'decisions', 'document')),
  position INTEGER NOT NULL DEFAULT 0,
  content_html TEXT,
  config JSONB DEFAULT '{}',
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_org_status ON briefs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_briefs_org_date ON briefs(organization_id, brief_date DESC);
CREATE INDEX IF NOT EXISTS idx_brief_blocks_brief ON brief_blocks(brief_id, position);

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_blocks ENABLE ROW LEVEL SECURITY;

-- Write: EA + admin can manage briefs for their org.
CREATE POLICY "team_manages_briefs"
  ON briefs FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );

-- Read: Principal + CFO can read published briefs for their org.
CREATE POLICY "principal_cfo_reads_published_briefs"
  ON briefs FOR SELECT USING (
    status = 'published' AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('principal', 'cfo')
    )
  );

-- Write: EA + admin manage brief blocks for briefs they can manage.
CREATE POLICY "team_manages_brief_blocks"
  ON brief_blocks FOR ALL USING (
    brief_id IN (
      SELECT id FROM briefs WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('ea', 'admin')
      )
    )
  );

-- Read: Principal + CFO read blocks of published briefs they can see.
CREATE POLICY "principal_cfo_reads_published_brief_blocks"
  ON brief_blocks FOR SELECT USING (
    brief_id IN (
      SELECT id FROM briefs WHERE status = 'published' AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('principal', 'cfo')
      )
    )
  );
