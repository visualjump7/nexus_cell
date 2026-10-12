'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { pushEscapeLayer } from '@/components/rp'

// The Roaring Pines build program's package types, offered after the ones the
// team already uses.
const SUGGESTED_TYPES = [
  'Infrastructure',
  'Track & Circuit',
  'Track Safety & Systems',
  'Clubhouse & Amenities',
  'Garages',
  'Residences',
  'Sitework & Earthwork',
  'Landscape & Signage',
  'Land & Entitlements',
  'Environmental',
  'Professional Services',
  'Finance & Risk',
  'Sales & Marketing',
  'Club Operations',
]

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  id?: string
}

// Combobox for project_type. Loads existing types from /api/projects/types
// (most-used first) and lets the user filter as they type. Whatever is in
// the input on submit becomes the type — "create new" is implicit, no
// separate flow needed.
export default function ProjectTypeCombobox({
  value,
  onChange,
  className,
  placeholder = 'Garages, Track & Circuit, Clubhouse & Amenities…',
  id,
}: Props) {
  const [types, setTypes] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const listId = `${id ?? autoId}-types`

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects/types')
      .then(r => r.json())
      .then(data => { if (!cancelled) setTypes((data?.types as string[]) || []) })
      .catch(() => null)
    return () => { cancelled = true }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Esc closes the list first, not the modal around it.
  useEffect(() => {
    if (!open) return
    return pushEscapeLayer(() => setOpen(false))
  }, [open])

  // Existing types first (most-used), then the build-program defaults.
  const inUse = new Set(types.map(t => t.toLowerCase()))
  const allTypes = [
    ...types,
    ...SUGGESTED_TYPES.filter(d => !inUse.has(d.toLowerCase())),
  ]

  const lower = value.trim().toLowerCase()
  const filtered = lower
    ? allTypes.filter(t => t.toLowerCase().includes(lower))
    : allTypes

  const showCreateOption = !!lower && !allTypes.some(t => t.toLowerCase() === lower)
  const optionCount = filtered.length + (showCreateOption ? 1 : 0)
  const listOpen = open && optionCount > 0

  function choose(i: number) {
    if (i < filtered.length) onChange(filtered[i])
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(a => (optionCount ? (a + 1) % optionCount : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive(a => (optionCount ? (a <= 0 ? optionCount - 1 : a - 1) : -1))
    } else if (e.key === 'Enter' && listOpen && active >= 0) {
      e.preventDefault()
      choose(active)
    }
  }

  const optionId = (i: number) => `${listId}-${i}`

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={listOpen && active >= 0 ? optionId(active) : undefined}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn('rp-input', className)}
        autoComplete="off"
      />

      {listOpen && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Package types"
          className="absolute left-0 right-0 top-full z-20 mt-px max-h-64 overflow-auto border border-rp-line2 bg-rp-bg"
        >
          {filtered.map((t, i) => (
            <li
              key={t}
              id={optionId(i)}
              role="option"
              aria-selected={i === active || t === value}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(i)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-2.5 text-[15px] text-rp-text transition-colors',
                i === active && 'bg-rp-surface',
              )}
            >
              <span className="min-w-0 truncate">{t}</span>
              <span className="shrink-0 font-display text-[11px] uppercase tracking-[.14em] text-rp-dim">
                {inUse.has(t.toLowerCase()) ? 'In use' : 'Suggested'}
              </span>
            </li>
          ))}
          {showCreateOption && (
            <li
              id={optionId(filtered.length)}
              role="option"
              aria-selected={active === filtered.length}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(filtered.length)}
              onMouseEnter={() => setActive(filtered.length)}
              className={cn(
                'cursor-pointer border-t border-rp-line px-3.5 py-2.5 font-display text-xs uppercase tracking-[.14em] text-rp-gold transition-colors',
                active === filtered.length && 'bg-rp-surface',
              )}
            >
              Create &ldquo;{value.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
