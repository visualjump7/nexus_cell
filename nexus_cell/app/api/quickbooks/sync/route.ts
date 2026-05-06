import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

export async function POST() {
  const { supabase, orgId } = await getAuthContext()

  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ error: 'not_connected' }, { status: 400 })
  }

  // Phase 2: implement bill pull/push logic here
  return NextResponse.json(
    {
      status: 'not_implemented',
      message: 'QuickBooks sync is coming soon. Your connection is established — bill push/pull arrives in phase 2.',
    },
    { status: 501 },
  )
}
