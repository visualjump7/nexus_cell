import { getAuthContext } from '@/lib/auth'
import ProjectsList from '@/app/(app)/projects/ProjectsList'

export default async function ProjectsPage() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <ProjectsList projects={projects || []} role={role} orgId={orgId} />
    </div>
  )
}
