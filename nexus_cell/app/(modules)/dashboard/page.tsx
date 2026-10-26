import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import DashboardCharts from '@/app/(app)/DashboardCharts'
import DashboardActivity from '@/app/(app)/DashboardActivity'
import DashboardUpcoming from '@/app/(app)/DashboardUpcoming'
import type { Alert, Trip, TripSegment } from '@/lib/types'
import {
  RpPage, RpPageHeader, RpStatStrip, RpStat, RpSubhead, RpTable, RpMeter, RpGroup, RpGroupHead,
  RpList, RpRow, RpFigure, RpSource, RpButton, RpEmpty, RpTag, RpLoopPlayer, RpLoopLink,
  fmtMoney, fmtPct, fmtDate, dot, pad2, statusLabel,
} from '@/components/rp'
import { SECTION_HERO } from '@/lib/project-imagery'
import { DASHBOARD_LOOPS, DASHBOARD_LOOPS_AS_OF, DEFAULT_LOOP, LOOP_ANCHOR, LOOP_PARAM, watchLoop } from '@/lib/dashboard-loops'
import { sectionEyebrow } from '@/lib/sections'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type ProjectRow = { id: string; name: string; status: string | null; project_type: string | null }
type BudgetRow = { project_id: string; budgeted: number | string | null; actual: number | string | null }
type BillRow = { category: string | null; amount: number | string | null; status: string; paid_date: string | null }

/** "Land Acquisition, Title & ALTA Survey" → "Land Acquisition" (for the tight stat sub-line). */
function shortName(name: string) {
  return name.split(/,|—| – /)[0].trim()
}

export default async function DashboardPage() {
  const { supabase, orgId, role } = await getAuthContext()
  const today = new Date().toISOString().split('T')[0]

  const [
    billsOutstanding, approvalAlerts, tripsActive, tasksOpen,
    recentBills, recentAlerts, recentTasks,
    pendingApprovals, nextTripRes, allBills, projectsRes,
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
    supabase.from('bills').select('category, amount, status, paid_date').eq('organization_id', orgId).in('status', ['pending', 'approved', 'paid', 'overdue']),
    supabase.from('projects').select('id, name, status, project_type').eq('organization_id', orgId),
  ])

  // Budgets carry no organization_id: fetch by the org's project ids (same pattern as lib/site-map-data.ts).
  const projects = (projectsRes.data || []) as ProjectRow[]
  const projectIds = projects.map(p => p.id)
  const nextTripRow = nextTripRes.data && nextTripRes.data.length > 0 ? (nextTripRes.data[0] as Trip) : null

  const [budgetsRes, segmentsRes] = await Promise.all([
    projectIds.length
      ? supabase.from('budgets').select('project_id, budgeted, actual').in('project_id', projectIds)
      : Promise.resolve({ data: [] as BudgetRow[] }),
    nextTripRow
      ? supabase.from('trip_segments').select('*').eq('trip_id', nextTripRow.id).order('sort_order', { ascending: true }).limit(3)
      : Promise.resolve({ data: [] as TripSegment[] }),
  ])

  // ── Payables ──
  const totalOutstanding = (billsOutstanding.data || []).reduce((sum, b) => sum + (b.amount || 0), 0)

  // ── Program (projects + budgets) ──
  const spend = new Map<string, { budgeted: number; actual: number }>()
  for (const b of (budgetsRes.data || []) as BudgetRow[]) {
    const cur = spend.get(b.project_id) || { budgeted: 0, actual: 0 }
    cur.budgeted += Number(b.budgeted) || 0
    cur.actual += Number(b.actual) || 0
    spend.set(b.project_id, cur)
  }
  const program = projects.map(p => ({
    ...p,
    budgeted: spend.get(p.id)?.budgeted || 0,
    actual: spend.get(p.id)?.actual || 0,
  }))
  const totalBudget = program.reduce((s, p) => s + p.budgeted, 0)
  const totalSpent = program.reduce((s, p) => s + p.actual, 0)
  const spentRatio = totalBudget > 0 ? totalSpent / totalBudget : null
  const overBudget = program
    .filter(p => p.budgeted > 0 && p.actual > p.budgeted)
    .sort((a, b) => (b.actual - b.budgeted) - (a.actual - a.budgeted))
  const inBuild = program.filter(p => p.status === 'active').length
  const complete = program.filter(p => p.status === 'completed').length
  const onHold = program.filter(p => p.status === 'on_hold').length

  const typeMap = new Map<string, { count: number; budgeted: number; actual: number }>()
  for (const p of program) {
    const key = p.project_type?.trim() || 'Unassigned'
    const cur = typeMap.get(key) || { count: 0, budgeted: 0, actual: 0 }
    cur.count += 1
    cur.budgeted += p.budgeted
    cur.actual += p.actual
    typeMap.set(key, cur)
  }
  const byType = Array.from(typeMap.entries())
    .map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => b.budgeted - a.budgeted || a.type.localeCompare(b.type))

  // ── Bills: where the money goes + draws by month ──
  const bills = (allBills.data || []) as BillRow[]
  const catMap = new Map<string, number>()
  for (const b of bills) {
    const key = b.category || 'Other'
    catMap.set(key, (catMap.get(key) || 0) + (Number(b.amount) || 0))
  }
  const categories = Array.from(catMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const billedTotal = Array.from(catMap.values()).reduce((s, v) => s + v, 0)

  // Last 12 months, oldest first, ending with the current month.
  const now = new Date()
  const months: { key: string; m: string; label: string; v: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, m: MONTHS_SHORT[d.getMonth()], label: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, v: 0 })
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]))
  for (const b of bills) {
    if (b.status !== 'paid' || !b.paid_date) continue
    const i = monthIndex.get(b.paid_date.slice(0, 7))
    if (i != null) months[i].v += Number(b.amount) || 0
  }
  const drawsLast12 = months.reduce((s, m) => s + m.v, 0)

  // ── Activity ──
  type ActivityItem = { type: 'bill' | 'alert' | 'task'; title: string; description: string; timestamp: string }
  const activity: ActivityItem[] = []
  for (const b of (recentBills.data || [])) {
    const amt = fmtMoney(b.amount, { currency: b.currency || 'USD' })
    activity.push({ type: 'bill', title: `${b.status === 'paid' ? 'Payment made' : 'Bill entered'} · ${amt}`, description: b.vendor, timestamp: b.created_at })
  }
  for (const a of (recentAlerts.data || [])) {
    activity.push({ type: 'alert', title: a.title, description: dot(statusLabel('alertType', a.alert_type), statusLabel('alertStatus', a.status)), timestamp: a.created_at })
  }
  for (const t of (recentTasks.data || [])) {
    activity.push({ type: 'task', title: t.title, description: t.status === 'done' ? 'Completed' : statusLabel('task', t.status), timestamp: t.completed_at || t.created_at })
  }
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const nextTrip: { trip: Trip; segments: TripSegment[] } | null = nextTripRow
    ? { trip: nextTripRow, segments: (segmentsRes.data || []) as TripSegment[] }
    : null

  const pkg = (n: number) => (n === 1 ? 'package' : 'packages')
  const unit = (s: string) => <span className="ml-1.5 text-[.5em] tracking-[.1em] text-rp-muted">{s}</span>

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('dashboard')}
        title="Where the build stands"
        line={dot(
          `As of ${fmtDate(today, 'long')}`,
          totalBudget > 0 && `${fmtMoney(totalBudget, { compact: true })} program`,
          spentRatio != null && `${fmtPct(spentRatio)} spent`,
        )}
      />

      {/* The build in motion: the four data loops. ?loop=<id> picks one; each
          summary below links here with a quiet "Watch". */}
      <RpGroup id={LOOP_ANCHOR}>
        <RpGroupHead
          title="The build in motion"
          as="h2"
          line={dot(`${DASHBOARD_LOOPS.length} loops`, '12 seconds each', `figures as of ${fmtDate(DASHBOARD_LOOPS_AS_OF, 'long')}`)}
        />
        <RpLoopPlayer items={DASHBOARD_LOOPS} param={LOOP_PARAM} defaultId={DEFAULT_LOOP} ariaLabel="Choose a loop" />
      </RpGroup>

      {/* Program strip */}
      <section className="flex flex-col gap-3" aria-label="Program">
        <RpGroupHead num={1} title="The program" as="h2" aside={<RpLoopLink {...watchLoop('program')} />} />
        <RpStatStrip cols={5}>
          <RpStat
            label="Program budget"
            value={fmtMoney(totalBudget, { compact: true })}
            sub={dot(`${program.length} ${pkg(program.length)}`, `${byType.length} types`)}
          />
          <RpStat
            label="Spent to date"
            value={fmtMoney(totalSpent, { compact: true })}
            sub={spentRatio != null ? `${fmtPct(spentRatio)} of budget` : 'No budgets loaded'}
            meter={{ value: spentRatio ?? 0 }}
          />
          <RpStat
            label="Remaining"
            value={fmtMoney(totalBudget - totalSpent, { compact: true })}
            sub={spentRatio != null ? `${fmtPct(1 - spentRatio)} still to draw` : undefined}
          />
          <RpStat
            label="Over budget"
            value={<>{overBudget.length}{unit(pkg(overBudget.length))}</>}
            tone={overBudget.length ? 'alert' : 'default'}
            sub={overBudget.length
              ? <span className="line-clamp-2" title={overBudget.map(p => p.name).join(' · ')}>{overBudget.map(p => shortName(p.name)).join(' · ')}</span>
              : 'Every package inside its budget'}
          />
          <RpStat
            label="In build"
            value={inBuild}
            sub={dot(`${complete} complete`, `${onHold} on hold`)}
          />
        </RpStatStrip>
      </section>

      {/* Payables strip */}
      <section className="flex flex-col gap-3" aria-label="Payables">
        <RpGroupHead num={2} title="Payables and open items" as="h2" />
        <RpStatStrip cols={4}>
          <RpStat index={1} label="Outstanding" value={fmtMoney(totalOutstanding, { compact: true })} sub="Pending, approved and overdue bills" href="/financial" />
          <RpStat index={2} label="Awaiting sign-off" value={approvalAlerts.count || 0} sub="Open approvals" href="/alerts" />
          <RpStat index={3} label="Site visits" value={tripsActive.count || 0} sub="Planned or under way" href="/travel" />
          <RpStat index={4} label="Open items" value={tasksOpen.count || 0} sub="To do, in progress or waiting" href="/tasks" />
        </RpStatStrip>
      </section>

      <DashboardCharts
        months={months.map(({ m, label, v }) => ({ m, label, v }))}
        drawsTotal={drawsLast12}
        categories={categories}
        billedTotal={billedTotal}
      />

      {/* Program by package type */}
      <section className="flex flex-col gap-5">
        <RpSubhead
          num={3}
          title="Program by package type"
          spec={dot(`${byType.length} types`, `${program.length} ${pkg(program.length)}`, totalBudget > 0 && `${fmtMoney(totalBudget, { compact: true })} budgeted`)}
          aside={<><RpLoopLink {...watchLoop('packages')} /><RpButton variant="text" arrow href="/projects">All packages</RpButton></>}
        />
        {byType.length === 0 ? (
          <RpEmpty compact title="No packages yet." line="Packages appear here once projects and budgets are loaded." />
        ) : (
          // Below 640px: Type · Budget · Spent (% under it); the index, count and meter drop out.
          <RpTable minWidth={720} caption="Program by package type" className="max-sm:[&_table]:!min-w-0">
            <thead>
              <tr>
                <th className="idx hidden sm:table-cell">#</th>
                <th>Type</th>
                <th className="num hidden sm:table-cell">Packages</th>
                <th className="num">Budget</th>
                <th className="num">Spent</th>
                <th className="hidden sm:table-cell" style={{ width: 200 }}>Spent of budget</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((t, i) => {
                const ratio = t.budgeted > 0 ? t.actual / t.budgeted : 0
                const over = t.budgeted > 0 && t.actual > t.budgeted
                return (
                  <tr key={t.type}>
                    <td className="idx hidden sm:table-cell">{pad2(i + 1)}</td>
                    <td>
                      <Link href="/projects">{t.type}</Link>
                      <span className="sub sm:!hidden">{t.count} {pkg(t.count)}</span>
                    </td>
                    <td className="num hidden sm:table-cell">{t.count}</td>
                    <td className="num">{fmtMoney(t.budgeted)}</td>
                    <td className={over ? 'num text-rp-alert' : 'num'}>
                      {fmtMoney(t.actual)}
                      <span className={`sub sm:!hidden ${over ? '!text-rp-alert' : ''}`}>{t.budgeted > 0 ? fmtPct(ratio) : '—'}</span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="flex h-[22px] items-center gap-3">
                        <RpMeter value={ratio} tone={over ? 'alert' : 'gold'} label={`${t.type} spend`} className="flex-1" />
                        <span className={`w-10 shrink-0 text-right text-[13px] tabular-nums ${over ? 'text-rp-alert' : 'text-rp-muted'}`}>
                          {t.budgeted > 0 ? fmtPct(ratio) : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="hidden sm:table-cell" />
                <td>Program</td>
                <td className="num hidden sm:table-cell">{program.length}</td>
                <td className="num">{fmtMoney(totalBudget)}</td>
                <td className="num">
                  {fmtMoney(totalSpent)}
                  <span className="sub sm:!hidden">{spentRatio != null ? fmtPct(spentRatio) : '—'}</span>
                </td>
                <td className="hidden text-right tabular-nums sm:table-cell">{spentRatio != null ? fmtPct(spentRatio) : '—'}</td>
              </tr>
            </tfoot>
          </RpTable>
        )}
      </section>

      {/* Over budget · Waiting on you */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-12 border-t border-rp-line pt-6 lg:grid-cols-2">
        <div className="min-w-0">
        <RpGroup>
          <RpGroupHead
            num={4}
            title="Over budget"
            tag={overBudget.length > 0 ? <RpTag tone="alert">{overBudget.length} {pkg(overBudget.length)}</RpTag> : undefined}
            aside={<><RpLoopLink {...watchLoop('packages')} /><RpButton variant="text" arrow href="/projects">Projects</RpButton></>}
          />
          {overBudget.length === 0 ? (
            <RpEmpty compact title="Nothing over budget." line="Every package is drawing inside its budget." />
          ) : (
            <RpList>
              {overBudget.map((p, i) => {
                const variance = p.actual - p.budgeted
                const ratio = p.actual / p.budgeted
                return (
                  <RpRow
                    key={p.id}
                    index={i + 1}
                    href={`/projects/${p.id}`}
                    title={p.name}
                    edge="alert"
                    meta={
                      <span className="flex flex-col gap-2.5">
                        <span className="text-rp-alert">{dot(`${fmtMoney(variance, { compact: true, sign: true })} over`, `${fmtPct(ratio)} of budget`)}</span>
                        <RpMeter value={ratio} tone="alert" size={2} label={`${p.name} spend`} />
                      </span>
                    }
                    aside={<span className="font-display text-[15px] tracking-[.04em] tabular-nums text-rp-text">{fmtMoney(p.actual, { compact: true })}</span>}
                  />
                )
              })}
            </RpList>
          )}
        </RpGroup>
        </div>

        <div className="min-w-0">
          <DashboardUpcoming approvals={(pendingApprovals.data || []) as Alert[]} nextTrip={nextTrip} role={role} num={5} />
        </div>
      </div>

      <DashboardActivity items={activity.slice(0, 10)} num={7} />

      {/* The site */}
      <section className="flex flex-col gap-5">
        <RpSubhead
          num={8}
          title="The site"
          spec={dot('443 acres', 'State Road 100', 'Palatka, Florida')}
          aside={<RpButton variant="text" arrow href="/site-map">Open the site map</RpButton>}
        />
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <RpFigure
              src="/demo/plans/masterplan-v5.jpg"
              alt="Roaring Pines masterplan V5"
              aspect="masterplan"
              num={1}
              caption="Masterplan V5 · architectural site plan"
              provenance="As issued"
            />
            <RpSource tag="As issued">CUBE 3 Studio · Sheet A-80a · Draft, not for construction</RpSource>
          </div>
          <RpFigure {...SECTION_HERO.overview} aspect="site" num={2} />
        </div>
      </section>
    </RpPage>
  )
}
