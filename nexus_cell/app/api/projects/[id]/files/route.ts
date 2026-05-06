import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// POST /api/projects/[id]/files
// Records a project_files row after the client uploads to Storage. The actual
// file bytes are uploaded directly browser → Supabase Storage (RLS-gated);
// this endpoint just persists the metadata + ties it to the project.
//
// Body: { file_url, file_name, file_type?, file_size?, label? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Confirm the project belongs to this org before attaching a file
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = await request.json()
  const file_url = String(body?.file_url || '').trim()
  const file_name = String(body?.file_name || '').trim()
  const file_type = body?.file_type ? String(body.file_type) : null
  const file_size = typeof body?.file_size === 'number' ? body.file_size : null
  const label = body?.label ? String(body.label).trim() : null

  if (!file_url) return NextResponse.json({ error: 'file_url required' }, { status: 400 })
  if (!file_name) return NextResponse.json({ error: 'file_name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: params.id,
      uploaded_by: user.id,
      file_url,
      file_name,
      file_type,
      file_size,
      label,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
