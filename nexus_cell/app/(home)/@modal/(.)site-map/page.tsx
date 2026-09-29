import { getAuthContext } from '@/lib/auth'
import { getSiteMapData } from '@/lib/site-map-data'
import SiteMapTabs from '@/components/site-map/SiteMapTabs'
import SectionOverlay from '@/components/shared/SectionOverlay'

// Intercepted /site-map route — renders inside the (home) @modal slot when the
// user soft-navigates from "/". Cold-loads of /site-map still hit the
// standalone (modules)/site-map/page.tsx with full chrome.
export default async function SiteMapOverlay() {
  const { supabase, orgId, role } = await getAuthContext()
  const data = await getSiteMapData(supabase, orgId)

  return (
    <SectionOverlay title="Site Map" fullPageHref="/site-map">
      <SiteMapTabs {...data} role={role} />
    </SectionOverlay>
  )
}
