import { getAuthContext } from '@/lib/auth'
import { getSiteMapData } from '@/lib/site-map-data'
import SiteMapTabs from '@/components/site-map/SiteMapTabs'

export const metadata = { title: 'Site map' }

export default async function SiteMapPage() {
  const { supabase, orgId, role } = await getAuthContext()
  const data = await getSiteMapData(supabase, orgId)

  // SiteMapTabs renders the whole page (RpPage + header + Map · Plans · Images · Models · Clubhouse).
  return <SiteMapTabs {...data} role={role} />
}
