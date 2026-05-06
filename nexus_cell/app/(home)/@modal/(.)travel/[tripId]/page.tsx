import { getAuthContext } from '@/lib/auth'
import { notFound } from 'next/navigation'
import TripDetail from '@/app/(app)/travel/[tripId]/TripDetail'
import SectionOverlay from '@/components/shared/SectionOverlay'

export default async function TripDetailOverlay({ params }: { params: { tripId: string } }) {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: trip } = await supabase.from('trips').select('*').eq('id', params.tripId).eq('organization_id', orgId).single()
  if (!trip) notFound()

  const [{ data: segments }, { data: docs }] = await Promise.all([
    supabase.from('trip_segments').select('*').eq('trip_id', trip.id).order('sort_order', { ascending: true }),
    supabase.from('travel_docs').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false }),
  ])

  return (
    <SectionOverlay title={trip.title || 'Trip'} fullPageHref={`/travel/${trip.id}`}>
      <TripDetail trip={trip} segments={segments || []} docs={docs || []} role={role} />
    </SectionOverlay>
  )
}
