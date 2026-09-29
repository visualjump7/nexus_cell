'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert } from '@/lib/types'

interface Props {
  approvals: Alert[]
}

const priorityRing: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  normal: 'border-l-transparent',
  low: 'border-l-transparent',
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
    <ul className="space-y-3 m-0 p-0 list-none">
      {approvals.map(alert => (
        <li
          key={alert.id}
          className={`border-l-[3px] pl-3 ${priorityRing[alert.priority] || 'border-l-transparent'}`}
        >
          <p className="text-sm text-white font-medium leading-tight">{alert.title}</p>
          {alert.body && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{alert.body}</p>}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => decide(alert.id, 'approved')}
              disabled={pendingId === alert.id}
              className="rp-btn-solid"
            >
              Approve
            </button>
            <button
              onClick={() => decide(alert.id, 'rejected')}
              disabled={pendingId === alert.id}
              className="rp-btn-ghost disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
