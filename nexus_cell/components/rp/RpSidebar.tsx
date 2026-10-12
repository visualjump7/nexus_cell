'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { RpNavItem } from './types'
import { activeNavIndex } from './nav'

export interface RpBrand { badge: string; name: string; sub: string }

const DEFAULT_BRAND: RpBrand = { badge: BRAND.badgeAlt, name: BRAND.name, sub: BRAND.subName }

export interface RpSidebarProps {
  items: RpNavItem[]
  /** Bottom block (presenter / signed-in user), above a rule. */
  footer?: React.ReactNode
  /** Brand link target (default '/'). */
  homeHref?: string
  brand?: Partial<RpBrand>
  ariaLabel?: string
  className?: string
}

/**
 * The concept sidebar (≥1024px): polished-steel badge, ROARING PINES / MOTOR CLUB,
 * numbered 40px nav rows; the current row (longest href/match prefix) gets a
 * 2px gold edge, surface fill and gold number. Hidden below 1024px — pair with RpTopBar.
 */
export function RpSidebar({ items, footer, homeHref = '/', brand, ariaLabel = 'Sections', className }: RpSidebarProps) {
  const pathname = usePathname()
  const active = activeNavIndex(items, pathname)
  const b = { ...DEFAULT_BRAND, ...brand }
  return (
    <aside className={cn('rp-sidebar', className)}>
      <Link href={homeHref} className="rp-brand">
        <img src={b.badge} alt="" aria-hidden />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="rp-brand-name">{b.name}</span>
          <span className="rp-brand-sub">{b.sub}</span>
        </span>
      </Link>
      <nav aria-label={ariaLabel}>
        <ul className="rp-nav">
          {items.map((it, i) => (
            <li key={it.href + it.label}>
              <Link href={it.href} className="rp-nav-item" aria-current={i === active ? 'page' : undefined}>
                <span className="rp-nav-num">{it.num}</span>
                <span className="rp-nav-label">{it.label}</span>
                {it.badge ? <span className="rp-nav-badge" aria-label={`${it.badge} open`}>{it.badge}</span> : null}
                {!it.badge && it.flag ? <span className="rp-nav-flag">{it.flag}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {footer && <div className="rp-sidebar-foot">{footer}</div>}
    </aside>
  )
}

export interface RpTopBarProps {
  items: RpNavItem[]
  /** Extra content at the right (before the hamburger trigger space). */
  right?: React.ReactNode
  brand?: Partial<RpBrand>
  homeHref?: string
  className?: string
}

/** 56px top bar below 1024px: badge, name and the current section eyebrow. Leaves 64px at the right for the hamburger trigger. */
export function RpTopBar({ items, right, brand, homeHref = '/', className }: RpTopBarProps) {
  const pathname = usePathname()
  const active = activeNavIndex(items, pathname)
  const cur = active >= 0 ? items[active] : undefined
  const b = { ...DEFAULT_BRAND, ...brand }
  return (
    <div className={cn('rp-topbar', className)}>
      <Link href={homeHref} className="flex min-w-0 items-center gap-3">
        <img src={b.badge} alt="" aria-hidden className="h-auto w-8 shrink-0" />
        {/* Both lines, as on the concept's mobile header: ROARING PINES / MOTOR CLUB. */}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-display text-sm font-medium uppercase leading-none tracking-[.12em] text-rp-text">{b.name}</span>
          <span className="truncate font-display text-[10px] uppercase leading-none tracking-[.22em] text-rp-muted">{b.sub}</span>
        </span>
      </Link>
      <span className="ml-auto flex min-w-0 items-center gap-3">
        {cur && (
          <span className="truncate font-display text-[11px] uppercase tracking-[.16em] text-rp-gold max-[399px]:hidden">
            {cur.num} · {cur.label}
          </span>
        )}
        {right}
      </span>
    </div>
  )
}
