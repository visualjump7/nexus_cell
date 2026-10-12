'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface RpSectionNavItem { id: string; label: string; num?: string }

export interface RpSectionNavProps {
  items: RpSectionNavItem[]
  /** Sticks to the top of the main column (under the 56px top bar below 1024px). */
  sticky?: boolean
  ariaLabel?: string
  className?: string
}

// A section counts as current once its top passes this line (px from the top).
const SPY_LINE = 140

/** In-page anchors as small segmented links, with scroll-spy (aria-current). Targets are elements with the item ids (e.g. RpSubhead id). */
export function RpSectionNav({ items, sticky, ariaLabel = 'On this page', className }: RpSectionNavProps) {
  const [current, setCurrent] = useState<string | null>(items[0]?.id ?? null)
  const key = items.map(i => i.id).join('|')

  useEffect(() => {
    let frame = 0
    function spy() {
      frame = 0
      let cur: string | null = items[0]?.id ?? null
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (el && el.getBoundingClientRect().top <= SPY_LINE) cur = it.id
      }
      // At the very bottom of the page the last section wins.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && items.length) {
        const last = items[items.length - 1]
        if (document.getElementById(last.id)) cur = last.id
      }
      setCurrent(cur)
    }
    function onScroll() { if (!frame) frame = window.requestAnimationFrame(spy) }
    spy()
    // Capture phase so scrolling inside an overlay's own scroller also counts.
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        sticky && 'sticky top-0 z-10 border-b border-rp-line bg-rp-bg py-3 max-lg:top-14',
        className,
      )}
    >
      <div className="rp-seg rp-seg--sm rp-seg--scroll">
        {items.map(it => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className="rp-seg-btn"
            aria-current={current === it.id ? 'true' : undefined}
          >
            {it.num && <span className="rp-seg-num">{it.num}</span>}
            <span>{it.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
