'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { FiscalCalendar } from '@/components/calendar/FiscalCalendar'
import { fetchBillsForMonth, fetchBillCategories, type Bill } from '@/lib/bill-service'
import type { ExternalCalendar, ExternalCalendarEvent } from '@/lib/types'

type CalendarWithVis = ExternalCalendar & { visible: boolean }

interface Props {
  calendars: CalendarWithVis[]
  events: ExternalCalendarEvent[]
}

function formatEventTime(ev: ExternalCalendarEvent): string {
  if (ev.all_day) return 'All day'
  const d = new Date(ev.start_at)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const evDay = new Date(d)
  evDay.setHours(0, 0, 0, 0)
  if (evDay.getTime() === today.getTime()) return 'Today'
  if (evDay.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CalendarView({ calendars: initialCalendars, events }: Props) {
  // Bills (existing flow — fetched client-side via bill-service)
  const [bills, setBills] = useState<Bill[]>([])
  const [billCategories, setBillCategories] = useState<string[]>([])
  const [billsLoading, setBillsLoading] = useState(true)

  // External calendars + per-user toggles. Optimistic updates persisted via
  // PATCH /api/external-calendars/[id]/preference.
  const [calendars, setCalendars] = useState(initialCalendars)

  useEffect(() => {
    async function loadBills() {
      setBillsLoading(true)
      const now = new Date()
      const [b, cats] = await Promise.all([
        fetchBillsForMonth(now.getFullYear(), now.getMonth() + 1),
        fetchBillCategories(),
      ])
      setBills(b)
      setBillCategories(cats)
      setBillsLoading(false)
    }
    loadBills()
  }, [])

  function colorFor(calendarId: string): string {
    return calendars.find(c => c.id === calendarId)?.color || '#94a3b8'
  }

  function nameFor(calendarId: string): string {
    return calendars.find(c => c.id === calendarId)?.name || 'Calendar'
  }

  async function toggle(calendarId: string, next: boolean) {
    // Optimistic update
    setCalendars(prev => prev.map(c => c.id === calendarId ? { ...c, visible: next } : c))
    try {
      await fetch(`/api/external-calendars/${calendarId}/preference`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: next }),
      })
    } catch {
      // Revert on failure
      setCalendars(prev => prev.map(c => c.id === calendarId ? { ...c, visible: !next } : c))
    }
  }

  const visibleIds = new Set(calendars.filter(c => c.visible).map(c => c.id))
  const visibleEvents = events.filter(ev => visibleIds.has(ev.external_calendar_id))

  // Group upcoming events by date (next 14 days from today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 14)
  const upcoming = visibleEvents.filter(ev => {
    const d = new Date(ev.start_at)
    return d >= today && d < cutoff
  })

  const groupedByDate = upcoming.reduce<Record<string, ExternalCalendarEvent[]>>((acc, ev) => {
    const dateKey = new Date(ev.start_at).toISOString().split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(ev)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedByDate).sort()

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bills, plus any external calendars your team has subscribed to.
        </p>
      </div>

      {/* External calendars panel */}
      <section className="bg-card-dark rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">External calendars</h2>
          <Link href="/admin/calendars" className="text-xs text-emerald-400 hover:underline">
            Manage →
          </Link>
        </div>

        {calendars.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No external calendars subscribed yet. An admin can add one in <Link href="/admin/calendars" className="text-emerald-400 hover:underline">Admin → Calendars</Link>.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 m-0 p-0 list-none mb-5">
              {calendars.map(c => (
                <li key={c.id}>
                  <label className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#141520] border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <input
                      type="checkbox"
                      checked={c.visible}
                      onChange={e => toggle(c.id, e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="flex-1 text-sm text-white truncate">{c.name}</span>
                    {c.last_sync_error && (
                      <span className="text-[10px] text-red-400" title={c.last_sync_error}>error</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>

            {/* Upcoming events from visible calendars */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Next 14 days</p>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  {visibleIds.size === 0
                    ? 'No calendars visible. Toggle one on above.'
                    : 'Nothing on these calendars in the next two weeks.'}
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {sortedDates.map(date => (
                    <div key={date}>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
                        {formatEventDate(date + 'T00:00:00')}
                      </p>
                      <ul className="space-y-1 m-0 p-0 list-none">
                        {groupedByDate[date].map(ev => (
                          <li key={ev.id} className="flex items-start gap-2.5 py-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                              style={{ background: colorFor(ev.external_calendar_id) }}
                              aria-hidden
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white leading-tight">{ev.title || '(untitled)'}</p>
                              <p className="text-[11px] text-gray-500">
                                {formatEventTime(ev)} · {nameFor(ev.external_calendar_id)}
                                {ev.location && <> · {ev.location}</>}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Bill calendar (existing) */}
      <section>
        <h2 className="text-sm font-medium text-white mb-3">Bills</h2>
        {billsLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <FiscalCalendar initialBills={bills} categories={billCategories} />
        )}
      </section>
    </div>
  )
}
