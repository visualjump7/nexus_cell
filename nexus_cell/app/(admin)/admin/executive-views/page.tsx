import { getAuthContext } from '@/lib/auth'
import ExecutiveViewConfig from './ExecutiveViewConfig'

export default async function ExecutiveViewSettingsPage({
  searchParams,
}: {
  searchParams: { principal?: string }
}) {
  const { supabase, orgId } = await getAuthContext()

  // Load principals server-side so the config UI has them on first paint
  const { data: principalRows } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .eq('role', 'principal')

  const principals = (principalRows || []).map(m => {
    const p = m.profiles as unknown as { full_name: string | null; email: string } | null
    return {
      user_id: m.user_id,
      name: p?.full_name || p?.email || m.user_id,
      email: p?.email || null,
    }
  })

  // Honor ?principal=<id> from the principals page so the right one is preselected
  const initialPrincipalId = searchParams?.principal && principals.some(p => p.user_id === searchParams.principal)
    ? searchParams.principal
    : undefined

  return (
    <div className="max-w-5xl">
      <header className="rp-head">
        <span className="rp-eyebrow">Administrator</span>
        <h1 className="rp-title">Owner views</h1>
        <p className="rp-lede">
          Choose what each owner sees on their home screen.
        </p>
      </header>
      <ExecutiveViewConfig principals={principals} initialPrincipalId={initialPrincipalId} />
    </div>
  )
}
