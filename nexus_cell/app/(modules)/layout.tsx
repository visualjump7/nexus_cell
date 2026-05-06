import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NexusCorner from '@/components/NexusCorner'
import FloatingAdd from '@/components/shared/FloatingAdd'
import HamburgerMount from '@/components/shared/HamburgerMount'
import type { UserRole } from '@/lib/types'

export default async function ModulesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const role = (membership?.role || 'viewer') as UserRole
  const canWrite = ['ea', 'admin'].includes(role)

  return (
    <div className="min-h-screen bg-nexus text-white">
      <NexusCorner />
      <main className="pl-20 pr-6 pt-8 pb-8">
        {children}
      </main>
      {canWrite && <FloatingAdd />}
      <HamburgerMount />
    </div>
  )
}
