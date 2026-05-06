import { getAuthContext } from '@/lib/auth'
import CashFlowView from '@/app/(app)/cash-flow/CashFlowView'
import SectionOverlay from '@/components/shared/SectionOverlay'
import { isConfigured as qbIsConfigured } from '@/lib/quickbooks'
import type { QuickBooksConnection } from '@/lib/types'

export default async function FinancialOverlay() {
  const { supabase, orgId, role } = await getAuthContext()

  const [billsRes, qbRes] = await Promise.all([
    supabase.from('bills').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('quickbooks_connections').select('*').eq('organization_id', orgId).maybeSingle(),
  ])

  const allBills = billsRes.data || []
  const totalOutstanding = allBills.filter(b => ['pending', 'approved', 'overdue'].includes(b.status)).reduce((sum, b) => sum + b.amount, 0)
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const paidThisMonth = allBills.filter(b => b.status === 'paid' && b.paid_date && b.paid_date >= firstOfMonth).length
  const overdue = allBills.filter(b => b.status === 'overdue').length

  return (
    <SectionOverlay title="Financial" fullPageHref="/financial">
      <CashFlowView
        bills={allBills}
        role={role}
        stats={{ totalOutstanding, paidThisMonth, overdue }}
        qbConnection={qbRes.data as QuickBooksConnection | null}
        qbConfigured={qbIsConfigured()}
      />
    </SectionOverlay>
  )
}
