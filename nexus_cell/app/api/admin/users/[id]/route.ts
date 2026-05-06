import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import type { UserRole } from '@/lib/types'

const VALID_ROLES: UserRole[] = ['principal', 'ea', 'cfo', 'admin', 'viewer']

// PATCH /api/admin/users/[id] — update role and/or status (active / inactive).
// Admin only. Caller cannot change their own role.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, orgId, role: callerRole } = await getAuthContext()
  if (callerRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (params.id === user.id) {
    return NextResponse.json({ error: "You can't change your own role or status" }, { status: 400 })
  }

  const body = await request.json()
  const updates: { role?: UserRole; status?: string } = {}

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    updates.role = body.role
  }
  if (body.status !== undefined) {
    if (!['active', 'inactive'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('organization_members')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('user_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
