// External calendar sync.
//
// Fetches an ICS feed, parses it with node-ical, and upserts events into
// external_calendar_events. Handles webcal:// URLs by normalizing to https://.
//
// Recurrence: master events are stored with their RRULE string. The Calendar
// page expands recurring instances at read time using the rrule library so we
// don't bloat the table with every instance of a daily event.
//
// SERVER-ONLY. Imports node-ical which depends on Node-only modules.

import * as ical from 'node-ical'
import { createAdminClient } from '@/utils/supabase/admin'

const STALE_AFTER_MS = 15 * 60 * 1000 // 15 minutes

export interface SyncResult {
  ok: boolean
  eventsUpserted?: number
  error?: string
}

// Normalize webcal:// → https://. Apple Calendar URLs use webcal://.
function normalizeUrl(url: string): string {
  if (url.startsWith('webcal://')) return 'https://' + url.slice('webcal://'.length)
  return url
}

// Test fetch — used by the "Test" button when adding a calendar so the user
// catches typos before saving. Returns ok=true and a hint of how many events
// were found, or ok=false with an error message.
export async function testIcsUrl(rawUrl: string): Promise<SyncResult> {
  try {
    const url = normalizeUrl(rawUrl)
    const data = await ical.async.fromURL(url)
    const eventCount = Object.values(data).filter(
      (v: unknown) => (v as { type?: string })?.type === 'VEVENT',
    ).length
    return { ok: true, eventsUpserted: eventCount }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch'
    return { ok: false, error: msg }
  }
}

// Sync a single calendar. Uses the service-role client so it can write to
// external_calendar_events regardless of RLS (events table has no INSERT
// policy on purpose — only sync writes).
export async function syncCalendar(calendarId: string): Promise<SyncResult> {
  const admin = createAdminClient()

  const { data: cal, error: calErr } = await admin
    .from('external_calendars')
    .select('id, ics_url, archived')
    .eq('id', calendarId)
    .single()

  if (calErr || !cal) return { ok: false, error: 'Calendar not found' }
  if (cal.archived) return { ok: false, error: 'Calendar archived' }

  let parsed: Record<string, unknown>
  try {
    parsed = await ical.async.fromURL(normalizeUrl(cal.ics_url))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Fetch failed'
    await admin
      .from('external_calendars')
      .update({ last_synced_at: new Date().toISOString(), last_sync_error: msg })
      .eq('id', calendarId)
    return { ok: false, error: msg }
  }

  // Collect VEVENTs and shape rows for upsert
  type Row = {
    external_calendar_id: string
    uid: string
    title: string | null
    description: string | null
    location: string | null
    start_at: string
    end_at: string | null
    all_day: boolean
    rrule: string | null
    synced_at: string
  }

  const rows: Row[] = []
  const now = new Date().toISOString()

  for (const key of Object.keys(parsed)) {
    const ev = parsed[key] as {
      type?: string
      uid?: string
      summary?: string
      description?: string
      location?: string
      start?: Date
      end?: Date
      datetype?: string
      rrule?: { toString: () => string } | undefined
    }
    if (ev?.type !== 'VEVENT') continue
    if (!ev.uid || !ev.start) continue

    const allDay = ev.datetype === 'date'
    rows.push({
      external_calendar_id: calendarId,
      uid: String(ev.uid),
      title: ev.summary ? String(ev.summary) : null,
      description: ev.description ? String(ev.description) : null,
      location: ev.location ? String(ev.location) : null,
      start_at: new Date(ev.start).toISOString(),
      end_at: ev.end ? new Date(ev.end).toISOString() : null,
      all_day: allDay,
      rrule: ev.rrule ? ev.rrule.toString() : null,
      synced_at: now,
    })
  }

  if (rows.length > 0) {
    // Upsert by (calendar_id, uid). Existing rows are updated in place so we
    // don't duplicate events when a calendar is re-synced.
    const { error: upsertErr } = await admin
      .from('external_calendar_events')
      .upsert(rows, { onConflict: 'external_calendar_id,uid' })

    if (upsertErr) {
      await admin
        .from('external_calendars')
        .update({ last_synced_at: now, last_sync_error: upsertErr.message })
        .eq('id', calendarId)
      return { ok: false, error: upsertErr.message }
    }
  }

  // Drop events that no longer exist in the source feed (cancelled / removed).
  const seenUids = rows.map(r => r.uid)
  if (seenUids.length > 0) {
    await admin
      .from('external_calendar_events')
      .delete()
      .eq('external_calendar_id', calendarId)
      .not('uid', 'in', `(${seenUids.map(u => `"${u.replace(/"/g, '""')}"`).join(',')})`)
  } else {
    // Source returned zero events — clear cache.
    await admin
      .from('external_calendar_events')
      .delete()
      .eq('external_calendar_id', calendarId)
  }

  await admin
    .from('external_calendars')
    .update({ last_synced_at: now, last_sync_error: null })
    .eq('id', calendarId)

  return { ok: true, eventsUpserted: rows.length }
}

// Sync any non-archived calendars in the org whose last_synced_at is stale
// (or null = never synced). Called from the Calendar page on load.
// Returns silently — best effort, errors land in last_sync_error.
export async function syncStaleOrgCalendars(orgId: string): Promise<void> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString()

  const { data } = await admin
    .from('external_calendars')
    .select('id')
    .eq('organization_id', orgId)
    .eq('archived', false)
    .or(`last_synced_at.is.null,last_synced_at.lt.${cutoff}`)

  if (!data || data.length === 0) return

  // Sync in parallel — each call independently writes its result
  await Promise.all(data.map(c => syncCalendar(c.id)))
}
