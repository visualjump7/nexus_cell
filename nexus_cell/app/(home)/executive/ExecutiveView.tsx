import { createClient } from '@/utils/supabase/server'
import { DEFAULT_PRINCIPAL_WIDGETS, getWidgetEntry, type WidgetId } from '@/lib/widgets'
import { renderWidget } from './widgets/registry'
import type { WidgetConfig } from '@/lib/types'
import { buildOpeningMessage, type JarvisContext } from '@/lib/ai-context'
import { RpPage, RpPageHeader, RpFilm, fmtDate, dot } from '@/components/rp'
import { SECTION_HERO } from '@/lib/project-imagery'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

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

// Widgets that always take the full width of the grid.
const WIDE: ReadonlySet<string> = new Set(['ai_ask'])
// Sign-offs go full width once there are enough of them to make a tall cell
// (a half-width column of approvals left the cell beside it mostly empty).
const APPROVALS_WIDE_AT = 3

const HERO = SECTION_HERO.overview

/**
 * The owner's view: the concept's opening panel for the principal. Eyebrow,
 * the greeting as the title, today's date as the line, then the widgets the
 * owner's rep chose, numbered in a ruled two-up grid (Ask Nexus across the
 * top, sign-offs straight after), and the aerial of the whole club to close.
 */
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

  const rendered = widgets.flatMap((w, i) => {
    const entry = getWidgetEntry(w.widget_id)
    if (!entry) return [] // skip removed widgets gracefully
    const node = renderWidget(w.widget_id as WidgetId, {
      orgId,
      principalUserId: principalId,
      settings: w.settings,
      jarvis: { openingMessage: aiOpeningMessage },
    })
    if (!node) return []
    const wide = WIDE.has(w.widget_id) || (w.widget_id === 'approvals' && approvalsCount >= APPROVALS_WIDE_AT)
    return [{ key: `${w.widget_id}-${i}`, node, wide }]
  })

  // Two-up runs between full-width cells: an odd run would leave its last
  // cell alone beside an empty half row, so that cell spans the row instead.
  let run: typeof rendered = []
  const closeRun = () => {
    if (run.length % 2 === 1) run[run.length - 1].wide = true
    run = []
  }
  for (const cell of rendered) {
    if (cell.wide) closeRun()
    else run.push(cell)
  }
  closeRun()

  const cells = rendered.map(cell => (
    <div
      key={cell.key}
      className={cn('min-w-0 [counter-increment:widget]', cell.wide && '[grid-column:1/-1]')}
    >
      {cell.node}
    </div>
  ))

  return (
    <RpPage>
      {/* The widgets carry the 01, 02… numbers, so the eyebrow is unnumbered. */}
      <RpPageHeader
        eyebrow="Owner's view"
        title={greeting || 'Where the build stands'}
        line={`${fmtDate(today, 'weekday')} · here is what needs you`}
      />

      {/* Ruled grid: two-up from 1024px, one column below; numbered by a CSS counter */}
      <div
        className="rp-ruled [counter-reset:widget]"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(max(min(100%, 360px), calc((100% - 1px) / 2)), 1fr))' }}
      >
        {cells}
      </div>

      {/* The aerial closes the page: what needs the owner comes first. */}
      <RpFilm
        src={HERO.src}
        alt={HERO.alt ?? 'Aerial render of the whole Roaring Pines property'}
        line={`${BRAND.site.acres} acres in the pines`}
        meta={dot('State Road 100', 'Palatka, Florida', 'under construction')}
        objectPosition="center 46%"
        caption="The whole club in the pines · circuit, paddock and lakes"
        className="[&_.rp-frame]:aspect-[3/1] max-sm:[&_.rp-frame]:aspect-[16/10]"
      />
    </RpPage>
  )
}
