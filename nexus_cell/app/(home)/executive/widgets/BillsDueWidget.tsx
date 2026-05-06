import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import type { Bill } from '@/lib/types'

interface Props {
  orgId: string
  settings?: { window?: 'today' | '7d' | '30d' }
}

const WINDOW_DAYS: Record<string, number> = { today: 0, '7d': 7, '30d': 30 }
const WINDOW_LABEL: Record<string, string> = { today: 'today', '7d': 'in the next 7 days', '30d': 'in the next 30 days' }

function fmtCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
      title="Bills Due"
      subtitle={`Due ${WINDOW_LABEL[window] || 'in the next 7 days'}`}
      trailing={bills.length > 0 ? <span className="text-xs text-gray-400">{fmtCurrency(total)}</span> : null}
    >
      {bills.length === 0 ? (
        <WidgetEmpty message="Nothing due in this window." />
      ) : (
        <ul className="space-y-2 m-0 p-0 list-none">
          {bills.map(b => (
            <li key={b.id} className="flex items-center gap-3 py-1">
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white truncate">{b.vendor}</span>
                <span className="block text-xs text-gray-500">
                  {fmtDate(b.due_date)}{b.category ? ` · ${b.category}` : ''}
                </span>
              </span>
              <span className="text-sm font-mono text-gray-200 shrink-0">{fmtCurrency(b.amount, b.currency || 'USD')}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
