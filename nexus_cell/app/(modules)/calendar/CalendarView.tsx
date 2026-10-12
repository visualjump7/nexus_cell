'use client'

import { useEffect, useState } from 'react'
import { FiscalCalendar } from '@/components/calendar/FiscalCalendar'
import { fetchBillsForMonth, fetchBillCategories, type Bill } from '@/lib/bill-service'
import type { ExternalCalendar, ExternalCalendarEvent } from '@/lib/types'
import {
  RpPage, RpPageHeader, RpSubhead, RpGroup, RpGroupHead, RpList, RpRow, RpBox, RpCheck,
  RpStatus, RpButton, RpEmpty, RpLoading, fmtDate, fmtTime, dot,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

type CalendarWithVis = ExternalCalendar & { visible: boolean }

interface Props {
  calendars: CalendarWithVis[]
  events: ExternalCalendarEvent[]
}

function formatEventTime(ev: ExternalCalendarEvent): string {
  if (ev.all_day) return 'All day'
  const start = fmtTime(ev.start_at)
  const end = ev.end_at ? fmtTime(ev.end_at) : ''
  return end ? `${start}–${end}` : start
}

/** Local calendar-date key (YYYY-MM-DD) for a Date. */
function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 8px calendar-colour square (status markers are square, never round). */
function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="inline-block h-2 w-2 shrink-0" style={{ background: color }} />
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
    return calendars.find(c => c.id === calendarId)?.color || '#9AA0A4'
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

  const todayKey = localKey(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = localKey(tomorrow)

  const emptyLine =
    calendars.length === 0
      ? 'No calendars subscribed yet. An administrator adds them under Admin · Calendars.'
      : visibleIds.size === 0
        ? 'No calendars visible. Turn one on under Calendars.'
        : 'Nothing on these calendars in the next two weeks.'

  const visibleCount = calendars.filter(c => c.visible).length

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('calendar')}
        title="Meetings, inspections and track days"
        line="The next two weeks, then the month's cash outflow."
      />

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        {/* Agenda — next 14 days */}
        <section className="flex min-w-0 flex-col gap-5" aria-labelledby="cal-next">
          <RpSubhead
            flush
            size="md"
            title={<span id="cal-next">Next 14 days</span>}
            spec={dot(
              `${upcoming.length} ${upcoming.length === 1 ? 'event' : 'events'}`,
              `${sortedDates.length} ${sortedDates.length === 1 ? 'day' : 'days'}`,
            )}
          />
          {upcoming.length === 0 ? (
            <RpEmpty compact title="Nothing scheduled in the next two weeks." line={emptyLine} />
          ) : (
            <div className="flex flex-col">
              {sortedDates.map(date => (
                <RpGroup key={date}>
                  <RpGroupHead
                    num={Number(date.slice(8, 10))}
                    title={fmtDate(date, 'weekday')}
                    line={date === todayKey ? 'Today' : date === tomorrowKey ? 'Tomorrow' : undefined}
                    aside={<span className="rp-counter">{`${groupedByDate[date].length} ${groupedByDate[date].length === 1 ? 'event' : 'events'}`}</span>}
                  />
                  <RpList>
                    {groupedByDate[date].map(ev => (
                      <RpRow
                        key={ev.id}
                        lead={<Swatch color={colorFor(ev.external_calendar_id)} />}
                        title={ev.title || 'Untitled'}
                        meta={<span suppressHydrationWarning>{dot(formatEventTime(ev), nameFor(ev.external_calendar_id), ev.location)}</span>}
                      />
                    ))}
                  </RpList>
                </RpGroup>
              ))}
            </div>
          )}
        </section>

        {/* Calendars — per-user visibility */}
        <aside className="min-w-0">
          <RpBox pad="md" className="flex flex-col gap-4 xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="rp-eyebrow--muted">Calendars</h2>
              <RpButton variant="text" size="sm" arrow href="/admin/calendars">Manage</RpButton>
            </div>
            {calendars.length === 0 ? (
              <p className="text-sm leading-normal text-rp-muted">
                No calendars subscribed yet. An administrator can add one under Admin · Calendars.
              </p>
            ) : (
              <>
                <ul className="m-0 flex list-none flex-col border-t border-rp-line p-0">
                  {calendars.map(c => {
                    const sync = c.last_sync_error ? 'error' : c.last_synced_at ? 'ok' : 'never'
                    return (
                      <li key={c.id} className="flex min-h-[44px] items-center gap-3 border-b border-rp-line py-2" title={c.last_sync_error ?? undefined}>
                        <RpCheck
                          className="min-w-0 flex-1"
                          checked={c.visible}
                          onChange={v => toggle(c.id, v)}
                          label={
                            <span className="flex min-w-0 items-center gap-2.5">
                              <Swatch color={c.color} />
                              <span className="truncate text-[15px] text-rp-text">{c.name}</span>
                            </span>
                          }
                        />
                        <RpStatus kind="sync" value={sync} />
                      </li>
                    )
                  })}
                </ul>
                <p className="text-[13px] text-rp-dim">{dot(`${visibleCount} of ${calendars.length} shown`, 'Your view only')}</p>
              </>
            )}
          </RpBox>
        </aside>
      </div>

      {/* Bill calendar (existing) */}
      <section className="flex min-w-0 flex-col gap-5">
        <RpSubhead title="Cash outflow" spec="Bills due this month, by day" />
        {billsLoading ? (
          <RpLoading label="Loading bills" />
        ) : (
          <FiscalCalendar initialBills={bills} categories={billCategories} eyebrow={false} />
        )}
      </section>
    </RpPage>
  )
}
