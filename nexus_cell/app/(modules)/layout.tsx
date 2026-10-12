import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/shared/AppShell'
import FloatingAdd from '@/components/shared/FloatingAdd'
import type { UserRole } from '@/lib/types'

export default async function ModulesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const role = (membership?.role || 'viewer') as UserRole
  const canWrite = ['ea', 'admin'].includes(role)

  // Sidebar (≥1024) or top bar + hamburger sheet (<1024), the page in the
  // main column, and the footer pager. NexusCorner is retired: the badge in
  // the sidebar / top bar is the way home.
  return (
    <>
      <AppShell fab={canWrite}>{children}</AppShell>
      {canWrite && <FloatingAdd />}
    </>
  )
}
