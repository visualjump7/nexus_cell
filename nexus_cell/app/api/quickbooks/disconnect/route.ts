import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

export async function POST() {
  const { supabase, orgId, role } = await getAuthContext()

  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // TODO(phase-2): call Intuit revoke endpoint before deleting the row
  // https://developer.api.intuit.com/v2/oauth2/tokens/revoke

  const { error } = await supabase
    .from('quickbooks_connections')
    .delete()
    .eq('organization_id', orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
