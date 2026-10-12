'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RpSidebar, RpTopBar, RpButton, RpTabLinks, activeNavIndex, type RpNavItem } from '@/components/rp'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { useSignOut } from '@/components/shared/HamburgerMenu'

// The administrator's own section index, numbered like the main nav.
const ADMIN_NAV: RpNavItem[] = [
  { num: '01', label: 'Overview', href: '/admin' },
  { num: '02', label: 'Members', href: '/admin/users' },
  { num: '03', label: 'Owners', href: '/admin/principals' },
  { num: '04', label: 'Owner views', href: '/admin/executive-views' },
  { num: '05', label: 'Calendars', href: '/admin/calendars' },
]

const ADMIN_BRAND = { sub: 'Administrator' }

const FOOT_LINK = 'font-display text-[11px] uppercase tracking-[.14em] text-rp-muted transition-colors duration-200 hover:text-rp-text disabled:opacity-50'

/** Admin sidebar (≥1024px): the concept sidebar with the admin index, a way back to the build, Settings and Sign out. */
export default function AdminSidebar() {
  const pathname = usePathname() || '/admin'
  const { signOut, signingOut } = useSignOut()
  const onSettings = pathname === '/settings' || pathname.startsWith('/settings/')

  return (
    <RpSidebar
      items={ADMIN_NAV}
      homeHref="/admin"
      brand={ADMIN_BRAND}
      ariaLabel="Administrator"
      footer={
        <>
          <RpButton variant="text" size="sm" href="/" className="self-start">
            <span aria-hidden>←</span> Back to the build
          </RpButton>
          <span className="mt-4 text-[10px] uppercase tracking-[.2em] text-rp-muted">Development</span>
          <span className="font-display text-[13px] uppercase leading-snug tracking-[.22em] text-rp-text">{BRAND.fullName}</span>
          <span className="text-xs text-rp-dim">{BRAND.status} · {BRAND.location}</span>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/settings"
              aria-current={onSettings ? 'page' : undefined}
              className={cn(FOOT_LINK, onSettings && 'text-rp-gold hover:text-rp-gold')}
            >
              Settings
            </Link>
            <button type="button" onClick={signOut} disabled={signingOut} className={FOOT_LINK}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      }
    />
  )
}

/** 56px top bar below 1024px, current admin section at the right. */
export function AdminTopBar() {
  return <RpTopBar items={ADMIN_NAV} homeHref="/admin" brand={ADMIN_BRAND} />
}

/**
 * The admin index below 1024px, where the sidebar is hidden and the hamburger
 * sheet lists the main sections: a scrolling strip of segmented links at the
 * top of the page so every admin page stays one tap away.
 */
export function AdminTabNav() {
  const pathname = usePathname()
  const active = activeNavIndex(ADMIN_NAV, pathname)
  return (
    <div className="mb-6 lg:hidden">
      <RpTabLinks
        ariaLabel="Administrator"
        size="sm"
        scroll
        activeId={active >= 0 ? ADMIN_NAV[active].href : ''}
        items={ADMIN_NAV.map(it => ({ id: it.href, num: it.num, label: it.label, href: it.href }))}
      />
    </div>
  )
}
