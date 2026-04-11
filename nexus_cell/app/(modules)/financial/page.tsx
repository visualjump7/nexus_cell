import { getAuthContext } from '@/lib/auth'
import CashFlowView from '@/app/(app)/cash-flow/CashFlowView'

export default async function FinancialPage() {
  const { supabase, orgId, role } = await getAuthContext()

  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const allBills = bills || []
  const totalOutstanding = allBills.filter(b => ['pending', 'approved', 'overdue'].includes(b.status)).reduce((sum, b) => sum + b.amount, 0)
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const paidThisMonth = allBills.filter(b => b.status === 'paid' && b.paid_date && b.paid_date >= firstOfMonth).length
  const overdue = allBills.filter(b => b.status === 'overdue').length

  return (
    <div>
      <CashFlowView bills={allBills} role={role} stats={{ totalOutstanding, paidThisMonth, overdue }} />
    </div>
  )
}
