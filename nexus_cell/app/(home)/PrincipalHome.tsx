'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NexusOrb from '@/components/NexusOrb'
import AIDrawer from '@/components/AIDrawer'
import type { Alert, Bill, Trip, TripSegment } from '@/lib/types'

// ── Icons for the 3 contextual orbs ──
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  )
}

// ── Types ──
interface Props {
  firstName: string
  approvals: Alert[]
  approvalCount: number
  upcomingBills: Bill[]
  billsDueCount: number
  totalOutstanding: number
  upcomingTrips: { trip: Trip; segments: TripSegment[] }[]
  tripCount: number
}

const segmentIcons: Record<string, string> = {
  flight: '✈', hotel: '🏨', car: '🚗', train: '🚆', ground_transport: '🚐', other: '📍',
}

export default function PrincipalHome({
  firstName, approvals, approvalCount, upcomingBills, billsDueCount,
  totalOutstanding, upcomingTrips, tripCount,
}: Props) {
  const router = useRouter()
  const [aiOpen, setAiOpen] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const fmtCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleApproval(alertId: string, decision: 'approved' | 'rejected') {
    setApprovingId(alertId)
    await fetch(`/api/alerts/${alertId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    setApprovingId(null)
    setDismissedIds(prev => new Set(prev).add(alertId))
    router.refresh()
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

  // Merge bills and trips into a single "coming up" timeline sorted by date
  type TimelineItem =
    | { kind: 'bill'; bill: Bill; date: string }
    | { kind: 'trip'; trip: Trip; segments: TripSegment[]; date: string }

  const timeline: TimelineItem[] = []
  for (const b of upcomingBills) {
    if (b.due_date) timeline.push({ kind: 'bill', bill: b, date: b.due_date })
  }
  for (const t of upcomingTrips) {
    if (t.trip.start_date) timeline.push({ kind: 'trip', trip: t.trip, segments: t.segments, date: t.trip.start_date })
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const visibleApprovals = approvals.filter(a => !dismissedIds.has(a.id))

  return (
    <div className="min-h-screen flex flex-col items-center relative">
      {/* ── Greeting ── */}
      <div className="text-center mt-16 mb-8 animate-fade-in-up">
        <p className="text-xl text-gray-400">
          {greeting}, <span className="text-white font-medium">{firstName}</span>
        </p>
      </div>

      {/* ── Nexus Orb ── */}
      <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <NexusOrb size="large" onClick={() => setAiOpen(true)} />
      </div>

      {/* ── 3 Contextual Orbs ── */}
      <div className="flex items-center justify-center gap-12 mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <ContextOrb
          icon={<ShieldIcon className="w-6 h-6" />}
          label="Needs You"
          value={approvalCount.toString()}
          color="amber"
          active={approvalCount > 0}
        />
        <ContextOrb
          icon={<CalendarIcon className="w-6 h-6" />}
          label="Coming Up"
          value={`${tripCount} trip${tripCount !== 1 ? 's' : ''}`}
          color="purple"
          active={tripCount > 0}
        />
        <ContextOrb
          icon={<WalletIcon className="w-6 h-6" />}
          label="Money"
          value={fmtCurrency(totalOutstanding)}
          color="blue"
          active={billsDueCount > 0}
        />
      </div>

      {/* ── Content area ── */}
      <div className="w-full max-w-xl px-6 space-y-6 pb-16">
        {/* Pending Approvals */}
        {visibleApprovals.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Needs Your Decision</p>
            <div className="space-y-2">
              {visibleApprovals.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-card-dark rounded-xl p-4 transition-all duration-300 ${dismissedIds.has(alert.id) ? 'opacity-0 scale-95' : 'opacity-100'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{alert.title}</p>
                      {alert.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.body}</p>}
                      <p className="text-[11px] text-gray-600 mt-1.5">{timeAgo(alert.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproval(alert.id, 'approved')}
                        disabled={approvingId === alert.id}
                        className="px-3 py-1.5 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(alert.id, 'rejected')}
                        disabled={approvingId === alert.id}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-gray-300 text-xs font-medium rounded-lg transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming Up Timeline */}
        {timeline.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '550ms' }}>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Coming Up</p>
            <div className="space-y-2">
              {timeline.map((item, i) => (
                <div key={i} className="bg-card-dark rounded-xl p-4 flex items-start gap-3">
                  {item.kind === 'bill' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-blue-500/[0.12] flex items-center justify-center shrink-0 mt-0.5">
                        <WalletIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{item.bill.vendor}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.bill.description || item.bill.category || 'Payment'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-white font-mono">{fmtCurrency(item.bill.amount)}</p>
                        <p className={`text-[11px] mt-0.5 ${item.bill.status === 'overdue' ? 'text-red-400' : 'text-gray-500'}`}>
                          {item.bill.status === 'overdue' ? 'Overdue' : `Due ${fmtDate(item.bill.due_date)}`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-purple-500/[0.12] flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{item.trip.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fmtDate(item.trip.start_date)} → {fmtDate(item.trip.end_date)}
                        </p>
                        {item.segments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.segments.map(seg => (
                              <div key={seg.id} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <span>{segmentIcons[seg.segment_type] || '📍'}</span>
                                <span>{seg.from_location} → {seg.to_location}</span>
                                {seg.carrier && <span className="text-gray-700">· {seg.carrier}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All clear state */}
        {visibleApprovals.length === 0 && timeline.length === 0 && (
          <div className="text-center py-8 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">All clear. Nothing needs your attention.</p>
          </div>
        )}

        {/* Footer message */}
        <div className="text-center pt-4 animate-fade-in-up" style={{ animationDelay: '650ms' }}>
          <p className="text-xs text-gray-600">Your team is handling everything else.</p>
          <p className="text-[11px] text-gray-700 mt-1">Tap the Nexus orb to ask about anything.</p>
        </div>
      </div>

      {/* AI Drawer */}
      <AIDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

// ── Contextual Orb ──
function ContextOrb({ icon, label, value, color, active }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  active: boolean
}) {
  const colorMap: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
    amber:  { bg: 'bg-amber-500/[0.12]', border: 'border-amber-500/30', icon: 'text-amber-400', glow: 'shadow-amber-500/20' },
    purple: { bg: 'bg-purple-500/[0.12]', border: 'border-purple-500/30', icon: 'text-purple-400', glow: 'shadow-purple-500/20' },
    blue:   { bg: 'bg-blue-500/[0.12]', border: 'border-blue-500/30', icon: 'text-blue-400', glow: 'shadow-blue-500/20' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 rounded-full ${c.bg} border-[1.5px] ${c.border} flex items-center justify-center ${active ? `shadow-lg ${c.glow}` : ''}`}>
        <div className={`${c.icon}`}>{icon}</div>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-xs text-white font-medium">{value}</p>
      </div>
    </div>
  )
}
