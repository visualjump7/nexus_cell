import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RpTabItem } from './RpTabs'

export interface RpTabLinksProps {
  items: (RpTabItem & { href: string })[]
  activeId: string
  size?: 'md' | 'sm'
  ariaLabel: string
  scroll?: boolean
  className?: string
}

/** Segmented tabs as real links (aria-current="page" on the active one). Server-safe. */
export function RpTabLinks({ items, activeId, size = 'md', ariaLabel, scroll, className }: RpTabLinksProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('rp-seg', size === 'sm' && 'rp-seg--sm', scroll && 'rp-seg--scroll', className)}>
      {items.map(it => (
        <Link key={it.id} href={it.href} className="rp-seg-btn" aria-current={it.id === activeId ? 'page' : undefined}>
          {it.num && <span className="rp-seg-num">{it.num}</span>}
          <span>{it.label}</span>
          {it.count != null && <span className="rp-seg-count">{it.count}</span>}
        </Link>
      ))}
    </nav>
  )
}
