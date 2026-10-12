import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import {
  RpFigure, RpList, RpRow, RpStatus, fmtRange, daysUntil, dot,
  Plane, BedDouble, Car, TrainFront, MapPin,
} from '@/components/rp'
import { tripImage } from '@/lib/project-imagery'
import type { Trip, TripSegment } from '@/lib/types'

interface Props {
  orgId: string
}

const SEGMENT_ICON: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: BedDouble,
  car: Car,
  ground_transport: Car,
  train: TrainFront,
}

const SEGMENT_LABEL: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  car: 'Car',
  ground_transport: 'Ground',
  train: 'Train',
  other: 'Other',
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
  const days = trip.start_date ? daysUntil(trip.start_date) : NaN
  const countdown = days === 0 ? 'Today' : days > 0 ? `In ${days} day${days !== 1 ? 's' : ''}` : null
  const img = tripImage(trip)

  return (
    <WidgetCard
      title="Next site visit"
      subtitle={fmtRange(trip.start_date, trip.end_date)}
      trailing={<RpStatus kind="trip" value={trip.status} />}
    >
      <RpFigure
        {...img}
        aspect="aerial"
        caption={trip.title}
        qualifier={img.caption}
        overlay={
          countdown ? (
            <span className="font-display text-[40px] font-medium uppercase leading-none tracking-[.01em] text-rp-text">
              {countdown}
            </span>
          ) : undefined
        }
      />
      {segs.length === 0 ? (
        <p className="text-[13px] text-rp-dim">Itinerary not yet built.</p>
      ) : (
        <RpList as="ul">
          {segs.map(s => {
            const Icon = SEGMENT_ICON[s.segment_type] ?? MapPin
            const route = s.from_location && s.to_location
              ? `${s.from_location} → ${s.to_location}`
              : s.from_location || s.to_location || SEGMENT_LABEL[s.segment_type] || 'Segment'
            return (
              <RpRow
                key={s.id}
                as="li"
                lead={<Icon size={16} strokeWidth={1.5} className="mt-0.5 text-rp-muted" aria-hidden />}
                title={route}
                meta={dot(SEGMENT_LABEL[s.segment_type] ?? s.segment_type.replace('_', ' '), s.carrier)}
              />
            )
          })}
        </RpList>
      )}
    </WidgetCard>
  )
}
