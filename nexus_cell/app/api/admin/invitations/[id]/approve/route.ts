import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/admin'

// POST /api/admin/invitations/[id]/approve — admin approves a pending invite.
// Body: { password } — admin sets the password and relays it to the new user.
// Creates the auth user, profile, and org member rows in one shot, then marks
// the invitation as approved.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user: adminUser, orgId, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const password = String(body?.password || '')
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load the invitation (RLS lets admin read all org invites)
  const { data: invite, error: inviteErr } = await admin
    .from('pending_invitations')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .single()
  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 })
  }

  // Create auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: invite.full_name },
  })
  if (createErr || !created?.user) {
    return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 })
  }
  const newUserId = created.user.id

  // Create profile
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: newUserId, email: invite.email, full_name: invite.full_name }, { onConflict: 'id' })
  if (profileErr) {
    await admin.auth.admin.deleteUser(newUserId).catch(() => null)
    return NextResponse.json({ error: `Profile create failed: ${profileErr.message}` }, { status: 500 })
  }

  // Create org member row
  const { error: memberErr } = await admin
    .from('organization_members')
    .insert({ organization_id: orgId, user_id: newUserId, role: invite.role, status: 'active' })
  if (memberErr) {
    await admin.auth.admin.deleteUser(newUserId).catch(() => null)
    return NextResponse.json({ error: `Membership create failed: ${memberErr.message}` }, { status: 500 })
  }

  // Mark invitation as approved
  await admin
    .from('pending_invitations')
    .update({
      status: 'approved',
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  return NextResponse.json({
    user_id: newUserId,
    email: invite.email,
    full_name: invite.full_name,
    role: invite.role,
  }, { status: 201 })
}
