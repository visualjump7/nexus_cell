import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH /api/me/profile — update the signed-in user's profile.
// Accepts: { full_name?, hero_style? } — fields are independent so each can
// be patched separately. Email changes go through Supabase's email-change flow.
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  // full_name
  if (body?.full_name !== undefined) {
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    if (!fullName) return NextResponse.json({ error: 'full_name required' }, { status: 400 })
    if (fullName.length > 200) return NextResponse.json({ error: 'full_name too long' }, { status: 400 })
    updates.full_name = fullName
  }

  // hero_style — must match the SQL CHECK constraint in sql/012
  if (body?.hero_style !== undefined) {
    if (!['orb', 'character'].includes(body.hero_style)) {
      return NextResponse.json({ error: 'hero_style must be "orb" or "character"' }, { status: 400 })
    }
    updates.hero_style = body.hero_style
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
