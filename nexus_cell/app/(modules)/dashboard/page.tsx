import { getAuthContext } from '@/lib/auth'
import Link from 'next/link'
import DashboardCharts from '@/app/(app)/DashboardCharts'
import DashboardActivity from '@/app/(app)/DashboardActivity'
import DashboardUpcoming from '@/app/(app)/DashboardUpcoming'
import type { Alert, Trip, TripSegment } from '@/lib/types'

export default async function DashboardPage() {
  const { supabase, orgId, role } = await getAuthContext()
  const today = new Date().toISOString().split('T')[0]

  const [
    billsOutstanding, approvalAlerts, tripsActive, tasksOpen,
    recentBills, recentAlerts, recentTasks,
    pendingApprovals, nextTripRes, allBills,
  ] = await Promise.all([
    supabase.from('bills').select('amount').eq('organization_id', orgId).in('status', ['pending', 'approved', 'overdue']),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('alert_type', 'approval').eq('status', 'open'),
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['planning', 'confirmed', 'in_progress']),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['todo', 'in_progress', 'waiting']),
    supabase.from('bills').select('id, vendor, amount, status, currency, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('alerts').select('id, title, alert_type, status, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('id, title, status, completed_at, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('alerts').select('*').eq('organization_id', orgId).eq('alert_type', 'approval').eq('status', 'open').order('created_at', { ascending: false }).limit(3),
    supabase.from('trips').select('*').eq('organization_id', orgId).in('status', ['confirmed', 'in_progress']).gte('start_date', today).order('start_date', { ascending: true }).limit(1),
    supabase.from('bills').select('category, amount').eq('organization_id', orgId).in('status', ['pending', 'approved', 'paid', 'overdue']),
  ])

  const totalOutstanding = (billsOutstanding.data || []).reduce((sum, b) => sum + (b.amount || 0), 0)

  type ActivityItem = { type: 'bill' | 'alert' | 'task'; title: string; description: string; timestamp: string }
  const activity: ActivityItem[] = []
  for (const b of (recentBills.data || [])) {
    const amt = new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency || 'USD' }).format(b.amount)
    activity.push({ type: 'bill', title: `${b.status === 'paid' ? 'Payment made' : 'Bill created'} — ${amt}`, description: b.vendor, timestamp: b.created_at })
  }
  for (const a of (recentAlerts.data || [])) {
    activity.push({ type: 'alert', title: a.title, description: `${a.alert_type.replace('_', ' ')} · ${a.status}`, timestamp: a.created_at })
  }
  for (const t of (recentTasks.data || [])) {
    activity.push({ type: 'task', title: t.title, description: t.status === 'done' ? 'Completed' : t.status.replace('_', ' '), timestamp: t.completed_at || t.created_at })
  }
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const catMap = new Map<string, number>()
  for (const b of (allBills.data || [])) { catMap.set(b.category || 'Other', (catMap.get(b.category || 'Other') || 0) + b.amount) }
  const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  let nextTrip: { trip: Trip; segments: TripSegment[] } | null = null
  if (nextTripRes.data && nextTripRes.data.length > 0) {
    const trip = nextTripRes.data[0] as Trip
    const { data: segments } = await supabase.from('trip_segments').select('*').eq('trip_id', trip.id).order('sort_order', { ascending: true }).limit(3)
    nextTrip = { trip, segments: (segments || []) as TripSegment[] }
  }

  const fmtCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-200">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/financial"><StatCard dot="bg-emerald-400" label="Total Outstanding" value={fmtCurrency(totalOutstanding)} /></Link>
        <Link href="/alerts"><StatCard dot="bg-blue-400" label="Pending Approvals" value={(approvalAlerts.count || 0).toString()} /></Link>
        <Link href="/travel"><StatCard dot="bg-purple-400" label="Active Trips" value={(tripsActive.count || 0).toString()} /></Link>
        <Link href="/tasks"><StatCard dot="bg-amber-400" label="Open Tasks" value={(tasksOpen.count || 0).toString()} /></Link>
      </div>

      <DashboardCharts categoryData={categoryData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardActivity items={activity.slice(0, 10)} />
        <DashboardUpcoming approvals={(pendingApprovals.data || []) as Alert[]} nextTrip={nextTrip} role={role} />
      </div>

      <div className="bg-card-dark rounded-xl shadow-lg shadow-black/20 aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Map View</p>
          <p className="text-xs text-gray-600 mt-0.5">Coming Soon</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="bg-card-dark rounded-xl shadow-lg shadow-black/20 p-5 hover:brightness-110 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
