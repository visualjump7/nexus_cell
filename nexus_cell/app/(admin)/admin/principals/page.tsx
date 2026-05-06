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
      <h1 className="text-2xl font-semibold text-slate-200 mb-1">Principals</h1>
      <p className="text-sm text-gray-500 mb-6">
        Each principal sees an executive view you curate. Click Configure to choose what shows up on their command screen.
      </p>

      {principals.length === 0 ? (
        <div className="bg-card-dark rounded-xl p-8 text-center">
          <p className="text-gray-400">No principals in this organization yet.</p>
          <p className="text-xs text-gray-600 mt-1">
            Create one in <Link href="/admin/users" className="text-emerald-400 hover:underline">Users</Link> with the Principal role.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 m-0 p-0 list-none">
          {principals.map(p => {
            const hasConfig = !!p.configured_at
            return (
              <li key={p.user_id} className="bg-card-dark rounded-xl p-4 flex items-center gap-4 border border-white/[0.04]">
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
                  className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium rounded-lg transition-colors shrink-0"
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
