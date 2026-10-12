import { getAuthContext } from '@/lib/auth'
import { RpPage, RpPageHeader, RpList, RpRow, RpTag, RpStatus, RpButton, RpEmpty, dot, fmtDate } from '@/components/rp'

export const metadata = { title: 'Owners' }

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
    <RpPage>
      <RpPageHeader
        eyebrow="03 · Owners"
        title="Owners"
        line="Each owner sees a home view you curate. Configure a view to choose what reaches their screen."
      />

      {principals.length === 0 ? (
        <RpEmpty
          title="No owner accounts yet."
          line="An owner (principal) needs an account before a view can be set up."
          action={<RpButton variant="ghost" href="/admin/users" arrow>Create one under Members</RpButton>}
        />
      ) : (
        <RpList>
          {principals.map((p, i) => {
            const hasConfig = !!p.configured_at
            return (
              <RpRow
                key={p.user_id}
                index={i + 1}
                title={p.full_name || p.email || 'Owner'}
                titleStyle="display"
                meta={dot(
                  p.email,
                  hasConfig ? `Updated ${fmtDate(p.configured_at!)}` : 'No custom view yet · the default widgets',
                )}
                aside={
                  <span className="flex flex-wrap items-center justify-end gap-2">
                    {p.status !== 'active' && <RpStatus kind="member" value={p.status} />}
                    {hasConfig ? <RpTag tone="green">Configured</RpTag> : <RpTag tone="gold">Defaults</RpTag>}
                    <RpButton variant="ghost" size="sm" href={`/admin/executive-views?principal=${p.user_id}`} arrow>
                      Configure view
                    </RpButton>
                  </span>
                }
              />
            )
          })}
        </RpList>
      )}
    </RpPage>
  )
}
