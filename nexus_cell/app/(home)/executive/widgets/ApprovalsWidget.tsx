import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import ApprovalsList from './ApprovalsList'
import type { Alert } from '@/lib/types'

interface Props {
  orgId: string
}

export default async function ApprovalsWidget({ orgId }: Props) {
  const supabase = createClient()
  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('alert_type', 'approval')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5)

  const approvals = (data || []) as Alert[]

  return (
    <WidgetCard title="Pending Approvals" subtitle={approvals.length === 0 ? 'All clear' : `${approvals.length} waiting`}>
      {approvals.length === 0 ? (
        <WidgetEmpty message="Nothing needs your attention right now." />
      ) : (
        <ApprovalsList approvals={approvals} />
      )}
    </WidgetCard>
  )
}
