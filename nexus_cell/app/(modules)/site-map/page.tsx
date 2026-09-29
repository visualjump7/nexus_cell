import { getAuthContext } from '@/lib/auth'
import { getSiteMapData } from '@/lib/site-map-data'
import SiteMapTabs from '@/components/site-map/SiteMapTabs'

export default async function SiteMapPage() {
  const { supabase, orgId, role } = await getAuthContext()
  const data = await getSiteMapData(supabase, orgId)

  return (
    <div>
      <SiteMapTabs {...data} role={role} />
    </div>
  )
}
