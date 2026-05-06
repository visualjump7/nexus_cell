import { getAuthContext } from '@/lib/auth'
import LifestyleTabs from '@/app/(app)/lifestyle/LifestyleTabs'
import SectionOverlay from '@/components/shared/SectionOverlay'

export default async function LifestyleOverlay() {
  const { supabase, orgId, role } = await getAuthContext()

  const [giftsRes, subsRes, memsRes] = await Promise.all([
    supabase.from('gifts').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').eq('organization_id', orgId).order('next_renewal', { ascending: true }),
    supabase.from('memberships').select('*').eq('organization_id', orgId).order('expiry_date', { ascending: true }),
  ])

  return (
    <SectionOverlay title="Lifestyle" fullPageHref="/lifestyle">
      <LifestyleTabs gifts={giftsRes.data || []} subscriptions={subsRes.data || []} memberships={memsRes.data || []} role={role} />
    </SectionOverlay>
  )
}
