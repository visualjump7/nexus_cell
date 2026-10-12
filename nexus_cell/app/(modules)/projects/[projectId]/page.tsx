import { getAuthContext } from '@/lib/auth'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/app/(app)/projects/[projectId]/ProjectDetail'
import type { ProjectBlock } from '@/lib/types'

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: project } = await supabase.from('projects').select('*').eq('id', params.projectId).eq('organization_id', orgId).single()
  if (!project) notFound()

  const [budgetsRes, filesRes, blocksRes] = await Promise.all([
    supabase.from('budgets').select('*').eq('project_id', project.id).order('created_at', { ascending: true }),
    supabase.from('project_files').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    supabase.from('project_blocks').select('*, project_contacts(*), project_images(*)').eq('project_id', project.id).order('position', { ascending: true }),
  ])

  const blocks = (blocksRes.data || []) as ProjectBlock[]

  // ProjectDetail renders the Directory (ProjectBlocks) itself and takes its
  // hero images from the gallery blocks.
  return (
    <ProjectDetail
      project={project}
      budgets={budgetsRes.data || []}
      files={filesRes.data || []}
      blocks={blocks}
      role={role}
      orgId={orgId}
    />
  )
}
