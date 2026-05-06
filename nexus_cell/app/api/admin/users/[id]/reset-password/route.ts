import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/admin'

// POST /api/admin/users/[id]/reset-password — admin sets a new password for
// any user in their org. Returns ok; admin relays the new password to the
// user out-of-band. Used when a principal forgets their password.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { orgId, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const password = String(body?.password || '')
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the target user is in the caller's org
  const { data: target } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', params.id)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not in your organization' }, { status: 404 })

  const { error } = await admin.auth.admin.updateUserById(params.id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
