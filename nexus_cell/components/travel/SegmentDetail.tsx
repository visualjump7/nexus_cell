'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TripSegment } from '@/lib/types'
import { segmentColors } from '@/lib/travel-constants'
import { getSegmentIcon } from '@/components/travel/SegmentIcons'

const segmentLabels: Record<string, string> = {
  flight: 'Flight Details',
  hotel: 'Hotel Details',
  car: 'Car Rental Details',
  train: 'Train Details',
  ground_transport: 'Ground Transport Details',
  other: 'Segment Details',
}

interface Props {
  segment: TripSegment
  canWrite: boolean
  onClose: () => void
}

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm text-white text-right ml-4 ${mono ? 'font-mono text-[#5eead4]' : ''}`}>{value}</span>
    </div>
  )
}

export default function SegmentDetail({ segment: initialSegment, canWrite, onClose }: Props) {
  const router = useRouter()
  const seg = initialSegment
  const color = segmentColors[seg.segment_type] || '#94a3b8'

  const [notes, setNotes] = useState(seg.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function formatDT(d: string | null) {
    if (!d) return null
    return new Date(d).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md max-h-[85vh] overflow-y-auto border border-white/5" onClick={e => e.stopPropagation()}>

        {/* Header with color accent */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-gray-400">{getSegmentIcon(seg.segment_type)}</div>
              <div>
                <h2 className="text-base font-semibold text-white">{segmentLabels[seg.segment_type]}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{seg.carrier || seg.segment_type.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white text-xl transition-colors">&times;</button>
          </div>
        </div>

        {/* Route / Location hero */}
        <div className="px-6 pb-4">
          <div className="bg-white/[0.03] rounded-xl p-4">
            {seg.segment_type === 'hotel' ? (
              <div className="text-center">
                <p className="text-lg font-medium text-white">{seg.from_location || '—'}</p>
                {seg.check_in && seg.check_out && (
                  <p className="text-xs text-gray-500 mt-1">
                    {duration(seg.check_in, seg.check_out) ? `${Math.ceil((new Date(seg.check_out).getTime() - new Date(seg.check_in).getTime()) / 86400000)} nights` : ''}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-white">{seg.from_location?.split('(')[1]?.replace(')', '') || seg.from_location?.split(',')[0] || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{seg.from_location || ''}</p>
                </div>
                <div className="mx-3 flex flex-col items-center">
                  <div className="w-16 h-px" style={{ background: color }} />
                  {duration(seg.depart_at, seg.arrive_at) && (
                    <p className="text-[10px] mt-1" style={{ color }}>{duration(seg.depart_at, seg.arrive_at)}</p>
                  )}
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-white">{seg.to_location?.split('(')[1]?.replace(')', '') || seg.to_location?.split(',')[0] || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{seg.to_location || ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div className="px-6 pb-4">
          <div className="bg-white/[0.03] rounded-xl px-4">
            {/* Time details */}
            {seg.segment_type === 'hotel' ? (
              <>
                <DetailRow label="Check-in" value={formatDT(seg.check_in)} />
                <DetailRow label="Check-out" value={formatDT(seg.check_out)} />
              </>
            ) : (
              <>
                <DetailRow label="Departure" value={formatDT(seg.depart_at)} />
                <DetailRow label="Arrival" value={formatDT(seg.arrive_at)} />
              </>
            )}

            {/* Booking details */}
            <DetailRow label="Carrier" value={seg.carrier} />
            <DetailRow label="Confirmation" value={seg.confirmation_code} mono />
            <DetailRow label="Booking Ref" value={seg.booking_reference} mono />
            <DetailRow label={seg.segment_type === 'hotel' ? 'Room' : 'Seat'} value={seg.seat_info} />
          </div>
        </div>

        {/* Notes section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Notes</p>
            {saved && <span className="text-[10px] text-emerald-400">Saved</span>}
            {saving && <span className="text-[10px] text-gray-500">Saving...</span>}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            readOnly={!canWrite}
            placeholder={canWrite ? 'Add notes — meeting details, special requests, reminders...' : 'No notes'}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-[#5eead4]/30 min-h-[80px]"
            rows={3}
          />
          {canWrite && notes !== (seg.notes || '') && (
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 px-4 py-1.5 bg-[#5eead4]/15 text-[#5eead4] text-xs font-medium rounded-lg hover:bg-[#5eead4]/25 transition-colors disabled:opacity-50"
            >
              Save Notes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
