import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { isConfigured, getAuthorizationUrl, randomState, QB_STATE_COOKIE } from '@/lib/quickbooks'

export async function GET() {
  const { role } = await getAuthContext()

  if (!['ea', 'admin'].includes(role)) {
    redirect('/financial?qb=forbidden')
  }

  if (!isConfigured()) {
    redirect('/financial?qb=not_configured')
  }

  const state = randomState()

  cookies().set(QB_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })

  redirect(getAuthorizationUrl(state))
}
