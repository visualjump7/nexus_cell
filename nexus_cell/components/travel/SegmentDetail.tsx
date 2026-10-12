'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TripSegment } from '@/lib/types'
import { segmentColors } from '@/lib/travel-constants'
import { getSegmentIcon, segmentLabel } from '@/components/travel/SegmentIcons'
import { RpModal, RpKV, RpField, RpTextarea, RpButton, fmtDate, fmtTime, dot } from '@/components/rp'
import type { RpKVItem } from '@/components/rp'

// 2px top edge of the dialog in the segment colour (literal classes so Tailwind emits them).
const EDGE: Record<string, string> = {
  flight: 'border-t-2 border-t-[#3989CB]',
  hotel: 'border-t-2 border-t-[#CDA14B]',
  car: 'border-t-2 border-t-[#A4CC5C]',
  ground_transport: 'border-t-2 border-t-[#A4CC5C]',
  train: 'border-t-2 border-t-[#7FB3DE]',
  other: 'border-t-2 border-t-[#9AA0A4]',
}

interface Props {
  segment: TripSegment
  canWrite: boolean
  onClose: () => void
}

/** 'Jacksonville Intl (JAX)' → 'JAX'; 'Roaring Pines HQ, Jacksonville' → 'Roaring Pines HQ'. */
function shortPlace(s: string | null): string {
  if (!s) return '—'
  return s.split('(')[1]?.replace(')', '') || s.split(',')[0]
}

function formatDT(d: string | null) {
  if (!d) return null
  return dot(fmtDate(d, 'weekday'), fmtTime(d))
}

function duration(from: string | null, to: string | null) {
  if (!from || !to) return null
  const diff = new Date(to).getTime() - new Date(from).getTime()
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`
  if (hrs > 0) return `${hrs}h`
  return `${mins}m`
}

export default function SegmentDetail({ segment: initialSegment, canWrite, onClose }: Props) {
  const router = useRouter()
  const seg = initialSegment
  const color = segmentColors[seg.segment_type] || '#9AA0A4'
  const isHotel = seg.segment_type === 'hotel'

  const [notes, setNotes] = useState(seg.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveNotes = useCallback(async () => {
    setSaving(true)
    await fetch(`/api/trips/${seg.trip_id}/segments/${seg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }, [seg.trip_id, seg.id, notes, router])

  const nights = isHotel && seg.check_in && seg.check_out && duration(seg.check_in, seg.check_out)
    ? Math.ceil((new Date(seg.check_out).getTime() - new Date(seg.check_in).getTime()) / 86400000)
    : null
  const legTime = duration(seg.depart_at, seg.arrive_at)

  const kv: RpKVItem[] = ([
    isHotel
      ? { label: 'Check-in', value: formatDT(seg.check_in) }
      : { label: 'Depart', value: formatDT(seg.depart_at) },
    isHotel
      ? { label: 'Check-out', value: formatDT(seg.check_out) }
      : { label: 'Arrive', value: formatDT(seg.arrive_at) },
    { label: 'Carrier', value: seg.carrier },
    { label: 'Confirmation', value: seg.confirmation_code, num: true },
    { label: 'Booking ref', value: seg.booking_reference, num: true },
    { label: isHotel ? 'Room' : 'Seat', value: seg.seat_info },
  ] as { label: string; value: string | null; num?: boolean }[])
    .filter(i => !!i.value)
    .map(i => ({ label: i.label, value: i.value as string, num: i.num }))

  const title = isHotel ? (seg.from_location || 'Hotel') : `${shortPlace(seg.from_location)} → ${shortPlace(seg.to_location)}`

  return (
    <RpModal
      open
      onClose={onClose}
      size="sm"
      eyebrow={segmentLabel(seg.segment_type)}
      title={title}
      className={EDGE[seg.segment_type] || EDGE.other}
    >
      {/* Route / stay plate */}
      <div className="rp-inset px-5 py-4">
        {isHotel ? (
          <div className="flex items-center gap-3">
            <span style={{ color }}>{getSegmentIcon(seg.segment_type, 20)}</span>
            <div className="min-w-0">
              <p className="text-[15px] leading-snug text-rp-text">{seg.from_location || '—'}</p>
              {nights != null && (
                <p className="mt-0.5 font-display text-[11px] uppercase tracking-[.16em] text-rp-muted">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[26px] font-medium uppercase leading-none tracking-[.02em] text-rp-text">{shortPlace(seg.from_location)}</p>
              <p className="mt-1.5 truncate text-[12px] text-rp-dim">{seg.from_location || ''}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <span style={{ color }}>{getSegmentIcon(seg.segment_type)}</span>
              <span aria-hidden className="h-px w-14" style={{ background: color }} />
              {legTime && <span className="font-display text-[11px] tracking-[.12em] tabular-nums text-rp-muted">{legTime}</span>}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="font-display text-[26px] font-medium uppercase leading-none tracking-[.02em] text-rp-text">{shortPlace(seg.to_location)}</p>
              <p className="mt-1.5 truncate text-[12px] text-rp-dim">{seg.to_location || ''}</p>
            </div>
          </div>
        )}
      </div>

      {kv.length > 0 && <RpKV items={kv} />}

      {/* Notes */}
      <RpField
        label="Notes"
        htmlFor={`seg-notes-${seg.id}`}
        hint={saving ? 'Saving…' : saved ? 'Saved' : undefined}
      >
        <RpTextarea
          id={`seg-notes-${seg.id}`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          readOnly={!canWrite}
          placeholder={canWrite ? 'Meeting details, special requests, reminders' : 'No notes'}
          rows={3}
        />
      </RpField>
      {canWrite && notes !== (seg.notes || '') && (
        <div className="-mt-2">
          <RpButton variant="ghost" size="sm" onClick={saveNotes} disabled={saving}>Save notes</RpButton>
        </div>
      )}
    </RpModal>
  )
}
