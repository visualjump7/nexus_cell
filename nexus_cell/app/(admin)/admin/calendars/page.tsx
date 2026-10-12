import { getAuthContext } from '@/lib/auth'
import { RpPage, RpPageHeader } from '@/components/rp'
import CalendarsManager from './CalendarsManager'

export const metadata = { title: 'Calendars' }
import type { ExternalCalendar } from '@/lib/types'

export default async function AdminCalendarsPage() {
  const { supabase, orgId } = await getAuthContext()

  const [calsRes, eventsRes] = await Promise.all([
    supabase
      .from('external_calendars')
      .select('*')
      .eq('organization_id', orgId)
      .order('archived', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('external_calendar_events')
      .select('external_calendar_id'),
  ])

  // Tally event counts per calendar so the manager can show "N events synced"
  const counts = new Map<string, number>()
  for (const row of eventsRes.data || []) {
    counts.set(row.external_calendar_id, (counts.get(row.external_calendar_id) || 0) + 1)
  }

  const calendars = (calsRes.data || []).map(c => ({
    ...c,
    event_count: counts.get(c.id) || 0,
  })) as (ExternalCalendar & { event_count: number })[]

  return (
    <RpPage>
      <RpPageHeader
        eyebrow="05 · Calendars"
        title="Calendars"
        line="External calendars (Apple, Outlook, Google) shown beside the build schedule. Each member chooses which ones they see."
      />
      <CalendarsManager initialCalendars={calendars} />
    </RpPage>
  )
}
