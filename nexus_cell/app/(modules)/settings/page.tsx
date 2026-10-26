import { getAuthContext } from '@/lib/auth'
import { RpPage, RpPageHeader } from '@/components/rp'
import SettingsTabs from './SettingsTabs'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const { supabase, user, role } = await getAuthContext()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, hero_style')
    .eq('id', user.id)
    .single()

  // EAs (and admins, for symmetry) get an extra "Suggest user" tab so they can
  // propose new accounts without entering the admin section.
  const canSuggestUsers = ['ea', 'admin'].includes(role)

  const heroStyle = (profile?.hero_style as 'orb' | 'character') || 'orb'

  return (
    <RpPage>
      <RpPageHeader
        eyebrow="Account"
        title="Your account"
        line="Profile, password and the look of Ask the team on your home screen."
      />
      <SettingsTabs
        initialFullName={profile?.full_name || ''}
        email={profile?.email || user.email || ''}
        canSuggestUsers={canSuggestUsers}
        initialHeroStyle={heroStyle}
      />
    </RpPage>
  )
}
