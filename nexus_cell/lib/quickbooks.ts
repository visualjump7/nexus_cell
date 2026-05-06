import crypto from 'crypto'

// ── Constants ──
export const QB_OAUTH_AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2'
export const QB_OAUTH_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens'
export const QB_OAUTH_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'
export const QB_SCOPES = 'com.intuit.quickbooks.accounting'
export const QB_STATE_COOKIE = 'qb_oauth_state'

export const QB_ENV = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

// ── Types ──
export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // seconds until access_token expires (~3600)
  x_refresh_token_expires_in: number // seconds until refresh_token expires (~8726400 / 101 days)
  token_type: string
}

// ── Configuration ──
export function isConfigured(): boolean {
  return !!process.env.QUICKBOOKS_CLIENT_ID && !!process.env.QUICKBOOKS_CLIENT_SECRET
}

export function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${base}/api/quickbooks/callback`
}

// ── OAuth URL builder ──
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID!,
    scope: QB_SCOPES,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    state,
  })
  return `${QB_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

// ── Token exchange ──
function basicAuthHeader(): string {
  const creds = `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  return `Basic ${Buffer.from(creds).toString('base64')}`
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
  })

  const res = await fetch(QB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QB token exchange failed: ${res.status} ${text}`)
  }

  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(QB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QB token refresh failed: ${res.status} ${text}`)
  }

  return res.json()
}

// ── Helpers ──
export function computeExpiry(expiresInSec: number): string {
  return new Date(Date.now() + expiresInSec * 1000).toISOString()
}

export function randomState(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Constant-time string compare for CSRF state validation
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}
