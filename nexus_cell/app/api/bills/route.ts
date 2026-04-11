import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// CREATE a new bill
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
    .from('bills')
    .insert({
      organization_id: membership.organization_id,
      created_by: user.id,
      vendor: body.vendor,
      description: body.description || null,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: 'pending',
      category: body.category || null,
      due_date: body.due_date || null,
      payment_method: body.payment_method || null,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
