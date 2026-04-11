import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const role = membership?.role || 'viewer'
  const org = membership?.organizations as { name: string } | null

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{org?.name || 'Dashboard'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Signed in as {user.email} · Role: {role}
          </p>
        </div>

        {role === 'principal' && <PrincipalDashboard />}
        {role === 'ea' && <EADashboard />}
        {role === 'cfo' && <CFODashboard />}
        {role === 'admin' && <EADashboard />}

        <div className="mt-8">
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-500 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PrincipalDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard title="Pending approvals" value="—" />
      <DashboardCard title="Upcoming travel" value="—" />
      <DashboardCard title="Open tasks" value="—" />
    </div>
  )
}

function EADashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard title="Pending bills" value="—" />
      <DashboardCard title="Open alerts" value="—" />
      <DashboardCard title="Active trips" value="—" />
      <DashboardCard title="Tasks assigned" value="—" />
      <DashboardCard title="Upcoming renewals" value="—" />
      <DashboardCard title="Active projects" value="—" />
    </div>
  )
}

function CFODashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard title="Bills pending" value="—" />
      <DashboardCard title="Bills paid (30d)" value="—" />
      <DashboardCard title="Total outstanding" value="—" />
    </div>
  )
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}
