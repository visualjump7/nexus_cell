import { getAuthContext } from '@/lib/auth'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/app/(app)/projects/[projectId]/ProjectDetail'
import ProjectBlocks from '@/components/project-detail/ProjectBlocks'
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

  return (
    <div>
      <ProjectDetail project={project} budgets={budgetsRes.data || []} files={filesRes.data || []} role={role} />

      {/* Project Directory — Block System */}
      <div className="max-w-4xl mt-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Project Directory</h2>
        <ProjectBlocks projectId={project.id} orgId={orgId} blocks={blocks} role={role} />
      </div>
    </div>
  )
}
