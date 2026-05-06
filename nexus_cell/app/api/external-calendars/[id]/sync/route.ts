import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { syncCalendar } from '@/lib/calendar-sync'

// POST /api/external-calendars/[id]/sync
// Force-refresh a calendar's events from the source ICS. EA/admin only.
// Updates last_synced_at + last_sync_error.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Confirm the calendar belongs to this org before kicking off a sync
  const { data: cal } = await supabase
    .from('external_calendars')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!cal) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 })

  const result = await syncCalendar(params.id)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
