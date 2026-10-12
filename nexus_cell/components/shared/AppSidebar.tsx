'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RpSidebar, type RpNavItem } from '@/components/rp'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import UniversalInput from '@/components/input/UniversalInput'
import { useSignOut } from './HamburgerMenu'

interface Props {
  items: RpNavItem[]
  name: string
  role: UserRole
  /** Writers on module pages: "+ Create" (UniversalInput), which FloatingAdd covers below 1024px. */
  canCreate?: boolean
}

const FOOT_LINK = 'font-display text-[11px] uppercase tracking-[.14em] text-rp-muted transition-colors duration-200 hover:text-rp-text disabled:opacity-50'

/**
 * The shell sidebar (≥1024px): the concept's badge, numbered nav and, at the
 * foot, the presenter block reworked as the signed-in user with + Create
 * (writers), Settings, Administrator (admins only) and Sign out.
 */
export default function AppSidebar({ items, name, role, canCreate = false }: Props) {
  const pathname = usePathname() || '/'
  const { signOut, signingOut } = useSignOut()
  const [creating, setCreating] = useState(false)
  const firstName = name.split(' ')[0] || name
  const onSettings = pathname === '/settings' || pathname.startsWith('/settings/')
  const onAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <RpSidebar
      items={items}
      footer={
        <>
          <span className="text-[10px] uppercase tracking-[.2em] text-rp-muted">Signed in</span>
          <span className="truncate font-display text-base uppercase tracking-[.22em] text-rp-text">{firstName}</span>
          <span className="text-xs text-rp-dim">{BRAND.roleLabel[role] || role} · {BRAND.subName}</span>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {canCreate && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                aria-haspopup="dialog"
                className={cn(FOOT_LINK, 'text-rp-text hover:text-rp-gold')}
              >
                <span aria-hidden>+</span> Create
              </button>
            )}
            <Link
              href="/settings"
              aria-current={onSettings ? 'page' : undefined}
              className={cn(FOOT_LINK, onSettings && 'text-rp-gold hover:text-rp-gold')}
            >
              Settings
            </Link>
            {role === 'admin' && (
              <>
                <Link
                  href="/admin"
                  aria-current={onAdmin ? 'page' : undefined}
                  className={cn(FOOT_LINK, onAdmin && 'text-rp-gold hover:text-rp-gold')}
                >
                  Administrator
                </Link>
              </>
            )}
            <button type="button" onClick={signOut} disabled={signingOut} className={FOOT_LINK}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          {creating && <UniversalInput onClose={() => setCreating(false)} />}
        </>
      }
    />
  )
}
