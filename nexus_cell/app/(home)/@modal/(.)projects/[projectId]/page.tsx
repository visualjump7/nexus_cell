import { getAuthContext } from '@/lib/auth'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/app/(app)/projects/[projectId]/ProjectDetail'
import ProjectBlocks from '@/components/project-detail/ProjectBlocks'
import SectionOverlay from '@/components/shared/SectionOverlay'
import { RpSubhead } from '@/components/rp'
import type { ProjectBlock } from '@/lib/types'

export default async function ProjectDetailOverlay({ params }: { params: { projectId: string } }) {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: project } = await supabase.from('projects').select('*').eq('id', params.projectId).eq('organization_id', orgId).single()
  if (!project) notFound()

  const [budgetsRes, filesRes, blocksRes] = await Promise.all([
    supabase.from('budgets').select('*').eq('project_id', project.id).order('created_at', { ascending: true }),
    supabase.from('project_files').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    supabase.from('project_blocks').select('*, project_contacts(*), project_images(*)').eq('project_id', project.id).order('position', { ascending: true }),
  ])

  const blocks = (blocksRes.data || []) as ProjectBlock[]

  // ProjectDetail renders without its `blocks` prop here; the overlay lays
  // the Directory out itself, under its own sub-section head.
  return (
    <SectionOverlay title={project.name || 'Project'} fullPageHref={`/projects/${project.id}`}>
      <ProjectDetail project={project} budgets={budgetsRes.data || []} files={filesRes.data || []} role={role} orgId={orgId} />
      <section className="mt-[var(--rp-gap)] flex max-w-[1400px] flex-col gap-6" aria-labelledby="overlay-directory">
        <RpSubhead id="overlay-directory" title="Directory" spec="Personnel, subcontractors, notes and images on this package" />
        {/* ProjectDetail numbers Budget 01 and Files 02 here, so the blocks carry on from 03. */}
        <ProjectBlocks projectId={project.id} orgId={orgId} blocks={blocks} role={role} numberFrom={3} />
      </section>
    </SectionOverlay>
  )
}
