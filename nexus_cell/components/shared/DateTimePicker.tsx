'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  value: string
  onChange: (val: string) => void
  label: string
  mode?: 'datetime' | 'date'
  className?: string
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DateTimePicker({ value, onChange, label, mode = 'datetime', className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Parse existing value
  const parsed = value ? new Date(value) : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() || new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed)
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 9)
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function buildValue(date: Date, h: number, m: number): string {
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    if (mode === 'date') return `${y}-${mo}-${d}`
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${y}-${mo}-${d}T${hh}:${mm}`
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    setSelectedDate(d)
    onChange(buildValue(d, hour, minute))
    if (mode === 'date') setOpen(false)
  }

  function updateTime(h: number, m: number) {
    setHour(h)
    setMinute(m)
    if (selectedDate) onChange(buildValue(selectedDate, h, m))
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = new Date()
  const isToday = (day: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  const isSelected = (day: number) => selectedDate && viewYear === selectedDate.getFullYear() && viewMonth === selectedDate.getMonth() && day === selectedDate.getDate()

  // Display value
  const displayVal = value
    ? (mode === 'date'
      ? new Date(value + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))
    : ''

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <label className="rp-label">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rp-input flex items-center justify-between gap-3 text-left"
      >
        <span className={displayVal ? 'text-rp-text' : 'text-rp-dim'}>{displayVal || 'Select…'}</span>
        <CalendarDays size={16} strokeWidth={1.5} className="shrink-0 text-rp-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-1 w-[296px] max-w-[calc(100vw-32px)] border border-rp-line2 bg-rp-bg p-4"
        >
          {/* Month / year */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={prevMonth} className="rp-btn-icon rp-btn--sm" aria-label="Previous month">
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <span className="font-display text-[13px] uppercase tracking-[.14em] text-rp-text">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="rp-btn-icon rp-btn--sm" aria-label="Next month">
              <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 pb-1.5">
            {DAYS.map(d => (
              <div key={d} className="text-center font-display text-[11px] uppercase tracking-[.16em] text-rp-dim">{d}</div>
            ))}
          </div>

          {/* Ruled day grid */}
          <div className="rp-ruled grid-cols-7">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} aria-hidden />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const selected = !!isSelected(day)
              const today = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={selected}
                  aria-current={today ? 'date' : undefined}
                  className={`flex h-9 items-center justify-center font-display text-xs tabular-nums transition-colors ${
                    selected
                      ? '!bg-[rgba(205,161,75,.14)] text-rp-text shadow-[inset_0_0_0_1px_#CDA14B]'
                      : today
                        ? 'text-rp-gold hover:!bg-rp-surface'
                        : 'text-rp-muted hover:!bg-rp-surface hover:text-rp-text'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time */}
          {mode === 'datetime' && (
            <div className="mt-3 border-t border-rp-line pt-3">
              <div className="flex items-center justify-center gap-2">
                <select
                  value={hour}
                  onChange={e => updateTime(parseInt(e.target.value), minute)}
                  aria-label="Hour"
                  className="rp-select !min-h-[38px] !w-20 tabular-nums"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="font-display text-rp-dim">:</span>
                <select
                  value={minute}
                  onChange={e => updateTime(hour, parseInt(e.target.value))}
                  aria-label="Minute"
                  className="rp-select !min-h-[38px] !w-20 tabular-nums"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rp-btn-ghost rp-btn--sm mt-3 w-full"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
