import { createClient } from '@/utils/supabase/server'
import HamburgerMenu, { type SectionBadges } from './HamburgerMenu'
import type { UserRole } from '@/lib/types'

// Server component wrapper that resolves the current user + role once and
// renders the hamburger menu. Mount this in any layout that needs the global
// menu — (home), (modules), (admin), and the executive view.
//
// Also fetches the same badge metrics the landing page uses so the Sections
// submenu can show "Alerts (4)" / "Tasks (8)" pills from anywhere in the app.
export default async function HamburgerMount() {
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

  // Section badges — open alerts + open tasks. Cheap head-only counts.
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

  return <HamburgerMenu userName={fullName} userRole={role} sectionBadges={badges} />
}
