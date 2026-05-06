import { getAuthContext } from '@/lib/auth'
import ProjectsList from '@/app/(app)/projects/ProjectsList'
import SectionOverlay from '@/components/shared/SectionOverlay'

export default async function ProjectsOverlay() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <SectionOverlay title="Projects" fullPageHref="/projects">
      <ProjectsList projects={projects || []} role={role} orgId={orgId} />
    </SectionOverlay>
  )
}
