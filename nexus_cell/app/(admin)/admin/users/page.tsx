import { getAuthContext } from '@/lib/auth'
import UsersManager from './UsersManager'
import type { PendingInvitation } from '@/lib/types'

export default async function AdminUsersPage() {
  const { supabase, orgId, user } = await getAuthContext()

  // Initial server-rendered data so the page paints immediately
  const [usersRes, pendingRes] = await Promise.all([
    supabase
      .from('organization_members')
      .select('user_id, role, status, created_at, profiles(full_name, email)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pending_invitations')
      .select('*, proposed_by_profile:profiles!pending_invitations_proposed_by_fkey(full_name, email)')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const users = (usersRes.data || []).map(m => {
    const p = m.profiles as unknown as { full_name: string | null; email: string } | null
    return {
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      created_at: m.created_at,
      full_name: p?.full_name || null,
      email: p?.email || null,
    }
  })

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-200 mb-1">Users</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create accounts directly, review EA-proposed invites, reset passwords, and manage roles.
      </p>
      <UsersManager
        initialUsers={users}
        initialPending={(pendingRes.data || []) as PendingInvitation[]}
        currentUserId={user.id}
      />
    </div>
  )
}
