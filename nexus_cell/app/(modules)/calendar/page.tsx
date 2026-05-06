import { getAuthContext } from '@/lib/auth'
import CalendarView from './CalendarView'
import type { ExternalCalendar, ExternalCalendarEvent } from '@/lib/types'

export default async function CalendarPage() {
  const { supabase, user, orgId } = await getAuthContext()

  // Fetch external calendars + this user's per-calendar preferences. Events
  // for the next 90 days are loaded once and filtered client-side as the user
  // toggles calendars on/off (no extra round trips on toggle).
  const now = new Date()
  const horizonStart = new Date(now)
  horizonStart.setDate(horizonStart.getDate() - 7) // small back-window so today's events appear if they started yesterday
  const horizonEnd = new Date(now)
  horizonEnd.setDate(horizonEnd.getDate() + 90)

  const [calsRes, prefsRes, eventsRes] = await Promise.all([
    supabase
      .from('external_calendars')
      .select('*')
      .eq('organization_id', orgId)
      .eq('archived', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('external_calendar_preferences')
      .select('external_calendar_id, visible')
      .eq('user_id', user.id),
    // Subquery via the join: only events whose parent calendar is in this org and not archived
    supabase
      .from('external_calendar_events')
      .select('*, external_calendars!inner(organization_id, archived)')
      .eq('external_calendars.organization_id', orgId)
      .eq('external_calendars.archived', false)
      .gte('start_at', horizonStart.toISOString())
      .lte('start_at', horizonEnd.toISOString())
      .order('start_at', { ascending: true }),
  ])

  const calendars = (calsRes.data || []) as ExternalCalendar[]
  const events = (eventsRes.data || []) as ExternalCalendarEvent[]
  const prefs = prefsRes.data || []
  const visibleByCalendar = new Map(prefs.map(p => [p.external_calendar_id, !!p.visible]))

  // Default to visible=true for any calendar without an explicit preference row
  const calendarsWithVisibility = calendars.map(c => ({
    ...c,
    visible: visibleByCalendar.has(c.id) ? !!visibleByCalendar.get(c.id) : true,
  }))

  return <CalendarView calendars={calendarsWithVisibility} events={events} />
}
