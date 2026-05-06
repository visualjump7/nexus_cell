import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import type { PendingInvitation } from '@/lib/types'

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
    { label: 'Principals', value: (principalsRes.count ?? 0).toString(), href: '/admin/principals' },
    { label: 'Pending invitations', value: (pendingInvitesRes.count ?? 0).toString(), href: '/admin/users' },
  ]

  const pending = (recentInvitesRes.data || []) as PendingInvitation[]

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-200 mb-1">Administrator</h1>
      <p className="text-sm text-gray-500 mb-6">Manage users, principals, and what they see.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-card-dark rounded-xl p-5 hover:brightness-110 transition-all border border-white/[0.04]"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-3xl font-semibold text-white">{s.value}</p>
          </Link>
        ))}
      </div>

      <section className="bg-card-dark rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Pending invitations</h2>
          <Link href="/admin/users" className="text-xs text-gray-500 hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">No invitations awaiting approval.</p>
        ) : (
          <ul className="space-y-2 m-0 p-0 list-none">
            {pending.map(inv => (
              <li key={inv.id} className="bg-[#141520] border border-white/5 rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{inv.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{inv.email} · {inv.role}</p>
                </div>
                <Link
                  href="/admin/users"
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-md transition-colors shrink-0"
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
