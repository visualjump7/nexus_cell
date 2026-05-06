import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

const VALID_ROLES: UserRole[] = ['principal', 'ea', 'cfo', 'admin', 'viewer']

// GET /api/admin/invitations?status=pending|approved|rejected (default pending)
// EA sees their own; admin sees all in the org. RLS handles visibility.
export async function GET(request: Request) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  const { data, error } = await supabase
    .from('pending_invitations')
    .select('*, proposed_by_profile:profiles!pending_invitations_proposed_by_fkey(full_name, email)')
    .eq('organization_id', orgId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data || [] })
}

// POST /api/admin/invitations — propose a new user invite. EA or admin.
// Body: { email, full_name, role, notes? }
export async function POST(request: Request) {
  const { supabase, user, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const email = String(body?.email || '').trim().toLowerCase()
  const full_name = String(body?.full_name || '').trim()
  const proposedRole = body?.role as UserRole
  const notes = body?.notes ? String(body.notes).trim() : null

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!full_name) {
    return NextResponse.json({ error: 'Full name required' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(proposedRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pending_invitations')
    .insert({
      organization_id: orgId,
      proposed_by: user.id,
      email,
      full_name,
      role: proposedRole,
      notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    // Unique-index violation = already a pending invite for this email
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A pending invitation for this email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ invitation: data }, { status: 201 })
}
