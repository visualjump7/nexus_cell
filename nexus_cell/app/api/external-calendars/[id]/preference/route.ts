import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// PATCH /api/external-calendars/[id]/preference
// Toggle the caller's per-calendar visibility. Body: { visible: boolean }.
// Any active org member can call this for any calendar in their org.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, orgId } = await getAuthContext()

  const body = await request.json()
  const visible = !!body?.visible

  // Confirm the calendar belongs to this org so users can't toggle
  // preferences for other orgs' calendars.
  const { data: cal } = await supabase
    .from('external_calendars')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!cal) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 })

  const { error } = await supabase
    .from('external_calendar_preferences')
    .upsert(
      {
        user_id: user.id,
        external_calendar_id: params.id,
        visible,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,external_calendar_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
