import { createClient } from '@/utils/supabase/server'
import { BRAND } from '@/lib/brand'
import { DEFAULT_PRINCIPAL_WIDGETS, getWidgetEntry, type WidgetId } from '@/lib/widgets'
import { renderWidget } from './widgets/registry'
import type { WidgetConfig } from '@/lib/types'
import { buildOpeningMessage, buildPrincipalSuggestions, type JarvisContext } from '@/lib/ai-context'

interface Props {
  firstName: string
  orgId: string
  principalId: string
}

function timeOfDayGreeting(date: Date): string {
  const h = date.getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export default async function ExecutiveView({ firstName, orgId, principalId }: Props) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Load the EA-curated config + the data needed for Jarvis context in one round-trip.
  const [viewConfigRes, approvalAlertsRes, billsOverdueRes, billsTodayRes, nextTripRes, recentBriefRes, topPendingBillRes] = await Promise.all([
    supabase.from('executive_views').select('*').eq('organization_id', orgId).eq('principal_user_id', principalId).maybeSingle(),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('alert_type', 'approval').eq('status', 'open'),
    supabase.from('bills').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'overdue'),
    supabase.from('bills').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('due_date', today).in('status', ['pending', 'approved', 'overdue']),
    supabase.from('trips').select('title, start_date').eq('organization_id', orgId).in('status', ['confirmed', 'in_progress']).gte('start_date', today).order('start_date', { ascending: true }).limit(1),
    supabase.from('briefs').select('title').eq('organization_id', orgId).eq('status', 'published').eq('principal_visible', true).order('brief_date', { ascending: false }).limit(1),
    supabase.from('bills').select('vendor, amount').eq('organization_id', orgId).eq('status', 'pending').order('amount', { ascending: false }).limit(1),
  ])

  const viewConfig = viewConfigRes.data
  const widgets: WidgetConfig[] = (viewConfig?.widgets as WidgetConfig[]) || DEFAULT_PRINCIPAL_WIDGETS
  const greetingStyle = (viewConfig?.greeting_style as string) || 'time_of_day'
  const customGreeting = viewConfig?.custom_greeting as string | null

  let greeting: string | null = null
  if (greetingStyle === 'time_of_day') {
    greeting = `${timeOfDayGreeting(new Date())}, ${firstName}`
  } else if (greetingStyle === 'custom' && customGreeting) {
    greeting = customGreeting
  }

  // ── Jarvis context for the principal's AI Ask widget ──
  let nextTripCity: string | null = null
  let nextTripDaysUntil: number | null = null
  const nextTripRow = nextTripRes.data?.[0]
  if (nextTripRow) {
    const start = new Date(nextTripRow.start_date + 'T00:00')
    const cityMatch = nextTripRow.title?.match(/(?:to|→|—)\s+([A-Za-z .]+)/i)
    nextTripCity = cityMatch?.[1]?.trim() || nextTripRow.title?.split(' ')[0] || 'Trip'
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    nextTripDaysUntil = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const topPending = topPendingBillRes.data?.[0]
  const approvalsCount = approvalAlertsRes.count || 0
  const jarvisCtx: JarvisContext = {
    firstName: firstName || 'there',
    hour: new Date().getHours(),
    approvalsCount,
    tasksDueCount: 0, // principals don't see tasks
    billsDueTodayCount: billsTodayRes.count || 0,
    billsOverdueCount: billsOverdueRes.count || 0,
    nextTrip: nextTripCity && nextTripDaysUntil !== null ? { city: nextTripCity, daysUntil: nextTripDaysUntil } : null,
    topApproval: approvalsCount > 0 && topPending ? { vendor: topPending.vendor, amount: topPending.amount } : null,
    recentBriefTitle: recentBriefRes.data?.[0]?.title || null,
  }
  const aiOpeningMessage = buildOpeningMessage(jarvisCtx)
  const aiSuggestions = buildPrincipalSuggestions(jarvisCtx)

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: 'var(--nx-bg)', color: 'var(--nx-text)', fontFamily: 'var(--font-body), system-ui, sans-serif', isolation: 'isolate' }}
    >
      {/* Quiet pine silhouettes behind the greeting */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--hero" />

      {/* Top bar — brand only, no nav. The principal can't navigate. */}
      <header className="flex items-center" style={{ padding: '20px 32px' }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.badge} alt={BRAND.fullName} className="h-[38px] w-auto" />
          <span className="flex flex-col" style={{ lineHeight: 1.15 }}>
            <span
              className="uppercase font-display"
              style={{ fontSize: 15, letterSpacing: '0.12em', color: 'var(--rp-text)' }}
            >
              Roaring Pines
            </span>
            <span
              className="uppercase"
              style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--rp-muted)' }}
            >
              Motor Club
            </span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 pb-16">
        {greeting && (
          <div className="mt-6 mb-8 flex flex-col gap-2.5">
            <span className="rp-eyebrow">Owner&apos;s view</span>
            <h1 className="rp-title m-0">{greeting}</h1>
          </div>
        )}

        <div className="space-y-4">
          {widgets.map((w, i) => {
            const entry = getWidgetEntry(w.widget_id)
            if (!entry) return null // skip removed widgets gracefully
            const node = renderWidget(w.widget_id as WidgetId, {
              orgId,
              principalUserId: principalId,
              settings: w.settings,
              jarvis: { openingMessage: aiOpeningMessage, suggestions: aiSuggestions },
            })
            if (!node) return null
            return <div key={`${w.widget_id}-${i}`}>{node}</div>
          })}
        </div>
      </div>
    </main>
  )
}
