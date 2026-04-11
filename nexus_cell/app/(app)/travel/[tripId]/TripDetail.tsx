'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Trip, TripSegment, TravelDoc, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const segmentIcons: Record<string, string> = {
  flight: '✈️', hotel: '🏨', car: '🚗', train: '🚆', ground_transport: '🚐', other: '📍',
}

const statusColors: Record<string, string> = {
  planning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

interface Props { trip: Trip; segments: TripSegment[]; docs: TravelDoc[]; role: UserRole }

export default function TripDetail({ trip, segments, docs, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showSegForm, setShowSegForm] = useState(false)
  const [deletingSeg, setDeletingSeg] = useState<TripSegment | null>(null)

  function formatDT(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleDeleteSeg() {
    if (!deletingSeg) return
    await fetch(`/api/trips/${trip.id}/segments/${deletingSeg.id}`, { method: 'DELETE' })
    setDeletingSeg(null)
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/travel" className="text-sm text-gray-500 hover:text-white transition-colors mb-2 inline-block">← Back to Travel</Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[trip.status] || ''}`}>
            {trip.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{formatDate(trip.start_date)} → {formatDate(trip.end_date)}</p>
        {trip.notes && <p className="text-sm text-gray-400 mt-2">{trip.notes}</p>}
      </div>

      {/* Timeline / Segments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Itinerary</h2>
          {canWrite && (
            <button onClick={() => setShowSegForm(true)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors">
              + Add Segment
            </button>
          )}
        </div>

        {segments.length === 0 ? (
          <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-8 text-center">
            <p className="text-gray-500">No segments yet. Add flights, hotels, or ground transport.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map(seg => (
              <div key={seg.id} className="bg-card rounded-xl shadow-lg shadow-black/20 p-4 flex items-start gap-4">
                <div className="text-2xl mt-0.5">{segmentIcons[seg.segment_type] || '📍'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 uppercase font-medium">{seg.segment_type.replace('_', ' ')}</span>
                    {seg.carrier && <span className="text-xs text-gray-600">· {seg.carrier}</span>}
                    {seg.confirmation_code && <span className="text-xs text-emerald-500 font-mono">{seg.confirmation_code}</span>}
                  </div>
                  <p className="text-white font-medium">
                    {seg.from_location || '—'} → {seg.to_location || '—'}
                  </p>
                  <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                    {seg.depart_at && <p>Depart: {formatDT(seg.depart_at)}</p>}
                    {seg.arrive_at && <p>Arrive: {formatDT(seg.arrive_at)}</p>}
                    {seg.check_in && <p>Check-in: {formatDT(seg.check_in)}</p>}
                    {seg.check_out && <p>Check-out: {formatDT(seg.check_out)}</p>}
                    {seg.seat_info && <p>Seat: {seg.seat_info}</p>}
                    {seg.notes && <p className="text-gray-600">{seg.notes}</p>}
                  </div>
                </div>
                {canWrite && (
                  <button onClick={() => setDeletingSeg(seg)} className="text-gray-600 hover:text-red-400 text-xs transition-colors shrink-0">Delete</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Travel Docs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Travel Documents</h2>
        {docs.length === 0 ? (
          <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-8 text-center">
            <p className="text-gray-500">No documents attached.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map(doc => (
              <div key={doc.id} className="bg-card rounded-xl shadow-lg shadow-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{doc.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.doc_type.replace('_', ' ')}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-xs hover:underline">View</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment Form Modal */}
      {showSegForm && <SegmentFormModal tripId={trip.id} onClose={() => setShowSegForm(false)} inputClass={inputClass} />}
      {deletingSeg && <DeleteConfirm itemName={`${deletingSeg.segment_type} segment`} onConfirm={handleDeleteSeg} onCancel={() => setDeletingSeg(null)} />}
    </div>
  )
}

function SegmentFormModal({ tripId, onClose, inputClass }: { tripId: string; onClose: () => void; inputClass: string }) {
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

  const labelClass = 'block text-sm text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Add Segment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={form.segment_type} onChange={e => setForm(p => ({ ...p, segment_type: e.target.value }))}>
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
              <option value="car">Car</option>
              <option value="train">Train</option>
              <option value="ground_transport">Ground Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{isHotel ? 'Location' : 'From'}</label>
              <input className={inputClass} value={form.from_location} onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} placeholder={isHotel ? 'e.g. Miami Beach' : 'e.g. KTEB'} />
            </div>
            {!isHotel && (
              <div>
                <label className={labelClass}>To</label>
                <input className={inputClass} value={form.to_location} onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} placeholder="e.g. KOPF" />
              </div>
            )}
          </div>
          {isHotel ? (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Check-in</label><input className={inputClass} type="datetime-local" value={form.check_in} onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))} /></div>
              <div><label className={labelClass}>Check-out</label><input className={inputClass} type="datetime-local" value={form.check_out} onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Depart</label><input className={inputClass} type="datetime-local" value={form.depart_at} onChange={e => setForm(p => ({ ...p, depart_at: e.target.value }))} /></div>
              <div><label className={labelClass}>Arrive</label><input className={inputClass} type="datetime-local" value={form.arrive_at} onChange={e => setForm(p => ({ ...p, arrive_at: e.target.value }))} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Carrier / Provider</label><input className={inputClass} value={form.carrier} onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))} placeholder="e.g. NetJets" /></div>
            <div><label className={labelClass}>Confirmation Code</label><input className={inputClass} value={form.confirmation_code} onChange={e => setForm(p => ({ ...p, confirmation_code: e.target.value }))} /></div>
          </div>
          <div><label className={labelClass}>Seat / Room Info</label><input className={inputClass} value={form.seat_info} onChange={e => setForm(p => ({ ...p, seat_info: e.target.value }))} /></div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : 'Add Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
