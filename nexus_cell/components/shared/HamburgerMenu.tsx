'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { UserRole } from '@/lib/types'
import { SECTIONS } from '@/lib/sections'

// Per-section badge counts shown as red pills next to section labels in the
// drill-down submenu. Server fetches these once in HamburgerMount and passes
// down — the menu doesn't fetch on its own.
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

// Top-level menu items. Sections is a special entry — clicking it doesn't
// navigate, it drills into a submenu. Order: Sections first, per the user's
// call (sections are the most-used surface).
type MenuItem =
  | { kind: 'link'; href: string; label: string; description?: string; visible: (role: UserRole) => boolean }
  | { kind: 'drill'; id: 'sections'; label: string; description?: string; visible: (role: UserRole) => boolean }

const MENU_ITEMS: MenuItem[] = [
  {
    kind: 'drill',
    id: 'sections',
    label: 'Sections',
    description: 'Jump to any section of the app',
    visible: () => true,
  },
  {
    kind: 'link',
    href: '/',
    label: 'Command Panel',
    description: 'Your home — landing surface',
    visible: () => true,
  },
  {
    kind: 'link',
    href: '/admin',
    label: 'Administrator',
    description: 'Manage users, principals, and views',
    visible: role => role === 'admin',
  },
  {
    kind: 'link',
    href: '/settings',
    label: 'Settings',
    description: 'Your profile and password',
    visible: () => true,
  },
]

const ROLE_LABEL: Record<UserRole, string> = {
  principal: 'Principal',
  ea: 'Executive Assistant',
  cfo: 'CFO',
  admin: 'Administrator',
  viewer: 'Viewer',
}

type View = 'top' | 'sections'

export default function HamburgerMenu({ userName, userRole, sectionBadges = {} }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('top')
  const [signingOut, setSigningOut] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Reset to top-level view whenever the sheet closes — next open starts fresh.
  useEffect(() => {
    if (!open) setView('top')
  }, [open])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // ESC + scroll lock while open. ESC drills back when in submenu, closes
  // sheet when at top level — natural mobile/desktop pattern.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (view === 'sections') setView('top')
        else close()
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, view, close])

  async function signOut() {
    setSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }

  const visibleItems = MENU_ITEMS.filter(i => i.visible(userRole))

  return (
    <>
      {/* Trigger — fixed top-right, visible on every page */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="fixed top-5 right-5 z-40 w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors backdrop-blur-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(<MenuSheet
        userName={userName}
        userRole={userRole}
        visibleItems={visibleItems}
        view={view}
        pathname={pathname || ''}
        sectionBadges={sectionBadges}
        onDrillTo={(v) => setView(v)}
        onBack={() => setView('top')}
        onClose={close}
        onSignOut={signOut}
        signingOut={signingOut}
      />, document.body)}
    </>
  )
}

interface SheetProps {
  userName: string
  userRole: UserRole
  visibleItems: MenuItem[]
  view: View
  pathname: string
  sectionBadges: SectionBadges
  onDrillTo: (view: View) => void
  onBack: () => void
  onClose: () => void
  onSignOut: () => void
  signingOut: boolean
}

function MenuSheet({
  userName,
  userRole,
  visibleItems,
  view,
  pathname,
  sectionBadges,
  onDrillTo,
  onBack,
  onClose,
  onSignOut,
  signingOut,
}: SheetProps) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose} role="presentation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-overlay-fade-in" aria-hidden />

      {/* Sheet */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        onClick={e => e.stopPropagation()}
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[360px] flex flex-col animate-sheet-slide-in"
        style={{ background: 'var(--nx-bg-raised, #10131b)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header — back button when drilled in, else close-only */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          {view === 'sections' ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Sections
            </button>
          ) : (
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500 font-medium">Menu</span>
          )}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-gray-400 hover:text-white w-8 h-8 rounded-md hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — animated swap between top-level list and sections drill-down */}
        <nav className="flex-1 overflow-y-auto py-2 relative">
          {view === 'top' ? (
            <ul key="top" className="m-0 p-0 list-none animate-menu-slide-in-from-left">
              {visibleItems.map(item => {
                if (item.kind === 'drill') {
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onDrillTo(item.id)}
                        className="w-full text-left block px-5 py-3 hover:bg-white/[0.04] transition-colors group flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium leading-tight group-hover:text-emerald-400 transition-colors">
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </li>
                  )
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-5 py-3 hover:bg-white/[0.04] transition-colors group"
                    >
                      <p className="text-sm text-white font-medium leading-tight group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <SectionsSubmenu pathname={pathname} sectionBadges={sectionBadges} />
          )}
        </nav>

        {/* Footer — identity + sign out (always present, regardless of view) */}
        <div className="px-5 py-4 border-t border-white/5 shrink-0">
          <div className="mb-3">
            <p className="text-sm text-white font-medium truncate">{userName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABEL[userRole] || userRole}</p>
          </div>
          <button
            onClick={onSignOut}
            disabled={signingOut}
            className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 hover:text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
    </div>
  )
}

// Sections drill-down body. Renders directly from lib/sections.ts so the
// menu auto-updates when sections are added/removed/reordered.
function SectionsSubmenu({
  pathname,
  sectionBadges,
}: {
  pathname: string
  sectionBadges: SectionBadges
}) {
  // Match the section whose href is the longest prefix of the current path.
  // Handles nested routes like /travel/[tripId] → highlights "Travel".
  const activeId = SECTIONS
    .filter(s => pathname === s.href || pathname.startsWith(s.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.id

  return (
    <ul key="sections" className="m-0 p-0 list-none animate-menu-slide-in-from-right">
      {SECTIONS.map(section => {
        const badge = badgeFor(section.id, sectionBadges)
        const isActive = section.id === activeId
        return (
          <li key={section.id}>
            <Link
              href={section.href}
              className={`flex items-center gap-3 px-5 py-3 transition-colors group ${
                isActive ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: section.dotColor }}
                aria-hidden
              />
              <p
                className={`text-sm font-medium leading-tight flex-1 transition-colors ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-white group-hover:text-emerald-400'
                }`}
              >
                {section.label}
              </p>
              {badge !== undefined && badge > 0 && (
                <span className="text-[11px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// Map a section id to its badge count (or undefined). Centralized so
// adding new badge sources is one line.
function badgeFor(sectionId: string, badges: SectionBadges): number | undefined {
  if (sectionId === 'alerts') return badges.alerts
  if (sectionId === 'tasks') return badges.tasks
  return undefined
}
