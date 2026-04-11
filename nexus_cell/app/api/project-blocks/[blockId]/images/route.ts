import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { blockId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership || !['ea', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const { data: existing } = await supabase
    .from('project_images')
    .select('position')
    .eq('block_id', params.blockId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing && existing.length > 0) ? existing[0].position + 1 : 0

  const { data, error } = await supabase
    .from('project_images')
    .insert({
      block_id: params.blockId,
      organization_id: membership.organization_id,
      url: body.url,
      thumbnail_url: body.thumbnail_url || null,
      caption: body.caption || null,
      taken_at: body.taken_at || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
      width: body.width || null,
      height: body.height || null,
      position: nextPosition,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
