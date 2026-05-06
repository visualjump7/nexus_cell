import { getAuthContext } from '@/lib/auth'
import CalendarsManager from './CalendarsManager'
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
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-200 mb-1">Calendars</h1>
      <p className="text-sm text-gray-500 mb-6">
        Subscribe to external calendars (Apple, Outlook, Google) so the team can see them alongside Nexus events.
        Each user can toggle which calendars they see on the Calendar page.
      </p>
      <CalendarsManager initialCalendars={calendars} />
    </div>
  )
}
