import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// GET /api/executive-views/principals
// Lists all principals in the EA's organization so the config UI can offer
// a "configure for which principal?" dropdown.
export async function GET() {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .eq('role', 'principal')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const principals = (data || []).map(m => {
    const p = m.profiles as unknown as { full_name: string | null; email: string } | null
    return {
      user_id: m.user_id,
      name: p?.full_name || p?.email || m.user_id,
      email: p?.email || null,
    }
  })

  return NextResponse.json({ principals })
}
