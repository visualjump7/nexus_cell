import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

  // Get max position for this project
  const { data: existing } = await supabase
    .from('project_blocks')
    .select('position')
    .eq('project_id', body.project_id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing && existing.length > 0) ? existing[0].position + 1 : 0

  const { data, error } = await supabase
    .from('project_blocks')
    .insert({
      project_id: body.project_id,
      organization_id: membership.organization_id,
      type: body.type,
      title: body.title || null,
      position: nextPosition,
      config: body.config || {},
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
