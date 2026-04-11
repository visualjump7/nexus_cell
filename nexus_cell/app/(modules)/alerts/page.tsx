import { getAuthContext } from '@/lib/auth'
import AlertsList from '@/app/(app)/alerts/AlertsList'

export default async function AlertsPage() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <AlertsList alerts={alerts || []} role={role} />
    </div>
  )
}
