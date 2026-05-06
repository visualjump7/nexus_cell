import { createClient as createSbClient } from '@supabase/supabase-js'

// Service-role client for admin operations that need to bypass RLS:
//   - Creating auth users with createUser({ email, password })
//   - Resetting another user's password via updateUserById
//   - Deactivating users
//
// SERVER-ONLY. Never import this from a client component.
//
// Caller must independently verify the requester is an admin in the target
// org before calling this — RLS does not gate it.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Service role client misconfigured (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)')
  }
  return createSbClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
