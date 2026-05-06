import { getAuthContext } from '@/lib/auth'
import AlertsList from '@/app/(app)/alerts/AlertsList'
import SectionOverlay from '@/components/shared/SectionOverlay'

export default async function AlertsOverlay() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <SectionOverlay title="Alerts" fullPageHref="/alerts">
      <AlertsList alerts={alerts || []} role={role} />
    </SectionOverlay>
  )
}
