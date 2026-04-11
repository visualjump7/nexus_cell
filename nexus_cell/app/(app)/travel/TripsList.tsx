'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Trip, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  planning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

interface Props { trips: Trip[]; role: UserRole }

export default function TripsList({ trips, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null)

  const filtered = trips.filter(t => statusFilter === 'all' || t.status === statusFilter)

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleDelete() {
    if (!deletingTrip) return
    await fetch(`/api/trips/${deletingTrip.id}`, { method: 'DELETE' })
    setDeletingTrip(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Travel</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingTrip(null); setShowForm(true) }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Trip
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No trips found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(trip => (
            <Link key={trip.id} href={`/travel/${trip.id}`} className="bg-card rounded-xl shadow-lg shadow-black/20 p-5 hover:brightness-110 transition-colors block">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-medium">{trip.title}</h3>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[trip.status] || ''}`}>
                  {trip.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>{formatDate(trip.start_date)} → {formatDate(trip.end_date)}</p>
                {trip.notes && <p className="truncate">{trip.notes}</p>}
              </div>
              {canWrite && (
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-3">
                  <button onClick={e => { e.preventDefault(); setEditingTrip(trip); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                  <button onClick={e => { e.preventDefault(); setDeletingTrip(trip) }} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Trip Form Modal */}
      {showForm && <TripFormModal trip={editingTrip} onClose={() => { setShowForm(false); setEditingTrip(null) }} inputClass={inputClass} />}
      {deletingTrip && <DeleteConfirm itemName={deletingTrip.title} onConfirm={handleDelete} onCancel={() => setDeletingTrip(null)} />}
    </div>
  )
}

function TripFormModal({ trip, onClose, inputClass }: { trip: Trip | null; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!trip
  const [form, setForm] = useState({
    title: trip?.title || '',
    start_date: trip?.start_date || '',
    end_date: trip?.end_date || '',
    status: trip?.status || 'planning',
    notes: trip?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null, notes: form.notes || null }
    const url = isEditing ? `/api/trips/${trip.id}` : '/api/trips'
    const method = isEditing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

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
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Trip' : 'New Trip'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Miami Weekend" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input className={inputClass} type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input className={inputClass} type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
