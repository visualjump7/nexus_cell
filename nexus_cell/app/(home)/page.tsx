import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CommandLanding from './CommandLanding'
import ExecutiveView from './executive/ExecutiveView'
import type { UserRole } from '@/lib/types'
import type { SectionMetrics } from '@/lib/sections'
import {
  buildHeroGreeting,
  buildContextStrip,
  buildOpeningMessage,
  buildDynamicSuggestions,
  type JarvisContext,
} from '@/lib/ai-context'

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

  const { data: profile } = await supabase.from('profiles').select('full_name, hero_style').eq('id', user.id).single()
  const fullName = profile?.full_name || user.email?.split('@')[0] || ''
  const firstName = fullName.split(' ')[0]
  // Per-user hero preference. Defaults to 'orb' (matches the legacy look).
  const heroStyle = (profile?.hero_style as 'orb' | 'character') || 'orb'

  // ── Principal gets the EA-curated executive view ──
  if (role === 'principal') {
    return <ExecutiveView firstName={firstName} orgId={orgId} principalId={user.id} />
  }

  // ── EA / CFO / Admin / Viewer get the V8 command landing ──
  const today = new Date().toISOString().split('T')[0]

  const [
    approvalAlerts,    // alerts of type=approval, status=open (drives Jarvis context)
    openAlerts,        // all open alerts (drives the alerts section badge)
    tasksCount,
    projectsActive,
    nextTripRes,
    billsToday,
    billsOverdue,
    topPendingBill,
    recentBrief,
  ] = await Promise.all([
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('alert_type', 'approval').eq('status', 'open'),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['todo', 'in_progress', 'waiting']),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['planning', 'in_progress', 'on_hold']),
    supabase.from('trips').select('title, start_date').eq('organization_id', orgId).in('status', ['confirmed', 'in_progress']).gte('start_date', today).order('start_date', { ascending: true }).limit(1),
    supabase.from('bills').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('due_date', today).in('status', ['pending', 'approved', 'overdue']),
    supabase.from('bills').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'overdue'),
    supabase.from('bills').select('vendor, amount').eq('organization_id', orgId).eq('status', 'pending').order('amount', { ascending: false }).limit(1),
    supabase.from('briefs').select('title, brief_date').eq('organization_id', orgId).eq('status', 'published').order('brief_date', { ascending: false }).limit(1),
  ])

  const taskN = tasksCount.count || 0
  const alertN = openAlerts.count || 0
  const approvalN = approvalAlerts.count || 0
  const projectN = projectsActive.count || 0
  const billsTodayN = billsToday.count || 0
  const billsOverdueN = billsOverdue.count || 0

  // Travel hint: prefer "City · Day" if we can extract a city from the trip title;
  // otherwise show the formatted start date.
  let travelHint = 'No upcoming'
  let nextTripCity: string | null = null
  let nextTripDaysUntil: number | null = null
  const nextTripRow = nextTripRes.data?.[0]
  if (nextTripRow) {
    const start = new Date(nextTripRow.start_date + 'T00:00')
    const day = start.toLocaleDateString('en-US', { weekday: 'short' })
    // Heuristic: if title contains an em-dash or "to", grab the trailing piece as the destination
    const cityMatch = nextTripRow.title?.match(/(?:to|→|—)\s+([A-Za-z .]+)/i)
    const city = cityMatch?.[1]?.trim() || nextTripRow.title?.split(' ')[0] || 'Trip'
    travelHint = `${city} · ${day}`
    nextTripCity = city
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    nextTripDaysUntil = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const metrics: Record<string, SectionMetrics> = {
    projects: { hint: projectN > 0 ? `${projectN} active` : 'None active' },
    travel:   { hint: travelHint },
    calendar: { hint: billsTodayN > 0 ? `${billsTodayN} due today` : 'Today' },
    tasks:    { hint: taskN > 0 ? `${taskN} due` : 'All clear', badge: taskN },
    alerts:   { hint: 'Action req.', badge: alertN },
  }

  // ── Jarvis context — derived from the same data above ──
  const topPending = topPendingBill.data?.[0]
  const jarvisCtx: JarvisContext = {
    firstName: firstName || 'there',
    hour: new Date().getHours(),
    approvalsCount: approvalN,
    tasksDueCount: taskN,
    billsDueTodayCount: billsTodayN,
    billsOverdueCount: billsOverdueN,
    nextTrip: nextTripCity && nextTripDaysUntil !== null ? { city: nextTripCity, daysUntil: nextTripDaysUntil } : null,
    topApproval: approvalN > 0 && topPending
      ? { vendor: topPending.vendor, amount: topPending.amount }
      : null,
    recentBriefTitle: recentBrief.data?.[0]?.title || null,
  }

  const heroGreeting = buildHeroGreeting(jarvisCtx)
  const contextStrip = buildContextStrip(jarvisCtx)
  const openingMessage = buildOpeningMessage(jarvisCtx)
  const dynamicSuggestions = buildDynamicSuggestions(jarvisCtx)

  return (
    <CommandLanding
      metrics={metrics}
      heroGreeting={heroGreeting}
      contextStrip={contextStrip}
      openingMessage={openingMessage}
      dynamicSuggestions={dynamicSuggestions}
      heroStyle={heroStyle}
    />
  )
}
