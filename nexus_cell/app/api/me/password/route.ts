import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/me/password — change the signed-in user's password. Supabase
// requires the user to be authenticated (which they are via the cookie) and
// will accept the new password without re-asking for the current one.
// If you want a "current password" challenge later, do supabase.auth.signInWithPassword
// first as a verification step.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (password.length > 200) {
    return NextResponse.json({ error: 'Password too long' }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
