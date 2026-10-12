import { getAuthContext } from '@/lib/auth'
import UsersManager from './UsersManager'
import type { PendingInvitation } from '@/lib/types'
import { RpPage, RpPageHeader } from '@/components/rp'

export const metadata = { title: 'Members' }

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
    <RpPage>
      <RpPageHeader
        eyebrow="02 · Members"
        title="Members"
        line="Create accounts, approve invitations from the owner's rep, reset passwords and set roles."
      />
      <UsersManager
        initialUsers={users}
        initialPending={(pendingRes.data || []) as PendingInvitation[]}
        currentUserId={user.id}
      />
    </RpPage>
  )
}
