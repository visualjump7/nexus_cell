'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface RpTabItem {
  id: string
  label: string
  /** Dim count after the label (gold when pressed). */
  count?: number
  /** Index before the label, e.g. '01'. */
  num?: string
  disabled?: boolean
}

interface SegProps {
  items: RpTabItem[]
  value: string
  onSelect: (id: string) => void
  size?: 'md' | 'sm'
  ariaLabel: string
  scroll?: boolean
  className?: string
}

function Seg({ items, value, onSelect, size = 'md', ariaLabel, scroll, className }: SegProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('rp-seg', size === 'sm' && 'rp-seg--sm', scroll && 'rp-seg--scroll', className)}>
      {items.map(it => (
        <button
          key={it.id}
          type="button"
          className="rp-seg-btn"
          aria-pressed={it.id === value}
          disabled={it.disabled}
          onClick={() => { if (it.id !== value) onSelect(it.id) }}
        >
          {it.num && <span className="rp-seg-num">{it.num}</span>}
          <span>{it.label}</span>
          {it.count != null && <span className="rp-seg-count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

export interface RpTabsProps {
  items: RpTabItem[]
  value: string
  onChange: (id: string) => void
  size?: 'md' | 'sm'
  ariaLabel: string
  /** Keep one row and scroll sideways instead of wrapping. */
  scroll?: boolean
  className?: string
}

/** Segmented outlined tabs (aria-pressed). Active: gold border + 14% wash. Controlled. */
export function RpTabs({ items, value, onChange, size, ariaLabel, scroll, className }: RpTabsProps) {
  return <Seg items={items} value={value} onSelect={onChange} size={size} ariaLabel={ariaLabel} scroll={scroll} className={className} />
}

export interface RpUrlTabsProps {
  items: RpTabItem[]
  /** Search param that holds the active id, e.g. 'view'. */
  param: string
  /** Id used when the param is absent. Selecting it removes the param. */
  defaultId: string
  size?: 'md' | 'sm'
  ariaLabel: string
  /** router.replace (default) or router.push. */
  mode?: 'replace' | 'push'
  /** Other params to drop when the tab changes (e.g. ['page']). */
  clear?: string[]
  /** Update the URL through the native History API instead of the router: no
   *  server round trip. For client-only state, e.g. which loop plays. */
  shallow?: boolean
  scroll?: boolean
  className?: string
}

function UrlTabsInner({ items, param, defaultId, size, ariaLabel, mode = 'replace', clear, shallow, scroll, className }: RpUrlTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params?.get(param) ?? defaultId
  const value = items.some(i => i.id === current) ? current : defaultId

  function select(id: string) {
    const next = new URLSearchParams(params?.toString() ?? '')
    if (id === defaultId) next.delete(param)
    else next.set(param, id)
    clear?.forEach(k => next.delete(k))
    const qs = next.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    // Next (14.1+) syncs usePathname/useSearchParams with pushState/replaceState.
    if (shallow) window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url)
    else router[mode](url, { scroll: false })
  }

  return <Seg items={items} value={value} onSelect={select} size={size} ariaLabel={ariaLabel} scroll={scroll} className={className} />
}

/** Segmented tabs bound to ?param=. Wraps itself in Suspense (static fallback shows the default tab). */
export function RpUrlTabs(props: RpUrlTabsProps) {
  const fallback = (
    <Seg
      items={props.items}
      value={props.defaultId}
      onSelect={() => {}}
      size={props.size}
      ariaLabel={props.ariaLabel}
      scroll={props.scroll}
      className={props.className}
    />
  )
  return (
    <Suspense fallback={fallback}>
      <UrlTabsInner {...props} />
    </Suspense>
  )
}
