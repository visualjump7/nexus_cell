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
    .from('project_contacts')
    .select('position')
    .eq('block_id', params.blockId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing && existing.length > 0) ? existing[0].position + 1 : 0

  const { data, error } = await supabase
    .from('project_contacts')
    .insert({
      block_id: params.blockId,
      organization_id: membership.organization_id,
      contact_type: body.contact_type,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      status: body.status || 'active',
      notes: body.notes || null,
      position: nextPosition,
      role: body.role || null,
      company: body.company || null,
      department: body.department || null,
      company_name: body.company_name || null,
      trade: body.trade || null,
      contract_value_cents: body.contract_value_cents || null,
      contract_start: body.contract_start || null,
      contract_end: body.contract_end || null,
      license_number: body.license_number || null,
      insurance_on_file: body.insurance_on_file || false,
      insurance_expiry: body.insurance_expiry || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
