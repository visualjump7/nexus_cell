import { createClient } from '@/utils/supabase/server'
import WidgetCard from './WidgetCard'
import { fmtMoney } from '@/components/rp'
import { cn } from '@/lib/utils'

interface Props {
  orgId: string
}

export default async function GlanceWidget({ orgId }: Props) {
  const supabase = createClient()

  const [outstanding, alerts, trips] = await Promise.all([
    supabase.from('bills').select('amount').eq('organization_id', orgId).in('status', ['pending', 'approved', 'overdue']),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('alert_type', 'approval').eq('status', 'open'),
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['confirmed', 'in_progress']),
  ])

  const totalOutstanding = (outstanding.data || []).reduce((sum, b) => sum + (b.amount || 0), 0)
  const approvalsCount = alerts.count || 0
  const tripsCount = trips.count || 0

  const stats = [
    { label: 'Outstanding', value: fmtMoney(totalOutstanding, { compact: true }), sub: 'Bills not yet paid' },
    { label: 'Sign-offs', value: String(approvalsCount), sub: 'Waiting on you' },
    { label: 'Site visits', value: String(tripsCount), sub: 'Confirmed or underway' },
  ]

  return (
    <WidgetCard title="At a glance">
      {/* Three figures under one rule, split by hairlines (no box inside the cell) */}
      <dl className="m-0 grid grid-cols-3 border-t border-rp-line">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('flex min-w-0 flex-col gap-2.5 px-4 pt-4', i === 0 ? 'pl-0' : 'border-l border-rp-line')}>
            <dt className="rp-stat-label">{s.label}</dt>
            <dd className="rp-stat-value m-0 text-rp-text">{s.value}</dd>
            <dd className="rp-stat-sub m-0 max-sm:hidden">{s.sub}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  )
}
