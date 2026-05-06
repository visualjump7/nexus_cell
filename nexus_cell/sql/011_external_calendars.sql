-- ============================================================
-- NEXUS CELL — External calendar subscriptions (ICS)
--
-- Org-shared calendars added by EA/admin (e.g. "Principal's iCloud").
-- Each user has per-calendar visibility preferences so they can toggle
-- which calendars appear on their Calendar page.
--
-- Sync is on-demand — when the Calendar page loads, stale calendars
-- (last_synced_at older than ~15 min) get refetched. Master events are
-- stored with their RRULE; recurring instances are expanded at read time.
--
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS external_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'ics'
    CHECK (provider IN ('apple', 'outlook', 'google', 'ics')),
  ics_url TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_calendars_org
  ON external_calendars(organization_id) WHERE archived = false;

ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read calendars"
  ON external_calendars FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "EA/admin write calendars"
  ON external_calendars FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('ea', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('ea', 'admin')
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION external_calendars_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS external_calendars_updated_at ON external_calendars;
CREATE TRIGGER external_calendars_updated_at
  BEFORE UPDATE ON external_calendars
  FOR EACH ROW
  EXECUTE FUNCTION external_calendars_set_updated_at();

-- ============================================================
-- Per-user visibility preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS external_calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  external_calendar_id UUID NOT NULL REFERENCES external_calendars(id) ON DELETE CASCADE,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, external_calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_prefs_user
  ON external_calendar_preferences(user_id);

ALTER TABLE external_calendar_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON external_calendar_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Cached events (master rows; recurring instances expand at read time)
-- ============================================================

CREATE TABLE IF NOT EXISTS external_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_calendar_id UUID NOT NULL REFERENCES external_calendars(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,                -- iCal UID; used to dedup across syncs
  title TEXT,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  rrule TEXT,                       -- recurrence rule, expanded by client/server at read time
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (external_calendar_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_external_events_cal_start
  ON external_calendar_events(external_calendar_id, start_at);

ALTER TABLE external_calendar_events ENABLE ROW LEVEL SECURITY;

-- Read access matches the parent calendar's read policy: any active org member
-- whose org owns the calendar.
CREATE POLICY "Org members read events"
  ON external_calendar_events FOR SELECT
  USING (
    external_calendar_id IN (
      SELECT id FROM external_calendars
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Writes only via service role (sync) — no client-side INSERT/UPDATE/DELETE policy.
