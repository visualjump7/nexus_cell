import { getAuthContext } from '@/lib/auth'
import { RpPage, RpPageHeader } from '@/components/rp'
import ExecutiveViewConfig from './ExecutiveViewConfig'

export const metadata = { title: 'Owner views' }

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
    <RpPage>
      <RpPageHeader
        eyebrow="04 · Owner views"
        title="Owner views"
        line="Choose what each owner sees on their home screen, in what order, and how it greets them."
      />
      <ExecutiveViewConfig principals={principals} initialPrincipalId={initialPrincipalId} />
    </RpPage>
  )
}
