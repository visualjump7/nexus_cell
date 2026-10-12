'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Trip, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import { tripParts, tripHero } from '@/components/travel/SegmentIcons'
import { TRIP_IMAGE_POOL, toRpImage } from '@/lib/project-imagery'
import type { RpImage } from '@/components/rp'
import {
  RpPage, RpPageHeader, RpTabs, RpGroup, RpGroupHead, RpCardGrid, RpFigure, RpCapNum, RpStatus,
  RpButton, RpEmpty, RpModal, RpField, RpInput, RpSelect, RpTextarea, RpFormGrid,
  Plus, RP_ICON, fmtDate, fmtRange, dot, statusLabel,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

const STATUS_ORDER: Trip['status'][] = ['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']

interface Props { trips: Trip[]; role: UserRole }

/** UTC calendar-date string, the comparison the rest of the app uses. */
function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function tripDates(t: Trip): string {
  if (t.start_date && t.end_date) return fmtRange(t.start_date, t.end_date)
  if (t.start_date) return fmtDate(t.start_date)
  if (t.end_date) return `Until ${fmtDate(t.end_date)}`
  return 'Dates to be set'
}

/**
 * Card images for one group, in display order: each trip's own match, unless an
 * earlier card in the group already shows it, then the next unused picture
 * from the trip pool, so no two cards in a group repeat while the pool lasts.
 */
function heroesFor(items: Trip[]): Map<string, RpImage> {
  const out = new Map<string, RpImage>()
  const used = new Set<string>()
  for (const t of items) {
    let hero = tripHero(t)
    if (used.has(hero.src)) {
      const alt = TRIP_IMAGE_POOL.find(src => !used.has(src))
      if (alt) hero = toRpImage(alt)
    }
    used.add(hero.src)
    out.set(t.id, hero)
  }
  return out
}

export default function TripsList({ trips, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null)

  const filtered = trips.filter(t => statusFilter === 'all' || t.status === statusFilter)

  const today = todayIso()
  const isUpcoming = (t: Trip) =>
    t.status === 'in_progress' ||
    t.status === 'confirmed' ||
    (t.status === 'planning' && (!t.start_date || t.start_date.slice(0, 10) >= today))

  const startKey = (t: Trip) => t.start_date ?? '9999-12-31'
  const upcoming = filtered.filter(isUpcoming).sort((a, b) => (startKey(a) < startKey(b) ? -1 : startKey(a) > startKey(b) ? 1 : 0))
  const past = filtered.filter(t => !isUpcoming(t))

  const underwayCount = trips.filter(t => t.status === 'in_progress').length
  const next = trips
    .filter(t => (t.status === 'confirmed' || t.status === 'planning') && !!t.start_date && t.start_date.slice(0, 10) >= today)
    .sort((a, b) => (startKey(a) < startKey(b) ? -1 : 1))[0]
  const nextParts = next ? tripParts(next.title) : null

  async function handleDelete() {
    if (!deletingTrip) return
    await fetch(`/api/trips/${deletingTrip.id}`, { method: 'DELETE' })
    setDeletingTrip(null)
    router.refresh()
  }

  function openNew() { setEditingTrip(null); setShowForm(true) }

  const statusTabs = [
    { id: 'all', label: 'All', count: trips.length },
    ...STATUS_ORDER.map(s => ({ id: s, label: statusLabel('trip', s), count: trips.filter(t => t.status === s).length })),
  ]

  function renderCard(trip: Trip, n: number, hero: RpImage) {
    const { purpose, route } = tripParts(trip.title)
    const href = `/travel/${trip.id}`
    return (
      <article key={trip.id} className="flex min-w-0 flex-col gap-3">
        <RpFigure
          {...hero}
          aspect="card"
          caption={undefined}
          qualifier={undefined}
          href={href}
          lightbox={false}
        />
        <div className="flex items-baseline gap-3">
          <RpCapNum n={n} className="text-[13px]" />
          <h3 className="min-w-0 font-display text-xl uppercase leading-[1.15] tracking-[.03em] text-rp-text">
            <Link href={href} className="transition-colors hover:text-rp-gold">{purpose}</Link>
          </h3>
        </div>
        {route && <p className="-mt-1.5 text-[13px] text-rp-muted">{route}</p>}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="font-display text-[12px] uppercase tracking-[.12em] tabular-nums text-rp-text">{tripDates(trip)}</span>
          <RpStatus kind="trip" value={trip.status} />
        </div>
        {trip.notes && <p className="line-clamp-2 text-sm leading-normal text-rp-muted">{trip.notes}</p>}
        {canWrite && (
          <div className="flex items-center gap-4 border-t border-rp-line pt-3">
            <RpButton variant="text" size="sm" onClick={() => { setEditingTrip(trip); setShowForm(true) }}>Edit</RpButton>
            <RpButton variant="text" size="sm" onClick={() => setDeletingTrip(trip)}>Delete</RpButton>
          </div>
        )}
      </article>
    )
  }

  const groups = [
    { id: 'upcoming', title: 'Underway and upcoming', items: upcoming },
    { id: 'past', title: 'Past', items: past },
  ].filter(g => g.items.length > 0)

  let running = 0

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('travel')}
        title="Site visits and trips"
        line={dot(
          `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`,
          `${underwayCount} underway`,
          next && nextParts ? `next: ${nextParts.route ?? nextParts.purpose}, ${fmtDate(next.start_date, 'short')}` : null,
        )}
        actions={canWrite && (
          <RpButton icon={<Plus {...RP_ICON} />} onClick={openNew}>New trip</RpButton>
        )}
      />

      <RpTabs ariaLabel="Trip status" items={statusTabs} value={statusFilter} onChange={setStatusFilter} />

      {filtered.length === 0 ? (
        <RpEmpty
          title="No trips planned."
          line={trips.length > 0 ? 'No trips with this status.' : 'Site visits, draws and recruiting trips land here.'}
          action={canWrite && trips.length === 0 ? <RpButton variant="ghost" icon={<Plus {...RP_ICON} />} onClick={openNew}>New trip</RpButton> : undefined}
        />
      ) : (
        <div className="flex flex-col">
          {groups.map((g, gi) => {
            const heroes = heroesFor(g.items)
            return (
              <RpGroup key={g.id}>
                <RpGroupHead
                  num={gi + 1}
                  title={g.title}
                  aside={<span className="rp-counter">{`${g.items.length} ${g.items.length === 1 ? 'trip' : 'trips'}`}</span>}
                />
                <RpCardGrid ruled={false} min={300} max={3}>
                  {g.items.map(trip => {
                    running += 1
                    return renderCard(trip, running, heroes.get(trip.id) ?? tripHero(trip))
                  })}
                </RpCardGrid>
              </RpGroup>
            )
          })}
        </div>
      )}

      {showForm && <TripFormModal trip={editingTrip} onClose={() => { setShowForm(false); setEditingTrip(null) }} />}
      {deletingTrip && <DeleteConfirm itemName={deletingTrip.title} onConfirm={handleDelete} onCancel={() => setDeletingTrip(null)} />}
    </RpPage>
  )
}

function TripFormModal({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={sectionEyebrow('travel', isEditing ? 'Edit' : 'New')}
      title={isEditing ? 'Edit trip' : 'New trip'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="trip-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Create trip'}
          </RpButton>
        </>
      }
    >
      <form id="trip-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Title" htmlFor="trip-title" required hint="Route — purpose, e.g. Jacksonville to Palatka — Site walk with the GC" className="sm:col-span-2">
            <RpInput id="trip-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Site walk with the GC" required />
          </RpField>
          <RpField label="Start date" htmlFor="trip-start">
            <RpInput id="trip-start" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </RpField>
          <RpField label="End date" htmlFor="trip-end">
            <RpInput id="trip-end" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </RpField>
          <RpField label="Status" htmlFor="trip-status" className="sm:col-span-2">
            <RpSelect id="trip-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">Underway</option>
              <option value="completed">Complete</option>
              <option value="cancelled">Cancelled</option>
            </RpSelect>
          </RpField>
          <RpField label="Notes" htmlFor="trip-notes" className="sm:col-span-2">
            <RpTextarea id="trip-notes" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error mt-4" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
