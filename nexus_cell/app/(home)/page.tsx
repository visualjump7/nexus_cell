import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'
import PrincipalHome from './PrincipalHome'
import type { UserRole, Alert, Bill, Trip, TripSegment } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) redirect('/login')
  const orgId = membership.organization_id
  const role = membership.role as UserRole

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const fullName = profile?.full_name || user.email?.split('@')[0] || ''
  const firstName = fullName.split(' ')[0]

  // ── Principal gets a completely different home screen ──
  if (role === 'principal') {
    const today = new Date().toISOString().split('T')[0]

    const [approvalsRes, upcomingBillsRes, upcomingTripsRes] = await Promise.all([
      supabase.from('alerts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('alert_type', 'approval')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('bills')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['pending', 'approved', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(5),
      supabase.from('trips')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['confirmed', 'in_progress'])
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(3),
    ])

    // Get segments for upcoming trips
    const trips = (upcomingTripsRes.data || []) as Trip[]
    const tripsWithSegments: { trip: Trip; segments: TripSegment[] }[] = []
    for (const trip of trips) {
      const { data: segments } = await supabase
        .from('trip_segments')
        .select('*')
        .eq('trip_id', trip.id)
        .order('sort_order', { ascending: true })
        .limit(3)
      tripsWithSegments.push({ trip, segments: (segments || []) as TripSegment[] })
    }

    // Counts for the 3 contextual orbs
    const approvalCount = approvalsRes.data?.length || 0
    const billsDueCount = upcomingBillsRes.data?.length || 0
    const totalOutstanding = (upcomingBillsRes.data || []).reduce((sum, b) => sum + (b as Bill).amount, 0)
    const tripCount = trips.length

    return (
      <PrincipalHome
        firstName={firstName}
        approvals={(approvalsRes.data || []) as Alert[]}
        approvalCount={approvalCount}
        upcomingBills={(upcomingBillsRes.data || []) as Bill[]}
        billsDueCount={billsDueCount}
        totalOutstanding={totalOutstanding}
        upcomingTrips={tripsWithSegments}
        tripCount={tripCount}
      />
    )
  }

  // ── EA / CFO / Admin / Viewer get the full 7-module orb grid ──
  const [alertsCount, tasksCount] = await Promise.all([
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['todo', 'in_progress', 'waiting']),
  ])

  return (
    <HomeClient
      firstName={firstName}
      alertsCount={alertsCount.count || 0}
      tasksCount={tasksCount.count || 0}
    />
  )
}
