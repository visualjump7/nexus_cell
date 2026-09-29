import { getAuthContext } from '@/lib/auth'
import SettingsTabs from './SettingsTabs'

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
    <div className="max-w-2xl">
      <header className="rp-head">
        <span className="rp-eyebrow">Account</span>
        <h1 className="rp-title">Settings</h1>
        <p className="rp-lede">Manage your profile and password.</p>
      </header>
      <SettingsTabs
        initialFullName={profile?.full_name || ''}
        email={profile?.email || user.email || ''}
        canSuggestUsers={canSuggestUsers}
        initialHeroStyle={heroStyle}
      />
    </div>
  )
}
