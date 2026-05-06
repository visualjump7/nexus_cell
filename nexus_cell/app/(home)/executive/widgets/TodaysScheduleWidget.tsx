import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import type { TripSegment, Trip, ExternalCalendarEvent } from '@/lib/types'

interface Props {
  orgId: string
  // Optional: when present, the widget includes events from external calendars
  // the principal has marked visible. Pass the principal's user id so we can
  // filter by their preferences.
  principalUserId?: string
}

const segmentIcon: Record<string, string> = {
  flight: '✈',
  hotel: '🏨',
  car: '🚗',
  train: '🚄',
  ground_transport: '🚙',
  other: '•',
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface ScheduleItem {
  id: string
  kind: 'segment' | 'external'
  startTime: string | null
  title: string
  meta: string
  subtle?: string | null
  // For external events, we color the icon dot to match the source calendar.
  color?: string | null
  icon: string
}

export default async function TodaysScheduleWidget({ orgId, principalUserId }: Props) {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const startOfDayIso = today + 'T00:00:00'
  const endOfDayIso = tomorrow + 'T00:00:00'

  const [segmentsRes, externalEventsRes, prefsRes] = await Promise.all([
    supabase
      .from('trip_segments')
      .select('*, trips!inner(id, title, start_date, end_date, status, organization_id)')
      .eq('trips.organization_id', orgId)
      .gte('depart_at', startOfDayIso)
      .lt('depart_at', endOfDayIso)
      .order('depart_at', { ascending: true }),
    supabase
      .from('external_calendar_events')
      .select('*, external_calendars!inner(id, color, name, organization_id, archived)')
      .eq('external_calendars.organization_id', orgId)
      .eq('external_calendars.archived', false)
      .gte('start_at', startOfDayIso)
      .lt('start_at', endOfDayIso)
      .order('start_at', { ascending: true }),
    principalUserId
      ? supabase
          .from('external_calendar_preferences')
          .select('external_calendar_id, visible')
          .eq('user_id', principalUserId)
      : Promise.resolve({ data: [] as { external_calendar_id: string; visible: boolean }[] }),
  ])

  const segments = (segmentsRes.data || []) as (TripSegment & { trips: Pick<Trip, 'id' | 'title'> })[]
  const externalEvents = (externalEventsRes.data || []) as (ExternalCalendarEvent & {
    external_calendars: { id: string; color: string; name: string }
  })[]

  // Apply principal's per-calendar visibility prefs (default visible=true)
  const visibleByCalendar = new Map(
    (prefsRes.data || []).map(p => [p.external_calendar_id, !!p.visible]),
  )
  const filteredEvents = externalEvents.filter(ev => {
    if (!visibleByCalendar.has(ev.external_calendar_id)) return true
    return !!visibleByCalendar.get(ev.external_calendar_id)
  })

  // Merge into a single chronological list
  const items: ScheduleItem[] = []

  for (const seg of segments) {
    items.push({
      id: `seg-${seg.id}`,
      kind: 'segment',
      startTime: seg.depart_at,
      title:
        seg.from_location && seg.to_location
          ? `${seg.from_location} → ${seg.to_location}`
          : seg.from_location || seg.to_location || seg.segment_type,
      meta: [
        seg.depart_at ? formatTime(seg.depart_at) : '',
        seg.carrier ? `· ${seg.carrier}` : '',
        seg.confirmation_code ? `· ${seg.confirmation_code}` : '',
      ].filter(Boolean).join(' '),
      subtle: seg.trips?.title || null,
      icon: segmentIcon[seg.segment_type] || '•',
    })
  }

  for (const ev of filteredEvents) {
    items.push({
      id: `ev-${ev.id}`,
      kind: 'external',
      startTime: ev.start_at,
      title: ev.title || '(untitled)',
      meta: ev.all_day ? 'All day' : formatTime(ev.start_at),
      subtle: [ev.location, ev.external_calendars?.name].filter(Boolean).join(' · ') || null,
      color: ev.external_calendars?.color || null,
      icon: '•',
    })
  }

  // Sort by start time (all-day externals sort to top via empty string)
  items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  return (
    <WidgetCard
      title="Today's Schedule"
      subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      {items.length === 0 ? (
        <WidgetEmpty message="Nothing scheduled today." />
      ) : (
        <ul className="space-y-3 m-0 p-0 list-none">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-3">
              {item.kind === 'external' ? (
                <span
                  className="w-6 flex justify-center items-center mt-1.5 shrink-0"
                  aria-hidden
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: item.color || '#94a3b8' }}
                  />
                </span>
              ) : (
                <span className="w-6 text-center text-base shrink-0" aria-hidden>{item.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-tight">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  {item.meta && <span>{item.meta}</span>}
                </div>
                {item.subtle && (
                  <p className="text-xs text-gray-600 mt-0.5">{item.subtle}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
