import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

export async function getAuthContext() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) redirect('/login')

  return {
    supabase,
    user,
    orgId: membership.organization_id,
    role: membership.role as UserRole,
  }
}
