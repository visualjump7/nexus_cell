import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-nexus text-white">
      {children}
    </div>
  )
}
