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
    .from('subscriptions')
    .insert({
      organization_id: membership.organization_id,
      name: body.name,
      provider: body.provider || null,
      amount: body.amount || null,
      currency: body.currency || 'USD',
      frequency: body.frequency || 'monthly',
      next_renewal: body.next_renewal || null,
      category: body.category || null,
      auto_renew: body.auto_renew ?? true,
      status: body.status || 'active',
      login_url: body.login_url || null,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
