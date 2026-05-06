import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// POST /api/admin/invitations/[id]/reject — admin rejects a pending invite.
// Marks status=rejected; the row stays for audit. Body: { reason? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, orgId, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const reason = body?.reason ? String(body.reason).trim() : null

  const { data, error } = await supabase
    .from('pending_invitations')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: reason ? `[Rejected] ${reason}` : undefined,
    })
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
