-- ============================================
-- 007: Budget imports + monthly metadata
-- ============================================
-- Minimal scope: preserves Nexus's flat `budgets` model (category +
-- budgeted + actual + period per project) and adds two things:
--
-- 1. budgets.metadata (JSONB) — stores monthly breakdown when an Excel
--    import provides it: {"monthly": {"jan": 1000, "feb": 1000, ...,
--    "annual_total": 12000, "is_fixed": true, "line_name": "Insurance"}}.
--    QuickBooks imports populate different keys. Null/empty when the
--    budget row was hand-entered.
--
-- 2. budget_versions — tracks each import event so EAs/CFOs can see
--    "last imported 2026-04-18 from budget.xlsx" and audit source.
--
-- This does NOT adopt Fusion's full line-item model (budget_categories,
-- budget_line_items, monthly cells). If that model is needed later, a
-- future migration can denormalize from budgets.metadata into dedicated
-- tables without data loss.

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS budget_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  source TEXT NOT NULL CHECK (source IN ('excel', 'quickbooks', 'manual')),
  filename TEXT,
  sheet_name TEXT,
  period TEXT,
  summary JSONB DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_versions_project
  ON budget_versions(project_id, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_versions_org
  ON budget_versions(organization_id, imported_at DESC);

ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;

-- EAs, admins, and CFOs can read; EAs and admins can write.
CREATE POLICY "team_reads_budget_versions"
  ON budget_versions FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin', 'cfo')
    )
  );

CREATE POLICY "team_writes_budget_versions"
  ON budget_versions FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );

CREATE POLICY "team_deletes_budget_versions"
  ON budget_versions FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('ea', 'admin')
    )
  );
