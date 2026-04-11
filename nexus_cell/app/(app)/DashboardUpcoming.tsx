'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Alert, Trip, TripSegment, UserRole } from '@/lib/types'

interface Props {
  approvals: Alert[]
  nextTrip: { trip: Trip; segments: TripSegment[] } | null
  role: UserRole
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardUpcoming({ approvals, nextTrip, role }: Props) {
  const router = useRouter()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const canApprove = ['principal', 'ea', 'admin'].includes(role)

  async function handleApproval(alertId: string, decision: 'approved' | 'rejected') {
    setApprovingId(alertId)
    await fetch(`/api/alerts/${alertId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    setApprovingId(null)
    router.refresh()
  }

  const segmentIcons: Record<string, string> = {
    flight: '✈', hotel: '🏨', car: '🚗', train: '🚆', ground_transport: '🚐', other: '📍',
  }

  return (
    <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Upcoming</h3>

      {/* Pending Approvals */}
      {approvals.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Pending Approvals</p>
          <div className="space-y-2">
            {approvals.map(alert => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm text-white truncate">{alert.title}</p>
                  <p className="text-[11px] text-gray-500">{timeAgo(alert.created_at)}</p>
                </div>
                {canApprove && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApproval(alert.id, 'approved')}
                      disabled={approvingId === alert.id}
                      className="px-2.5 py-1 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white text-[11px] font-medium rounded-md transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(alert.id, 'rejected')}
                      disabled={approvingId === alert.id}
                      className="px-2.5 py-1 bg-red-500/80 hover:brightness-110 disabled:opacity-50 text-white text-[11px] font-medium rounded-md transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Trip */}
      {nextTrip ? (
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Next Trip</p>
          <Link href={`/travel/${nextTrip.trip.id}`} className="block hover:brightness-110 transition-all">
            <p className="text-white font-medium">{nextTrip.trip.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(nextTrip.trip.start_date)} → {formatDate(nextTrip.trip.end_date)}
            </p>
            {nextTrip.segments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {nextTrip.segments.slice(0, 3).map(seg => (
                  <div key={seg.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{segmentIcons[seg.segment_type] || '📍'}</span>
                    <span>{seg.from_location || '—'} → {seg.to_location || '—'}</span>
                    {seg.carrier && <span className="text-gray-600">· {seg.carrier}</span>}
                  </div>
                ))}
              </div>
            )}
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Next Trip</p>
          <p className="text-sm text-gray-600">No upcoming trips</p>
        </div>
      )}

      {/* View all link */}
      {(approvals.length > 0 || nextTrip) && (
        <div className="mt-4 pt-3 border-t border-white/5 flex gap-4">
          {approvals.length > 0 && <Link href="/alerts" className="text-xs text-emerald-400 hover:text-emerald-300">View all alerts →</Link>}
          {nextTrip && <Link href="/travel" className="text-xs text-emerald-400 hover:text-emerald-300">View all trips →</Link>}
        </div>
      )}
    </div>
  )
}
