'use client'

import { useState, useRef, useEffect } from 'react'

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
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-left text-sm focus:outline-none focus:border-[#5eead4] transition-colors flex items-center justify-between"
      >
        <span className={displayVal ? 'text-white' : 'text-[#475569]'}>{displayVal || 'Select...'}</span>
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl shadow-black/50 p-4 w-[280px]">
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="text-gray-500 hover:text-white p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <span className="text-sm font-medium text-white">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="text-gray-500 hover:text-white p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${
                    isSelected(day)
                      ? 'bg-[#5eead4] text-[#08090f] font-bold'
                      : isToday(day)
                        ? 'text-[#5eead4] font-medium hover:bg-white/10'
                        : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time picker */}
          {mode === 'datetime' && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-center gap-2">
                <select
                  value={hour}
                  onChange={e => updateTime(parseInt(e.target.value), minute)}
                  className="bg-[#141520] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#5eead4] appearance-none text-center w-16"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-gray-500 font-bold">:</span>
                <select
                  value={minute}
                  onChange={e => updateTime(hour, parseInt(e.target.value))}
                  className="bg-[#141520] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#5eead4] appearance-none text-center w-16"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full mt-3 py-1.5 bg-[#5eead4]/15 text-[#5eead4] text-xs font-medium rounded-lg hover:bg-[#5eead4]/25 transition-colors"
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
