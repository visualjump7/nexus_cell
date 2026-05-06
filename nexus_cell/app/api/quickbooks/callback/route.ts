import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import {
  QB_STATE_COOKIE,
  QB_ENV,
  exchangeCodeForTokens,
  computeExpiry,
  safeCompare,
} from '@/lib/quickbooks'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const code = sp.get('code')
  const stateParam = sp.get('state')
  const realmId = sp.get('realmId')
  const error = sp.get('error')

  const cookieStore = cookies()
  const stateCookie = cookieStore.get(QB_STATE_COOKIE)?.value

  // Always clear the state cookie — single use
  cookieStore.delete(QB_STATE_COOKIE)

  if (error) {
    redirect(`/financial?qb=error&reason=${encodeURIComponent(error)}`)
  }

  if (!code || !stateParam || !realmId) {
    redirect('/financial?qb=error&reason=missing_params')
  }

  if (!stateCookie || !safeCompare(stateCookie, stateParam)) {
    redirect('/financial?qb=error&reason=state_mismatch')
  }

  const { supabase, user, orgId, role } = await getAuthContext()

  if (!['ea', 'admin'].includes(role)) {
    redirect('/financial?qb=forbidden')
  }

  // Exchange code for tokens
  let tokens
  try {
    tokens = await exchangeCodeForTokens(code)
  } catch (e) {
    console.error('QB token exchange failed:', e)
    redirect('/financial?qb=error&reason=token_exchange_failed')
  }

  // Upsert connection row
  const { error: upsertError } = await supabase
    .from('quickbooks_connections')
    .upsert(
      {
        organization_id: orgId,
        realm_id: realmId,
        environment: QB_ENV,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        access_token_expires_at: computeExpiry(tokens.expires_in),
        refresh_token_expires_at: computeExpiry(tokens.x_refresh_token_expires_in),
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' },
    )

  if (upsertError) {
    console.error('QB connection upsert failed:', upsertError)
    redirect('/financial?qb=error&reason=db_write_failed')
  }

  redirect('/financial?qb=connected')
}
