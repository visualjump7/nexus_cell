import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NexusCorner from '@/components/NexusCorner'

export default async function ModulesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-nexus text-white">
      <NexusCorner />
      <main className="pl-16 pr-6 pt-6 pb-8">
        {children}
      </main>
    </div>
  )
}
