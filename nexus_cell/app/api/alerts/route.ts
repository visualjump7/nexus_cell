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
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      organization_id: membership.organization_id,
      created_by: user.id,
      alert_type: body.alert_type || 'info',
      title: body.title,
      body: body.body || null,
      priority: body.priority || 'normal',
      status: 'open',
      target_role: body.target_role || null,
      target_user_id: body.target_user_id || null,
      related_type: body.related_type || null,
      related_id: body.related_id || null,
      expires_at: body.expires_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
