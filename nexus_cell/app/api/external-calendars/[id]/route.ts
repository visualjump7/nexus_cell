import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// PATCH /api/external-calendars/[id]
// Update name / color / archived status. EA/admin only. To re-sync after
// changing the URL, call /sync separately.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.color === 'string' && /^#[0-9a-f]{6}$/i.test(body.color)) updates.color = body.color
  if (typeof body.archived === 'boolean') updates.archived = body.archived
  if (typeof body.ics_url === 'string' && body.ics_url.trim()) updates.ics_url = body.ics_url.trim()
  if (['apple', 'outlook', 'google', 'ics'].includes(body.provider)) updates.provider = body.provider

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('external_calendars')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ calendar: data })
}

// DELETE /api/external-calendars/[id]
// Hard delete (cascade removes events + preferences). Use PATCH with
// archived=true for soft archive.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('external_calendars')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
