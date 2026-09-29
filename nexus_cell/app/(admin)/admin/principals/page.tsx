import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'

export default async function AdminPrincipalsPage() {
  const { supabase, orgId } = await getAuthContext()

  // Principals + whether each has a saved executive view config
  const [principalsRes, viewsRes] = await Promise.all([
    supabase
      .from('organization_members')
      .select('user_id, status, profiles(full_name, email)')
      .eq('organization_id', orgId)
      .eq('role', 'principal')
      .order('created_at', { ascending: false }),
    supabase
      .from('executive_views')
      .select('principal_user_id, updated_at')
      .eq('organization_id', orgId),
  ])

  const viewByPrincipal = new Map(
    (viewsRes.data || []).map(v => [v.principal_user_id, v.updated_at as string]),
  )

  const principals = (principalsRes.data || []).map(m => {
    const p = m.profiles as unknown as { full_name: string | null; email: string } | null
    return {
      user_id: m.user_id,
      status: m.status,
      full_name: p?.full_name || null,
      email: p?.email || null,
      configured_at: viewByPrincipal.get(m.user_id) || null,
    }
  })

  return (
    <div className="max-w-4xl">
      <header className="rp-head">
        <span className="rp-eyebrow">Administrator</span>
        <h1 className="rp-title">Owners</h1>
        <p className="rp-lede">
          Each owner sees a home view you curate. Click Configure to choose what shows up on their screen.
        </p>
      </header>

      {principals.length === 0 ? (
        <div className="rp-panel p-8 text-center">
          <p className="text-gray-400">No owners in this organization yet.</p>
          <p className="text-xs text-gray-600 mt-1">
            Create one in <Link href="/admin/users" className="text-[#CDA14B] hover:underline">Users</Link> with the Owner role.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 m-0 p-0 list-none">
          {principals.map(p => {
            const hasConfig = !!p.configured_at
            return (
              <li key={p.user_id} className="rp-panel p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.full_name || p.email}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.email}{p.status !== 'active' && <> · <span className="text-amber-400">{p.status}</span></>}
                  </p>
                  {hasConfig ? (
                    <p className="text-[11px] text-gray-600 mt-1">
                      View configured · last updated {new Date(p.configured_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-400/80 mt-1">No custom view yet — using defaults</p>
                  )}
                </div>
                <Link
                  href={`/admin/executive-views?principal=${p.user_id}`}
                  className="rp-btn-ghost shrink-0"
                >
                  Configure view
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
