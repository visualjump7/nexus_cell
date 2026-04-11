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

  if (!membership || !['ea', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('trip_segments')
    .insert({
      trip_id: params.id,
      segment_type: body.segment_type || 'other',
      from_location: body.from_location || null,
      to_location: body.to_location || null,
      depart_at: body.depart_at || null,
      arrive_at: body.arrive_at || null,
      check_in: body.check_in || null,
      check_out: body.check_out || null,
      carrier: body.carrier || null,
      confirmation_code: body.confirmation_code || null,
      booking_reference: body.booking_reference || null,
      seat_info: body.seat_info || null,
      notes: body.notes || null,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
