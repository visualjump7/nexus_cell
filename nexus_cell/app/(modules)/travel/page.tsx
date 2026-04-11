import { getAuthContext } from '@/lib/auth'
import TripsList from '@/app/(app)/travel/TripsList'

export default async function TravelPage() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('organization_id', orgId)
    .order('start_date', { ascending: false })

  return (
    <div>
      <TripsList trips={trips || []} role={role} />
    </div>
  )
}
