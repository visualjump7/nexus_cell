import { getAuthContext } from '@/lib/auth'
import CalendarView from '@/app/(modules)/calendar/CalendarView'
import SectionOverlay from '@/components/shared/SectionOverlay'
import type { ExternalCalendar, ExternalCalendarEvent } from '@/lib/types'

export default async function CalendarOverlay() {
  const { supabase, user, orgId } = await getAuthContext()

  const now = new Date()
  const horizonStart = new Date(now); horizonStart.setDate(horizonStart.getDate() - 7)
  const horizonEnd = new Date(now); horizonEnd.setDate(horizonEnd.getDate() + 90)

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
  const visibleByCalendar = new Map((prefsRes.data || []).map(p => [p.external_calendar_id, !!p.visible]))
  const calendarsWithVisibility = calendars.map(c => ({
    ...c,
    visible: visibleByCalendar.has(c.id) ? !!visibleByCalendar.get(c.id) : true,
  }))

  return (
    <SectionOverlay title="Calendar" fullPageHref="/calendar">
      <CalendarView calendars={calendarsWithVisibility} events={events} />
    </SectionOverlay>
  )
}
