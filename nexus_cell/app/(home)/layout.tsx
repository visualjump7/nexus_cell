import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/shared/AppShell'

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
    <>
      <AppShell footNav={false}>{children}</AppShell>
      {modal}
    </>
  )
}
