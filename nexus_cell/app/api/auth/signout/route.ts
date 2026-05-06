import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/auth/signout — invalidates the Supabase session. Returns JSON
// (not a redirect) so client-side fetch callers can decide where to go next.
// HamburgerMenu calls this then router.push('/login').
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
