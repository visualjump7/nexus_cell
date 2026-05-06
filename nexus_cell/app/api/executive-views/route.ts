import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { WIDGET_CATALOG } from '@/lib/widgets'

// GET /api/executive-views?principal_user_id=<id>
// Returns the executive view config for a given principal in this org.
// Returns 404 if no config exists yet (caller renders defaults).
export async function GET(request: Request) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const principalId = searchParams.get('principal_user_id')
  if (!principalId) {
    return NextResponse.json({ error: 'principal_user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('executive_views')
    .select('*')
    .eq('organization_id', orgId)
    .eq('principal_user_id', principalId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ config: null }, { status: 200 })
  return NextResponse.json({ config: data })
}

// POST /api/executive-views — upsert a config row
// Body: { principal_user_id, widgets, greeting_style, custom_greeting }
export async function POST(request: Request) {
  const { supabase, user, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { principal_user_id, widgets, greeting_style, custom_greeting } = body || {}

  if (!principal_user_id) {
    return NextResponse.json({ error: 'principal_user_id required' }, { status: 400 })
  }
  if (!Array.isArray(widgets)) {
    return NextResponse.json({ error: 'widgets must be an array' }, { status: 400 })
  }

  // Validate widget IDs against the catalog so we never persist a typo
  const validIds = new Set(WIDGET_CATALOG.map(w => w.id))
  const cleaned = (widgets as Array<{ widget_id: string; settings?: unknown }>)
    .filter(w => w && typeof w.widget_id === 'string' && validIds.has(w.widget_id as never))
    .map(w => ({ widget_id: w.widget_id, settings: w.settings ?? undefined }))

  // Confirm the principal_user_id is actually a principal in this org
  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', orgId)
    .eq('user_id', principal_user_id)
    .eq('status', 'active')
    .single()

  if (!targetMember || targetMember.role !== 'principal') {
    return NextResponse.json({ error: 'Target user is not a principal in this organization' }, { status: 400 })
  }

  const greeting = ['none', 'time_of_day', 'custom'].includes(greeting_style) ? greeting_style : 'time_of_day'

  const { data, error } = await supabase
    .from('executive_views')
    .upsert(
      {
        organization_id: orgId,
        principal_user_id,
        widgets: cleaned,
        greeting_style: greeting,
        custom_greeting: greeting === 'custom' ? (custom_greeting || null) : null,
        updated_by: user.id,
      },
      { onConflict: 'organization_id,principal_user_id' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data }, { status: 200 })
}
