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
      <h1 className="text-2xl font-semibold text-slate-200 mb-1">Executive views</h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose what each principal sees on their command screen.
      </p>
      <ExecutiveViewConfig principals={principals} initialPrincipalId={initialPrincipalId} />
    </div>
  )
}
