'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { UserRole } from '@/lib/types'
import { NAV } from '@/lib/sections'
import { BRAND } from '@/lib/brand'
import { activeNavIndex, pushEscapeLayer, Menu, type RpNavItem } from '@/components/rp'
import { cn } from '@/lib/utils'

// Per-section counts shown in gold beside the section label (Alerts, Tasks).
// The server fetches these once (AppShell / HamburgerMount) and passes them
// down; the menu never fetches on its own.
export interface SectionBadges {
  alerts?: number
  tasks?: number
  // Easy to add more without touching the menu code: e.g. comms?: number
}

interface Props {
  userName: string
  userRole: UserRole
  sectionBadges?: SectionBadges
}

/** Sign-out shared by the hamburger sheet and the sidebar footer. */
export function useSignOut() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const signOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }, [router])
  return { signOut, signingOut }
}

function badgeFor(sectionId: string, badges: SectionBadges): number | undefined {
  if (sectionId === 'alerts') return badges.alerts
  if (sectionId === 'tasks') return badges.tasks
  return undefined
}

/**
 * The menu below 1024px: a square trigger that sits inside the 56px top bar,
 * and a right-hand sheet laid out like the concept sidebar (badge, numbered
 * sections 01–11 with gold counts, signed-in block). Settings, Administrator
 * (admins only) and Sign out sit in the footer, as on the sidebar.
 */
export default function HamburgerMenu({ userName, userRole, sectionBadges = {} }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { signOut, signingOut } = useSignOut()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  const close = useCallback(() => setOpen(false), [])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Esc (layered, so a modal opened on top closes alone) + scroll lock
  useEffect(() => {
    if (!open) return
    const unregister = pushEscapeLayer(close)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      unregister()
      document.body.style.overflow = prev
    }
  }, [open, close])

  // Focus moves into the sheet on open and back to the trigger on close
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const t = window.setTimeout(() => closeRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    if (wasOpen.current) {
      wasOpen.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  const items: RpNavItem[] = NAV.map(s => ({
    num: s.num,
    label: s.label,
    href: s.href,
    flag: s.flag,
    badge: badgeFor(s.id, sectionBadges),
  }))

  return (
    <>
      {/* Trigger: sits inside the 56px top bar (hidden with it at ≥1024px) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed right-4 top-2 z-[45] inline-flex h-10 w-10 items-center justify-center border border-rp-line2 bg-rp-bg text-rp-muted transition-colors duration-200 hover:border-rp-gold hover:text-rp-text lg:hidden"
      >
        <Menu size={18} strokeWidth={1.5} aria-hidden />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <MenuSheet
          userName={userName}
          userRole={userRole}
          items={items}
          pathname={pathname || '/'}
          onClose={close}
          onSignOut={signOut}
          signingOut={signingOut}
          closeRef={closeRef}
        />,
        document.body,
      )}
    </>
  )
}

interface SheetProps {
  userName: string
  userRole: UserRole
  items: RpNavItem[]
  pathname: string
  onClose: () => void
  onSignOut: () => void
  signingOut: boolean
  closeRef: React.RefObject<HTMLButtonElement>
}

const FOOT_LINK = 'font-display text-[11px] uppercase tracking-[.14em] text-rp-muted transition-colors duration-200 hover:text-rp-text'

function MenuSheet({ userName, userRole, items, pathname, onClose, onSignOut, signingOut, closeRef }: SheetProps) {
  const active = activeNavIndex(items, pathname)
  const firstName = userName.split(' ')[0] || userName
  const onSettings = pathname === '/settings' || pathname.startsWith('/settings/')
  const onAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} role="presentation">
      {/* Scrim: flat, no blur */}
      <div className="absolute inset-0 bg-[rgba(8,9,10,.85)] animate-overlay-fade-in" aria-hidden />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        onClick={e => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-[min(360px,100vw)] flex-col gap-7 overflow-y-auto border-l border-rp-line2 bg-rp-bg px-6 py-7 animate-sheet-slide-in"
      >
        {/* Brand + close */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rp-brand min-w-0" onClick={onClose}>
            <img src={BRAND.badgeAlt} alt="" aria-hidden />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="rp-brand-name">{BRAND.name}</span>
              <span className="rp-brand-sub">{BRAND.subName}</span>
            </span>
          </Link>
          <button ref={closeRef} type="button" onClick={onClose} className="rp-btn-ghost rp-btn--sm shrink-0">
            Close
          </button>
        </div>

        {/* Numbered sections, as on the sidebar */}
        <nav aria-label="Sections">
          <ul className="rp-nav">
            {items.map((it, i) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={onClose}
                  className="rp-nav-item"
                  aria-current={i === active ? 'page' : undefined}
                >
                  <span className="rp-nav-num">{it.num}</span>
                  <span className="rp-nav-label">{it.label}</span>
                  {it.badge ? (
                    <span className="rp-nav-badge" aria-label={`${it.badge} open`}>{it.badge > 99 ? '99+' : it.badge}</span>
                  ) : it.flag ? (
                    <span className="rp-nav-flag">{it.flag}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Signed-in block */}
        <div className="rp-sidebar-foot">
          <span className="text-[10px] uppercase tracking-[.2em] text-rp-muted">Signed in</span>
          <span className="truncate font-display text-base uppercase tracking-[.22em] text-rp-text">{firstName}</span>
          <span className="text-xs text-rp-dim">{BRAND.roleLabel[userRole] || userRole} · {BRAND.subName}</span>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/settings"
              onClick={onClose}
              aria-current={onSettings ? 'page' : undefined}
              className={cn(FOOT_LINK, onSettings && 'text-rp-gold hover:text-rp-gold')}
            >
              Settings
            </Link>
            {userRole === 'admin' && (
              <>
                <Link
                  href="/admin"
                  onClick={onClose}
                  aria-current={onAdmin ? 'page' : undefined}
                  className={cn(FOOT_LINK, onAdmin && 'text-rp-gold hover:text-rp-gold')}
                >
                  Administrator
                </Link>
              </>
            )}
          </div>
          <button type="button" onClick={onSignOut} disabled={signingOut} className="rp-btn-ghost mt-4 w-full justify-center">
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
    </div>
  )
}
