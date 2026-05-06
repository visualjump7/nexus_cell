import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// DELETE /api/projects/[id]/files/[fileId]
// Removes both the project_files row and the underlying Storage object.
// Storage path is derived from the file_url which always points at the
// `project-files` bucket via the standard Supabase public URL format.
export async function DELETE(_request: Request, { params }: { params: { id: string; fileId: string } }) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load the file row scoped to a project that belongs to this org
  const { data: file } = await supabase
    .from('project_files')
    .select('id, file_url, projects!inner(organization_id)')
    .eq('id', params.fileId)
    .eq('project_id', params.id)
    .maybeSingle()

  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  const proj = (file.projects as unknown as { organization_id: string } | null)
  if (!proj || proj.organization_id !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Best-effort storage cleanup. Public URLs look like:
  //   https://<project>.supabase.co/storage/v1/object/public/project-files/<path>
  const marker = '/storage/v1/object/public/project-files/'
  const idx = file.file_url.indexOf(marker)
  if (idx !== -1) {
    const path = decodeURIComponent(file.file_url.slice(idx + marker.length))
    await supabase.storage.from('project-files').remove([path]).catch(() => null)
  }

  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', params.fileId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
