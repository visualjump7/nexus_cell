import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import HamburgerMount from '@/components/shared/HamburgerMount'
import AdminSidebar from './AdminSidebar'

// Layout for the entire /admin section. Admin role only — EAs trying to reach
// admin pages get redirected to the command panel.
//
// Layout is two-column: persistent sidebar on the left, content on the right.
// No NexusCorner here — the hamburger is the only navigation.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getAuthContext()
  if (role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-nexus text-white flex">
      <aside className="w-60 shrink-0 border-r border-white/[0.06] bg-[#0c0d14]">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5 hover:bg-white/[0.02] transition-colors">
          <div
            className="w-[22px] h-[22px] rounded-md"
            style={{
              background: 'radial-gradient(circle at 30% 30%, var(--nx-teal), var(--nx-teal-dim))',
              boxShadow: '0 0 12px var(--nx-teal-glow)',
            }}
            aria-hidden
          />
          <span className="uppercase font-medium text-[11px] tracking-[0.18em] text-gray-400">
            Admin
          </span>
        </Link>
        <AdminSidebar />
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-8">
        {children}
      </main>
      <HamburgerMount />
    </div>
  )
}
