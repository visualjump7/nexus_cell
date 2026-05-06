import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HamburgerMount from '@/components/shared/HamburgerMount'

export default async function HomeLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  // Parallel-route slot for intercepted section overlays. When a section is
  // soft-navigated from the landing (e.g. /travel), the matching @modal/(.)…
  // route renders into this slot on top of `children`.
  modal: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-nexus text-white">
      {children}
      {modal}
      <HamburgerMount />
    </div>
  )
}
