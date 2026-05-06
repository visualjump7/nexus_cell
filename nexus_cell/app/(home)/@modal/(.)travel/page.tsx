import { getAuthContext } from '@/lib/auth'
import TripsList from '@/app/(app)/travel/TripsList'
import SectionOverlay from '@/components/shared/SectionOverlay'

// Intercepted /travel route — renders inside the (home) @modal slot when the
// user soft-navigates from "/". Cold-loads of /travel still hit the
// standalone (modules)/travel/page.tsx with full chrome.
export default async function TravelOverlay() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('organization_id', orgId)
    .order('start_date', { ascending: false })

  return (
    <SectionOverlay title="Travel" fullPageHref="/travel">
      <TripsList trips={trips || []} role={role} />
    </SectionOverlay>
  )
}
