import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import { RpList, RpRow, fmtTime, fmtDate, dot, Plane, BedDouble, Car, TrainFront, CalendarDays, MapPin } from '@/components/rp'
import type { TripSegment, Trip, ExternalCalendarEvent } from '@/lib/types'

interface Props {
  orgId: string
  // Optional: when present, the widget includes events from external calendars
  // the principal has marked visible. Pass the principal's user id so we can
  // filter by their preferences.
  principalUserId?: string
}

// Lucide stroke icons per segment type (no emoji).
const SEGMENT_ICON: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: BedDouble,
  car: Car,
  train: TrainFront,
  ground_transport: Car,
}

interface ScheduleItem {
  id: string
  kind: 'segment' | 'external'
  startTime: string | null
  title: string
  meta: string
  subtle?: string | null
  // For external events, a square marker in the source calendar's colour.
  color?: string | null
  segmentType?: string
  allDay?: boolean
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
      meta: dot(seg.carrier, seg.confirmation_code),
      subtle: seg.trips?.title || null,
      segmentType: seg.segment_type,
    })
  }

  for (const ev of filteredEvents) {
    items.push({
      id: `ev-${ev.id}`,
      kind: 'external',
      startTime: ev.start_at,
      title: ev.title || '(untitled)',
      meta: '',
      subtle: dot(ev.location, ev.external_calendars?.name) || null,
      color: ev.external_calendars?.color || null,
      allDay: ev.all_day,
    })
  }

  // Sort by start time (all-day externals sort to top via empty string)
  items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  return (
    <WidgetCard
      title="Today's schedule"
      subtitle={fmtDate(new Date(), 'weekday')}
      trailing={items.length > 0 ? <span className="font-display text-[15px] leading-none text-rp-text tabular-nums">{items.length}</span> : null}
    >
      {items.length === 0 ? (
        <WidgetEmpty message="Nothing scheduled today." />
      ) : (
        <RpList as="ul">
          {items.map(item => {
            const Icon = item.kind === 'segment' ? (SEGMENT_ICON[item.segmentType || ''] ?? MapPin) : CalendarDays
            const time = item.kind === 'external' && item.allDay ? 'All day' : fmtTime(item.startTime || '') || '—'
            return (
              <RpRow
                key={item.id}
                as="li"
                lead={
                  <span className="flex items-center gap-3">
                    <span className="w-[52px] font-display text-[13px] leading-[1.4] tracking-[.06em] text-rp-dim tabular-nums">{time}</span>
                    {item.kind === 'external' ? (
                      <span className="flex h-4 w-4 items-center justify-center" aria-hidden>
                        <span className="h-2 w-2" style={{ background: item.color || '#9AA0A4' }} />
                      </span>
                    ) : (
                      <Icon size={16} strokeWidth={1.5} className="text-rp-muted" aria-hidden />
                    )}
                  </span>
                }
                title={item.title}
                meta={dot(item.meta, item.subtle) || undefined}
              />
            )
          })}
        </RpList>
      )}
    </WidgetCard>
  )
}
