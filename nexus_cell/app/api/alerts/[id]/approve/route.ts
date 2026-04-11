import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const decision = body.decision as 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  // Create approval record
  const { error: approvalError } = await supabase
    .from('approvals')
    .insert({
      alert_id: params.id,
      decided_by: user.id,
      decision,
      comment: body.comment || null,
    })

  if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 500 })

  // Update alert status to resolved
  const { error: alertError } = await supabase
    .from('alerts')
    .update({ status: 'resolved' })
    .eq('id', params.id)
    .eq('organization_id', membership.organization_id)

  if (alertError) return NextResponse.json({ error: alertError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
