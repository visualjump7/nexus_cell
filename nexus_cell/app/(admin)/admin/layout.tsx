import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import HamburgerMount from '@/components/shared/HamburgerMount'
import AdminSidebar, { AdminTopBar, AdminTabNav } from './AdminSidebar'

// Layout for the entire /admin section. Admin role only — EAs trying to reach
// admin pages get redirected to the command panel.
//
// The same shell as the rest of the app: the concept sidebar (≥1024px) with the
// administrator's index (01 Overview … 05 Calendars), "← Back to the build",
// Settings and Sign out; below 1024px a 56px top bar, the admin index as a
// strip of segmented links above the page, and the hamburger sheet (the main
// sections, Settings, Sign out).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getAuthContext()
  if (role !== 'admin') redirect('/')

  return (
    <div className="rp-shell">
      <a
        href="#rp-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-rp-text focus:px-4 focus:py-2 focus:font-display focus:text-xs focus:uppercase focus:tracking-[.16em] focus:text-rp-bg"
      >
        Skip to content
      </a>
      <AdminSidebar />
      <div className="rp-main">
        <AdminTopBar />
        <main id="rp-content" className="rp-main-inner">
          <AdminTabNav />
          {children}
        </main>
      </div>
      <HamburgerMount />
    </div>
  )
}
