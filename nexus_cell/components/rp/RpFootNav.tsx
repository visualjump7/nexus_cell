'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { RpNavItem } from './types'
import { activeNavIndex } from './nav'
import { RpCounter } from './RpText'

/** Footer pager: '← Prev | 03 / 11 | Next →'. Hidden inside overlays (data-rp-footnav). */
export function RpFootNav({ items, className }: { items: RpNavItem[]; className?: string }) {
  const pathname = usePathname()
  const i = activeNavIndex(items, pathname)
  if (i < 0) return null
  const prev = i > 0 ? items[i - 1] : undefined
  const next = i < items.length - 1 ? items[i + 1] : undefined
  return (
    <nav data-rp-footnav aria-label="Previous and next section" className={cn('rp-footnav', className)}>
      {prev ? (
        <Link href={prev.href} className="rp-btn-back"><span aria-hidden>←</span> {prev.label}</Link>
      ) : <span />}
      <RpCounter current={i + 1} total={items.length} />
      {next ? (
        <Link href={next.href} className="rp-btn-text">{next.label} <span aria-hidden>→</span></Link>
      ) : <span />}
    </nav>
  )
}
