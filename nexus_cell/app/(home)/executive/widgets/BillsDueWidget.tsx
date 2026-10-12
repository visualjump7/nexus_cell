import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import { RpList, RpRow, RpStatus, fmtMoney, fmtDate, dot } from '@/components/rp'
import type { Bill } from '@/lib/types'

interface Props {
  orgId: string
  settings?: { window?: 'today' | '7d' | '30d' }
}

const WINDOW_DAYS: Record<string, number> = { today: 0, '7d': 7, '30d': 30 }
const WINDOW_LABEL: Record<string, string> = { today: 'today', '7d': 'in the next 7 days', '30d': 'in the next 30 days' }

export default async function BillsDueWidget({ orgId, settings }: Props) {
  const window = (settings?.window as string) || '7d'
  const days = WINDOW_DAYS[window] ?? 7

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data } = await supabase
    .from('bills')
    .select('*')
    .eq('organization_id', orgId)
    .in('status', ['pending', 'approved', 'overdue'])
    .gte('due_date', today)
    .lte('due_date', cutoff)
    .order('due_date', { ascending: true })
    .limit(8)

  const bills = (data || []) as Bill[]
  const total = bills.reduce((sum, b) => sum + (b.amount || 0), 0)

  return (
    <WidgetCard
      title="Bills due"
      subtitle={`Due ${WINDOW_LABEL[window] || 'in the next 7 days'}`}
      trailing={
        bills.length > 0 ? (
          <span className="font-display text-[15px] font-medium leading-none tracking-[.02em] text-rp-text tabular-nums">
            {fmtMoney(total, { compact: true })}
          </span>
        ) : null
      }
    >
      {bills.length === 0 ? (
        <WidgetEmpty message="Nothing due in this window." />
      ) : (
        <RpList as="ul">
          {bills.map(b => (
            <RpRow
              key={b.id}
              as="li"
              title={b.vendor}
              meta={dot(b.due_date && `Due ${fmtDate(b.due_date, 'short')}`, b.category)}
              edge={b.status === 'overdue' ? 'alert' : undefined}
              aside={
                <>
                  <span className="text-[15px] tabular-nums text-rp-text">{fmtMoney(b.amount, { currency: b.currency || 'USD' })}</span>
                  <RpStatus kind="bill" value={b.status} />
                </>
              }
            />
          ))}
        </RpList>
      )}
    </WidgetCard>
  )
}
