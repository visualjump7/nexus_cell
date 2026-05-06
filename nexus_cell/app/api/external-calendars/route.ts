import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { syncCalendar } from '@/lib/calendar-sync'

const PALETTE = ['#3b82f6', '#a855f7', '#22d3ee', '#f59e0b', '#ec4899', '#84cc16', '#eab308', '#6366f1']

// GET /api/external-calendars
// Lists all non-archived calendars for the org, joined with the caller's
// per-calendar visibility preference (visible defaults to true if no row).
export async function GET() {
  const { supabase, user, orgId } = await getAuthContext()

  const [calsRes, prefsRes] = await Promise.all([
    supabase
      .from('external_calendars')
      .select('*')
      .eq('organization_id', orgId)
      .eq('archived', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('external_calendar_preferences')
      .select('external_calendar_id, visible')
      .eq('user_id', user.id),
  ])

  const visibleByCalendar = new Map(
    (prefsRes.data || []).map(p => [p.external_calendar_id, p.visible]),
  )

  const calendars = (calsRes.data || []).map(c => ({
    ...c,
    // Default visible=true if no preference row exists yet
    visible: visibleByCalendar.has(c.id) ? !!visibleByCalendar.get(c.id) : true,
  }))

  return NextResponse.json({ calendars })
}

// POST /api/external-calendars
// Adds a new calendar (EA/admin). Triggers an inline sync so events are
// available immediately. Body: { name, ics_url, provider?, color? }
export async function POST(request: Request) {
  const { supabase, user, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = String(body?.name || '').trim()
  const ics_url = String(body?.ics_url || '').trim()
  const provider = ['apple', 'outlook', 'google', 'ics'].includes(body?.provider) ? body.provider : 'ics'

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!ics_url) return NextResponse.json({ error: 'ICS URL required' }, { status: 400 })

  // Auto-pick a color from the palette if none supplied. Cycles based on
  // current count so calendars added back-to-back end up visually distinct.
  let color = body?.color
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) {
    const { count } = await supabase
      .from('external_calendars')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
    color = PALETTE[(count || 0) % PALETTE.length]
  }

  const { data, error } = await supabase
    .from('external_calendars')
    .insert({
      organization_id: orgId,
      name,
      provider,
      ics_url,
      color,
      added_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Initial sync — best effort. Even if it fails, the calendar row exists
  // and the error lands in last_sync_error so the admin UI can show it.
  await syncCalendar(data.id).catch(() => null)

  return NextResponse.json({ calendar: data }, { status: 201 })
}
