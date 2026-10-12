import { getAuthContext } from '@/lib/auth'
import ProjectsList from '@/app/(app)/projects/ProjectsList'

export default async function ProjectsPage() {
  const { supabase, orgId, role } = await getAuthContext()

  // Budget lines are embedded so the list can show budget, spend and meters.
  const { data: projects } = await supabase
    .from('projects')
    .select('*, budgets(budgeted, actual)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return <ProjectsList projects={projects || []} role={role} orgId={orgId} />
}
