import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import type { Trip, TripSegment } from '@/lib/types'

interface Props {
  orgId: string
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function formatRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const s = new Date(start + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (!end || end === start) return s
  const e = new Date(end + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${s} – ${e}`
}

export default async function NextTripWidget({ orgId }: Props) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('organization_id', orgId)
    .in('status', ['confirmed', 'in_progress'])
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)

  const trip = trips?.[0] as Trip | undefined

  if (!trip) {
    return (
      <WidgetCard title="Next site visit">
        <WidgetEmpty message="No site visits scheduled." />
      </WidgetCard>
    )
  }

  const { data: segments } = await supabase
    .from('trip_segments')
    .select('*')
    .eq('trip_id', trip.id)
    .order('sort_order', { ascending: true })
    .limit(3)

  const segs = (segments || []) as TripSegment[]
  const days = daysUntil(trip.start_date)

  return (
    <WidgetCard
      title="Next site visit"
      subtitle={formatRange(trip.start_date, trip.end_date)}
      trailing={
        days !== null && days > 0 ? (
          <span className="text-xs text-emerald-400 font-medium">In {days} day{days !== 1 ? 's' : ''}</span>
        ) : days === 0 ? (
          <span className="text-xs text-emerald-400 font-medium">Today</span>
        ) : null
      }
    >
      <p className="text-base text-white font-medium mb-3">{trip.title}</p>
      {segs.length === 0 ? (
        <p className="text-xs text-[#6E7578]">Itinerary not yet built.</p>
      ) : (
        <ul className="space-y-1.5 m-0 p-0 list-none">
          {segs.map(s => (
            <li key={s.id} className="text-sm text-gray-300 flex items-center gap-2">
              <span className="rp-eyebrow--muted w-16">{s.segment_type.replace('_', ' ')}</span>
              <span className="flex-1 truncate">
                {s.from_location && s.to_location
                  ? `${s.from_location} → ${s.to_location}`
                  : s.from_location || s.to_location || ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
