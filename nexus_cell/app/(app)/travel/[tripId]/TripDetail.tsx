'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Trip, TripSegment, TravelDoc, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import TripMap from '@/components/travel/TripMap'
import DateTimePicker from '@/components/shared/DateTimePicker'
import SegmentDetail from '@/components/travel/SegmentDetail'
import { getSegmentIcon, segmentLabel, tripParts, tripHero, ROW_STACK_SM } from '@/components/travel/SegmentIcons'
import { segmentColors } from '@/lib/travel-constants'
import {
  RpPage, RpPageHeader, RpSubhead, RpList, RpRow, RpCardGrid, RpFigure, RpTag, RpStatus, RpButton,
  RpEmpty, RpModal, RpField, RpInput, RpSelect, RpTextarea, RpFormGrid,
  Plus, RP_ICON, fmtDate, fmtTime, fmtRange, dot,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

interface Props { trip: Trip; segments: TripSegment[]; docs: TravelDoc[]; role: UserRole }

function tripDates(t: Trip): string | null {
  if (t.start_date && t.end_date) return fmtRange(t.start_date, t.end_date)
  if (t.start_date) return fmtDate(t.start_date)
  return null
}

/** '12 Oct 09:30 → 11:05' (or the stay dates for hotels). */
function segmentWhen(seg: TripSegment): string | null {
  if (seg.segment_type === 'hotel') {
    if (seg.check_in && seg.check_out) return `${fmtDate(seg.check_in, 'short')} → ${fmtDate(seg.check_out, 'short')}`
    if (seg.check_in) return `From ${fmtDate(seg.check_in, 'short')}`
    return null
  }
  if (!seg.depart_at && !seg.arrive_at) return null
  const dep = seg.depart_at ? `${fmtDate(seg.depart_at, 'short')} ${fmtTime(seg.depart_at)}`.trim() : '—'
  const arr = seg.arrive_at ? fmtTime(seg.arrive_at) || fmtDate(seg.arrive_at, 'short') : '—'
  return `${dep} → ${arr}`
}

function segmentTitle(seg: TripSegment): string {
  if (seg.segment_type === 'hotel' || !seg.to_location) return seg.from_location || segmentLabel(seg.segment_type)
  return `${seg.from_location || '—'} → ${seg.to_location}`
}

export default function TripDetail({ trip, segments, docs, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showSegForm, setShowSegForm] = useState(false)
  const [deletingSeg, setDeletingSeg] = useState<TripSegment | null>(null)
  const [selectedSegId, setSelectedSegId] = useState<string | null>(null)
  const [detailSeg, setDetailSeg] = useState<TripSegment | null>(null)

  async function handleDeleteSeg() {
    if (!deletingSeg) return
    await fetch(`/api/trips/${trip.id}/segments/${deletingSeg.id}`, { method: 'DELETE' })
    setDeletingSeg(null)
    router.refresh()
  }

  const { purpose, route } = tripParts(trip.title)
  const hero = tripHero(trip)

  return (
    <>
      {/* Any click outside the itinerary clears the map selection (as before). */}
      <div className="contents" onClick={() => setSelectedSegId(null)}>
        <RpPage>
          <RpPageHeader
            back={{ href: '/travel', label: 'Travel' }}
            eyebrow={sectionEyebrow('travel')}
            tags={<RpStatus kind="trip" value={trip.status} />}
            title={purpose}
            spec={dot(route, tripDates(trip))}
            line={trip.notes}
          />

          {/* Map — or the trip's image when there is no token / no coordinates */}
          <TripMap
            segments={segments}
            selectedSegmentId={selectedSegId}
            onSegmentSelect={setSelectedSegId}
            fallback={
              <RpFigure
                {...hero}
                aspect="wide"
                frameClassName="max-h-[460px]"
                lightbox={false}
                zoom={false}
                num={1}
                qualifier="Representative view"
                overlay={<RpTag tone="gold">Map unavailable · itinerary below</RpTag>}
              />
            }
          />

          {/* Itinerary */}
          <section className="flex flex-col gap-5">
            <RpSubhead
              title="Itinerary"
              spec={dot(
                `${segments.length} ${segments.length === 1 ? 'segment' : 'segments'}`,
                `${docs.length} ${docs.length === 1 ? 'document' : 'documents'}`,
              )}
              aside={canWrite && (
                <RpButton
                  variant="ghost"
                  icon={<Plus {...RP_ICON} />}
                  onClick={e => { e.stopPropagation(); setShowSegForm(true) }}
                >
                  Segment
                </RpButton>
              )}
            />

            {segments.length === 0 ? (
              <RpEmpty compact title="No segments yet." line="Add flights, hotels and ground transport." />
            ) : (
              <div onClick={e => e.stopPropagation()}>
                <RpList>
                  {segments.map((seg, i) => {
                    const color = segmentColors[seg.segment_type] || '#9AA0A4'
                    return (
                      <RpRow
                        key={seg.id}
                        index={i + 1}
                        lead={<span className="inline-flex" style={{ color }}>{getSegmentIcon(seg.segment_type)}</span>}
                        title={segmentTitle(seg)}
                        titleStyle="display"
                        meta={
                          <>
                            <span className="block" suppressHydrationWarning>{dot(segmentLabel(seg.segment_type), seg.carrier, segmentWhen(seg), seg.seat_info)}</span>
                            {seg.notes && <span className="mt-0.5 line-clamp-2 block text-rp-dim">{seg.notes}</span>}
                          </>
                        }
                        aside={seg.confirmation_code ? (
                          <span className="whitespace-nowrap text-[13px] tabular-nums text-rp-text">
                            <span className="text-rp-dim">Conf. </span>{seg.confirmation_code}
                          </span>
                        ) : undefined}
                        className={ROW_STACK_SM}
                        selected={selectedSegId === seg.id}
                        onClick={() => setSelectedSegId(prev => prev === seg.id ? null : seg.id)}
                        actions={
                          <>
                            <RpButton variant="ghost" size="sm" onClick={() => setDetailSeg(seg)}>Details</RpButton>
                            {canWrite && (
                              <RpButton variant="text" size="sm" onClick={() => setDeletingSeg(seg)}>Delete</RpButton>
                            )}
                          </>
                        }
                      />
                    )
                  })}
                </RpList>
              </div>
            )}
          </section>

          {/* Travel documents */}
          <section className="flex flex-col gap-5">
            <RpSubhead title="Travel documents" spec={docs.length ? `${docs.length} on file` : undefined} />
            {docs.length === 0 ? (
              <RpEmpty compact title="No documents attached." line="Reservations, boarding passes and contracts appear here." />
            ) : (
              <RpCardGrid min={280} max={2}>
                {docs.map((doc, i) => (
                  <article key={doc.id} className="flex min-w-0 flex-col gap-2.5 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-xs tracking-[.1em] tabular-nums text-rp-gold">{String(i + 1).padStart(2, '0')}</span>
                      <RpTag>{doc.doc_type.replace(/_/g, ' ')}</RpTag>
                    </div>
                    <h3 className="font-display text-lg uppercase leading-[1.2] tracking-[.02em] text-rp-text">{doc.label}</h3>
                    <p className="text-[13px] text-rp-muted">
                      {dot(doc.document_number, doc.expiry_date && `Expires ${fmtDate(doc.expiry_date)}`) || 'No reference on file'}
                    </p>
                    {doc.notes && <p className="line-clamp-2 text-[13px] text-rp-dim">{doc.notes}</p>}
                    {doc.file_url && (
                      <div className="mt-auto pt-1">
                        <RpButton variant="text" size="sm" arrow href={doc.file_url} target="_blank" rel="noopener noreferrer">Open</RpButton>
                      </div>
                    )}
                  </article>
                ))}
              </RpCardGrid>
            )}
          </section>
        </RpPage>
      </div>

      {/* Modals */}
      {detailSeg && <SegmentDetail segment={detailSeg} canWrite={canWrite} onClose={() => setDetailSeg(null)} />}
      {showSegForm && <SegmentFormModal tripId={trip.id} onClose={() => setShowSegForm(false)} />}
      {deletingSeg && <DeleteConfirm itemName={`${segmentLabel(deletingSeg.segment_type).toLowerCase()} segment`} onConfirm={handleDeleteSeg} onCancel={() => setDeletingSeg(null)} />}
    </>
  )
}

function SegmentFormModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    segment_type: 'flight',
    from_location: '',
    to_location: '',
    depart_at: '',
    arrive_at: '',
    check_in: '',
    check_out: '',
    carrier: '',
    confirmation_code: '',
    seat_info: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isHotel = form.segment_type === 'hotel'

  // Derive sort_order from the primary datetime so segments auto-sort chronologically
  function getSortTimestamp(): number {
    const primary = isHotel ? form.check_in : form.depart_at
    if (!primary) return Date.now()
    return new Date(primary).getTime()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/trips/${tripId}/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        from_location: form.from_location || null,
        to_location: form.to_location || null,
        depart_at: form.depart_at || null,
        arrive_at: form.arrive_at || null,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        carrier: form.carrier || null,
        confirmation_code: form.confirmation_code || null,
        seat_info: form.seat_info || null,
        notes: form.notes || null,
        sort_order: getSortTimestamp(),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={sectionEyebrow('travel', 'Itinerary')}
      title="Add segment"
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="segment-form" disabled={saving}>{saving ? 'Saving…' : 'Add segment'}</RpButton>
        </>
      }
    >
      <form id="segment-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Type" htmlFor="seg-type" className="sm:col-span-2">
            <RpSelect id="seg-type" value={form.segment_type} onChange={e => setForm(p => ({ ...p, segment_type: e.target.value }))}>
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
              <option value="car">Car</option>
              <option value="train">Train</option>
              <option value="ground_transport">Ground transport</option>
              <option value="other">Other</option>
            </RpSelect>
          </RpField>
          <RpField label={isHotel ? 'Location' : 'From'} htmlFor="seg-from" className={isHotel ? 'sm:col-span-2' : undefined}>
            <RpInput id="seg-from" value={form.from_location} onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} placeholder={isHotel ? 'e.g. Inn on the Lakes, Sebring' : 'e.g. Jacksonville Intl (JAX)'} />
          </RpField>
          {!isHotel && (
            <RpField label="To" htmlFor="seg-to">
              <RpInput id="seg-to" value={form.to_location} onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} placeholder="e.g. Palatka–Kay Larkin (28J)" />
            </RpField>
          )}
          {isHotel ? (
            <>
              <DateTimePicker label="Check-in" value={form.check_in} onChange={v => setForm(p => ({ ...p, check_in: v }))} />
              <DateTimePicker label="Check-out" value={form.check_out} onChange={v => setForm(p => ({ ...p, check_out: v }))} />
            </>
          ) : (
            <>
              <DateTimePicker label="Depart" value={form.depart_at} onChange={v => setForm(p => ({ ...p, depart_at: v }))} />
              <DateTimePicker label="Arrive" value={form.arrive_at} onChange={v => setForm(p => ({ ...p, arrive_at: v }))} />
            </>
          )}
          <RpField label="Carrier / provider" htmlFor="seg-carrier">
            <RpInput id="seg-carrier" value={form.carrier} onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))} placeholder="e.g. Jet Linx" />
          </RpField>
          <RpField label="Confirmation code" htmlFor="seg-conf">
            <RpInput id="seg-conf" value={form.confirmation_code} onChange={e => setForm(p => ({ ...p, confirmation_code: e.target.value }))} />
          </RpField>
          <RpField label="Seat / room" htmlFor="seg-seat" className="sm:col-span-2">
            <RpInput id="seg-seat" value={form.seat_info} onChange={e => setForm(p => ({ ...p, seat_info: e.target.value }))} />
          </RpField>
          <RpField label="Notes" htmlFor="seg-notes" className="sm:col-span-2">
            <RpTextarea id="seg-notes" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error mt-4" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
