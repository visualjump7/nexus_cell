import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import HamburgerMount from '@/components/shared/HamburgerMount'
import AdminSidebar from './AdminSidebar'
import { BRAND } from '@/lib/brand'

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
      <aside className="w-64 shrink-0 border-r border-[#1F1F1F] bg-[#0A0B0C] flex flex-col" style={{ padding: '28px 24px' }}>
        <Link href="/admin" className="flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.badgeAlt} alt={BRAND.fullName} className="w-10 h-auto" />
          <span className="flex flex-col" style={{ lineHeight: 1.15 }}>
            <span className="font-display uppercase text-[15px] tracking-[0.12em] text-[#F5F5F5]">
              Roaring Pines
            </span>
            <span className="uppercase text-[11px] tracking-[0.18em] text-[#9AA0A4]">
              Administrator
            </span>
          </span>
        </Link>
        <AdminSidebar />
        <div className="mt-auto pt-5 border-t border-[#1F1F1F]">
          <p className="uppercase text-[10px] tracking-[0.2em] text-[#9AA0A4] m-0">Development</p>
          <p className="font-display uppercase text-[13px] tracking-[0.22em] text-[#F5F5F5] mt-2 mb-1">{BRAND.fullName}</p>
          <p className="text-[12px] text-[#6E7578] m-0">Under construction · Florida</p>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-8">
        {children}
      </main>
      <HamburgerMount />
    </div>
  )
}
