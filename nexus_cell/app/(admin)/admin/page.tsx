import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import type { PendingInvitation } from '@/lib/types'
import { BRAND } from '@/lib/brand'

const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', ea: "Owner's Rep", cfo: 'CFO', principal: 'Owner', viewer: 'Viewer' }

export default async function AdminOverviewPage() {
  const { supabase, orgId } = await getAuthContext()

  const [membersRes, principalsRes, pendingInvitesRes, recentInvitesRes] = await Promise.all([
    supabase.from('organization_members').select('user_id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('organization_members').select('user_id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active').eq('role', 'principal'),
    supabase.from('pending_invitations').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('pending_invitations').select('*').eq('organization_id', orgId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Active members', value: (membersRes.count ?? 0).toString(), href: '/admin/users' },
    { label: 'Owners', value: (principalsRes.count ?? 0).toString(), href: '/admin/principals' },
    { label: 'Pending invitations', value: (pendingInvitesRes.count ?? 0).toString(), href: '/admin/users' },
  ]

  const pending = (recentInvitesRes.data || []) as PendingInvitation[]

  return (
    <div className="max-w-4xl">
      <header className="rp-head">
        <span className="rp-eyebrow">{BRAND.fullName}</span>
        <h1 className="rp-title">Administrator</h1>
        <p className="rp-lede">Manage users, owners, and what they see.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="rp-panel p-5 hover:border-[#3A3E42] transition-colors"
          >
            <p className="rp-eyebrow--muted mb-2">{s.label}</p>
            <p className="rp-stat-value text-white">{s.value}</p>
          </Link>
        ))}
      </div>

      <section className="rp-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="rp-eyebrow--muted">Pending invitations</h2>
          <Link href="/admin/users" className="text-xs text-gray-500 hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-[#6E7578] py-4">No invitations awaiting approval.</p>
        ) : (
          <ul className="space-y-2 m-0 p-0 list-none">
            {pending.map(inv => (
              <li key={inv.id} className="bg-[#141618] border border-[#1F1F1F] p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{inv.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{inv.email} · {ROLE_LABEL[inv.role] || inv.role}</p>
                </div>
                <Link
                  href="/admin/users"
                  className="rp-btn-ghost shrink-0"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
