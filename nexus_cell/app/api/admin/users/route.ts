import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import type { UserRole } from '@/lib/types'

const VALID_ROLES: UserRole[] = ['principal', 'ea', 'cfo', 'admin', 'viewer']

// GET /api/admin/users — list active members of the org with profiles.
export async function GET() {
  const { supabase, orgId, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role, status, created_at, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = (data || []).map(m => {
    const p = m.profiles as unknown as { full_name: string | null; email: string } | null
    return {
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      created_at: m.created_at,
      full_name: p?.full_name || null,
      email: p?.email || null,
    }
  })

  return NextResponse.json({ users })
}

// POST /api/admin/users — directly create a user (admin only). Bypasses
// email confirmation. Admin relays credentials to the new user manually.
// Body: { email, password, full_name, role }
export async function POST(request: Request) {
  const { orgId, role: callerRole } = await getAuthContext()
  if (callerRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const full_name = String(body?.full_name || '').trim()
  const role = body?.role as UserRole

  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (!full_name) return NextResponse.json({ error: 'Full name required' }, { status: 400 })
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const admin = createAdminClient()

  // 1. Create the auth user (no email confirmation since admin owns the flow)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (createErr || !created?.user) {
    return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 })
  }
  const newUserId = created.user.id

  // 2. Insert the profile row (some setups have a trigger that does this; if
  // it ran, the upsert below is a no-op for the existing fields).
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: newUserId, email, full_name }, { onConflict: 'id' })
  if (profileErr) {
    // Roll back the auth user so we don't leave orphans
    await admin.auth.admin.deleteUser(newUserId).catch(() => null)
    return NextResponse.json({ error: `Profile create failed: ${profileErr.message}` }, { status: 500 })
  }

  // 3. Insert the org member row
  const { error: memberErr } = await admin
    .from('organization_members')
    .insert({ organization_id: orgId, user_id: newUserId, role, status: 'active' })
  if (memberErr) {
    await admin.auth.admin.deleteUser(newUserId).catch(() => null)
    return NextResponse.json({ error: `Membership create failed: ${memberErr.message}` }, { status: 500 })
  }

  return NextResponse.json({
    user_id: newUserId,
    email,
    full_name,
    role,
  }, { status: 201 })
}
