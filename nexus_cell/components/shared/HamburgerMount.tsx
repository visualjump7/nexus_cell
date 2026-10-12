import { createClient } from '@/utils/supabase/server'
import HamburgerMenu, { type SectionBadges } from './HamburgerMenu'
import type { UserRole } from '@/lib/types'

export interface ShellUser {
  fullName: string
  role: UserRole
  badges: SectionBadges
}

// Resolves the signed-in user, their role and the two nav counts (open
// alerts, open tasks) once per request. Shared by AppShell (sidebar, top bar,
// hamburger sheet) and by HamburgerMount, which the admin layout still uses.
export async function loadShellUser(): Promise<ShellUser | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, membershipRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('organization_members').select('role, organization_id').eq('user_id', user.id).eq('status', 'active').single(),
  ])

  const fullName = profileRes.data?.full_name || user.email?.split('@')[0] || 'You'
  const role = (membershipRes.data?.role || 'viewer') as UserRole
  const orgId = membershipRes.data?.organization_id as string | undefined

  // Section counts: open alerts + open tasks. Cheap head-only counts.
  let badges: SectionBadges = {}
  if (orgId) {
    const [alertsCount, tasksCount] = await Promise.all([
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['todo', 'in_progress', 'waiting']),
    ])
    badges = {
      alerts: alertsCount.count || 0,
      tasks: tasksCount.count || 0,
    }
  }

  return { fullName, role, badges }
}

// Server wrapper that renders the hamburger sheet on its own. AppShell renders
// the menu itself; this stays for layouts without the shell (admin).
export default async function HamburgerMount() {
  const shell = await loadShellUser()
  if (!shell) return null
  return <HamburgerMenu userName={shell.fullName} userRole={shell.role} sectionBadges={shell.badges} />
}
