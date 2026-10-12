'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert } from '@/lib/types'
import { RpList, RpRow, RpButton, RpPriority, timeAgo } from '@/components/rp'

interface Props {
  approvals: Alert[]
}

export default function ApprovalsList({ approvals }: Props) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function decide(alertId: string, decision: 'approved' | 'rejected') {
    setPendingId(alertId)
    try {
      const res = await fetch(`/api/alerts/${alertId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <RpList as="ul">
      {approvals.map((alert, i) => {
        const busy = pendingId === alert.id
        return (
          <RpRow
            key={alert.id}
            as="li"
            index={i + 1}
            title={alert.title}
            edge={alert.priority === 'urgent' ? 'alert' : alert.priority === 'high' ? 'gold' : undefined}
            aside={alert.priority === 'high' || alert.priority === 'urgent' ? <RpPriority value={alert.priority} withLabel /> : undefined}
            meta={
              <>
                <span suppressHydrationWarning>Requested {timeAgo(alert.created_at)}</span>
                {alert.body && <span className="mt-1 line-clamp-2 block">{alert.body}</span>}
                <span className="mt-3 flex flex-wrap gap-2">
                  <RpButton size="sm" onClick={() => decide(alert.id, 'approved')} disabled={busy}>
                    Approve
                  </RpButton>
                  <RpButton variant="danger" size="sm" onClick={() => decide(alert.id, 'rejected')} disabled={busy}>
                    Reject
                  </RpButton>
                </span>
              </>
            }
          />
        )
      })}
    </RpList>
  )
}
