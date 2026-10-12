import { RpTopBar, RpFootNav, type RpNavItem } from '@/components/rp'
import { NAV } from '@/lib/sections'
import AppSidebar from './AppSidebar'
import HamburgerMenu from './HamburgerMenu'
import { loadShellUser } from './HamburgerMount'

interface Props {
  children: React.ReactNode
  /** '← Prev | 03 / 11 | Next →' under the page (default true; off on "/"). */
  footNav?: boolean
  /**
   * The layout renders FloatingAdd (52px, bottom-right, below 1024px only):
   * keep the pager's "Next →" and the last block clear of it, and put
   * "+ Create" in the sidebar footer at ≥1024px instead.
   */
  fab?: boolean
}

/**
 * The app shell, laid out like the pitch site: [sidebar 220 | main].
 * ≥1024px: sticky sidebar with the badge, numbered sections and the signed-in
 * block. Below 1024px: a 56px top bar and the hamburger sheet as the nav.
 * One fetch (the same one HamburgerMount always made) feeds all three.
 */
export default async function AppShell({ children, footNav = true, fab = false }: Props) {
  const shell = await loadShellUser()
  const badges = shell?.badges ?? {}

  const nav: RpNavItem[] = NAV.map(s => ({
    num: s.num,
    label: s.label,
    href: s.href,
    flag: s.flag,
    badge: s.id === 'alerts' ? badges.alerts : s.id === 'tasks' ? badges.tasks : undefined,
  }))

  return (
    <div className={fab ? 'rp-shell rp-shell--fab' : 'rp-shell'}>
      <a
        href="#rp-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-rp-text focus:px-4 focus:py-2 focus:font-display focus:text-xs focus:uppercase focus:tracking-[.16em] focus:text-rp-bg"
      >
        Skip to content
      </a>
      <AppSidebar items={nav} name={shell?.fullName ?? ''} role={shell?.role ?? 'viewer'} canCreate={fab} />
      <div className="rp-main">
        <RpTopBar items={nav} />
        <main id="rp-content" className="rp-main-inner">
          {children}
        </main>
        {footNav && <RpFootNav items={nav} className={fab ? 'max-lg:pr-[calc(var(--rp-gutter)+64px)]' : undefined} />}
      </div>
      {shell && <HamburgerMenu userName={shell.fullName} userRole={shell.role} sectionBadges={badges} />}
    </div>
  )
}
