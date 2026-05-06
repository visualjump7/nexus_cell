import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import ExecutiveView from '@/app/(home)/executive/ExecutiveView'

// Renders the saved ExecutiveView for a given principal as the EA would see it.
// Used by the Preview-as-principal modal in the config UI. EA/admin only.
// Lives outside (modules) so the principal-view chrome (no nav, brand-only top
// bar) renders pristinely without inheriting NexusCorner/FloatingAdd.
export default async function ExecutiveViewPreviewPage({
  params,
}: {
  params: { principalId: string }
}) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) redirect('/')

  // Confirm the target user is actually a principal in this org
  const { data: target } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .eq('user_id', params.principalId)
    .eq('status', 'active')
    .single()

  if (!target || target.role !== 'principal') notFound()

  const profile = target.profiles as unknown as { full_name: string | null; email: string } | null
  const fullName = profile?.full_name || profile?.email || 'Principal'
  const firstName = fullName.split(' ')[0]

  return <ExecutiveView firstName={firstName} orgId={orgId} principalId={params.principalId} />
}
