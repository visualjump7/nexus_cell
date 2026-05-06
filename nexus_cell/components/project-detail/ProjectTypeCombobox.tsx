'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

// Combobox for project_type. Loads existing types from /api/projects/types
// (most-used first) and lets the user filter as they type. Whatever is in
// the input on submit becomes the type — "create new" is implicit, no
// separate flow needed.
export default function ProjectTypeCombobox({
  value,
  onChange,
  className = '',
  placeholder = 'e.g. Property, Travel plan, Event…',
}: Props) {
  const [types, setTypes] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

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

  const lower = value.trim().toLowerCase()
  const filtered = lower
    ? types.filter(t => t.toLowerCase().includes(lower))
    : types

  const showCreateOption = !!lower && !types.some(t => t.toLowerCase() === lower)

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {open && (filtered.length > 0 || showCreateOption) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#10131b] border border-white/10 rounded-lg shadow-xl shadow-black/40 z-20 max-h-56 overflow-y-auto">
          {filtered.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/[0.04] transition-colors"
            >
              {t}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/[0.06] transition-colors border-t border-white/5"
            >
              + Create &ldquo;{value.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
