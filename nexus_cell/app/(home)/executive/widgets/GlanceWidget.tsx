import { createClient } from '@/utils/supabase/server'
import WidgetCard from './WidgetCard'

interface Props {
  orgId: string
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
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
    { label: 'Outstanding', value: fmtCurrency(totalOutstanding), dot: 'bg-[#CDA14B]' },
    { label: 'Approvals', value: approvalsCount.toString(), dot: 'bg-[#3989CB]' },
    { label: 'Site visits', value: tripsCount.toString(), dot: 'bg-[#A4CC5C]' },
  ]

  return (
    <WidgetCard title="Quick Glance">
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-1.5 h-1.5 ${s.dot}`} />
              <p className="rp-eyebrow--muted">{s.label}</p>
            </div>
            <p className="rp-stat-value text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
