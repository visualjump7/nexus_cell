'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Alert, Trip, TripSegment, UserRole } from '@/lib/types'
import {
  RpGroup, RpGroupHead, RpList, RpRow, RpButton, RpFigure, RpEmpty, RpStatus, RpTag,
  Plane, BedDouble, Car, TrainFront, MapPin, RP_ICON,
  timeAgo, fmtRange, fmtDate, dot,
} from '@/components/rp'
import { tripImage } from '@/lib/project-imagery'

interface Props {
  approvals: Alert[]
  nextTrip: { trip: Trip; segments: TripSegment[] } | null
  role: UserRole
  /** Section number for "Waiting on you"; "Next site visit" takes the next one. */
  num?: number
}

const SEGMENT_ICON: Record<TripSegment['segment_type'], typeof Plane> = {
  flight: Plane,
  hotel: BedDouble,
  car: Car,
  train: TrainFront,
  ground_transport: Car,
  other: MapPin,
}

const SEGMENT_LABEL: Record<TripSegment['segment_type'], string> = {
  flight: 'Flight',
  hotel: 'Stay',
  car: 'Car',
  train: 'Train',
  ground_transport: 'Ground',
  other: 'Leg',
}

// Date only, read from the ISO string itself so the server render and the
// browser agree (local clock times would differ between time zones).
function segmentWhen(seg: TripSegment) {
  const at = seg.depart_at || seg.check_in
  if (!at) return null
  return fmtDate(at.slice(0, 10), 'short')
}

export default function DashboardUpcoming({ approvals, nextTrip, role, num }: Props) {
  const router = useRouter()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const canApprove = ['principal', 'ea', 'admin'].includes(role)

  async function handleApproval(alertId: string, decision: 'approved' | 'rejected') {
    setApprovingId(alertId)
    await fetch(`/api/alerts/${alertId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    setApprovingId(null)
    router.refresh()
  }

  const decide = (id: string) => (
    <>
      <RpButton size="sm" onClick={() => handleApproval(id, 'approved')} disabled={approvingId === id}>
        Approve
      </RpButton>
      <RpButton variant="danger" size="sm" onClick={() => handleApproval(id, 'rejected')} disabled={approvingId === id}>
        Reject
      </RpButton>
    </>
  )

  const trip = nextTrip?.trip
  const segments = nextTrip?.segments ?? []
  // Route from the travel legs (stays are not legs): 'Teterboro → Palatka'.
  const legs = segments.filter(s => s.segment_type !== 'hotel')
  const route = legs.length > 0
    ? [legs[0].from_location, legs[legs.length - 1].to_location].filter(Boolean).join(' → ')
    : ''
  const img = trip ? tripImage(trip) : null

  return (
    <RpGroup>
      <RpGroupHead
        num={num}
        title="Waiting on you"
        tag={approvals.length > 0 ? <RpTag tone="gold">{approvals.length} to sign</RpTag> : undefined}
        aside={approvals.length > 0 ? <RpButton variant="text" arrow href="/alerts">All alerts</RpButton> : undefined}
      />

      {/* Pending approvals */}
      {approvals.length > 0 ? (
        <RpList>
          {approvals.map((alert, i) => (
            <RpRow
              key={alert.id}
              index={i + 1}
              edge="gold"
              title={alert.title}
              meta={canApprove ? (
                <>
                  <span suppressHydrationWarning>{dot('Sign-off', timeAgo(alert.created_at))}</span>
                  {/* Phones: the decision buttons sit under the title instead of squeezing it. */}
                  <span className="mt-3 flex gap-2 sm:hidden">{decide(alert.id)}</span>
                </>
              ) : <span suppressHydrationWarning>{dot('Sign-off', timeAgo(alert.created_at))}</span>}
              aside={canApprove ? (
                <div className="hidden shrink-0 gap-2 sm:flex">{decide(alert.id)}</div>
              ) : (
                <RpStatus kind="alertType" value={alert.alert_type} />
              )}
            />
          ))}
        </RpList>
      ) : (
        <RpEmpty compact pines={false} title="Nothing to sign." line="Approvals land here when the team needs a decision." />
      )}

      {/* Next site visit */}
      <div className="mt-4 flex flex-col gap-4">
        <RpGroupHead
          num={num != null ? num + 1 : undefined}
          title="Next site visit"
          className="border-t border-rp-line pt-5"
          aside={trip ? <RpButton variant="text" arrow href="/travel">All travel</RpButton> : undefined}
        />

        {trip && img ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,220px)_1fr]">
            <RpFigure
              {...img}
              aspect="aerial"
              caption={undefined}
              qualifier={undefined}
              href={`/travel/${trip.id}`}
              alt={trip.title}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <RpStatus kind="trip" value={trip.status} />
              </div>
              <Link
                href={`/travel/${trip.id}`}
                className="font-display text-lg uppercase leading-tight tracking-[.02em] text-rp-text transition-colors hover:text-rp-gold"
              >
                {trip.title}
              </Link>
              <p className="text-[13px] text-rp-muted">
                {dot(route, fmtRange(trip.start_date, trip.end_date))}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-rp-muted">No site visits scheduled.</p>
        )}

        {trip && segments.length > 0 && (
          <RpList>
            {segments.slice(0, 3).map(seg => {
              const Icon = SEGMENT_ICON[seg.segment_type] || MapPin
              return (
                <RpRow
                  key={seg.id}
                  lead={<Icon size={RP_ICON.size} strokeWidth={RP_ICON.strokeWidth} className="mt-0.5 text-rp-muted" aria-hidden />}
                  title={seg.segment_type === 'hotel'
                    ? (seg.to_location || seg.from_location || 'Stay')
                    : `${seg.from_location || '—'} → ${seg.to_location || '—'}`}
                  meta={dot(SEGMENT_LABEL[seg.segment_type] || 'Leg', seg.carrier, segmentWhen(seg))}
                />
              )
            })}
          </RpList>
        )}
      </div>
    </RpGroup>
  )
}
