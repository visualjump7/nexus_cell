import { getAuthContext } from '@/lib/auth'
import Link from 'next/link'
import DashboardCharts from '@/app/(app)/DashboardCharts'
import DashboardActivity from '@/app/(app)/DashboardActivity'
import DashboardUpcoming from '@/app/(app)/DashboardUpcoming'
import type { Alert, Trip, TripSegment } from '@/lib/types'
import { BRAND } from '@/lib/brand'

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
      <header className="rp-head !mb-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--head" />
        <span className="rp-eyebrow">{BRAND.fullName}</span>
        <h1 className="rp-title">Dashboard</h1>
        <p className="rp-lede">Where the build stands today.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/financial"><StatCard dot="bg-[#CDA14B]" label="Outstanding" value={fmtCurrency(totalOutstanding)} /></Link>
        <Link href="/alerts"><StatCard dot="bg-[#3989CB]" label="Awaiting sign-off" value={(approvalAlerts.count || 0).toString()} /></Link>
        <Link href="/travel"><StatCard dot="bg-[#A4CC5C]" label="Site visits" value={(tripsActive.count || 0).toString()} /></Link>
        <Link href="/tasks"><StatCard dot="bg-[#9AA0A4]" label="Open items" value={(tasksOpen.count || 0).toString()} /></Link>
      </div>

      <DashboardCharts categoryData={categoryData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardActivity items={activity.slice(0, 10)} />
        <DashboardUpcoming approvals={(pendingApprovals.data || []) as Alert[]} nextTrip={nextTrip} role={role} />
      </div>

      <figure className="m-0">
        <div className="rp-frame aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/demo/plans/masterplan-v5.jpg" alt="Roaring Pines masterplan v5" className="w-full h-full object-cover" />
        </div>
        <figcaption className="flex items-center justify-between gap-3 mt-2.5">
          <span className="rp-caption"><span className="rp-num">01</span> Masterplan v5 · site layout</span>
          <span className="rp-tag rp-tag--accent">Interactive map soon</span>
        </figcaption>
      </figure>
    </div>
  )
}

function StatCard({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="rp-panel p-5 hover:border-[#3A3E42] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 ${dot}`} />
        <p className="rp-eyebrow--muted">{label}</p>
      </div>
      <p className="rp-stat-value">{value}</p>
    </div>
  )
}
