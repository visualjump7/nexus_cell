'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const typeColors: Record<string, string> = {
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  action_required: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  approval: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  fyi: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-500', normal: 'text-gray-400', high: 'text-orange-400', urgent: 'text-red-400',
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  acknowledged: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  expired: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

interface Props { alerts: Alert[]; role: UserRole; userId?: string }

export default function AlertsList({ alerts, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const canApprove = ['principal', 'ea', 'admin'].includes(role)

  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const filtered = alerts.filter(a => {
    if (typeFilter !== 'all' && a.alert_type !== typeFilter) return false
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false
    return true
  })

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

  async function handleDelete() {
    if (!deletingAlert) return
    await fetch(`/api/alerts/${deletingAlert.id}`, { method: 'DELETE' })
    setDeletingAlert(null)
    router.refresh()
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Alert
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="info">Info</option>
          <option value="action_required">Action Required</option>
          <option value="approval">Approval</option>
          <option value="urgent">Urgent</option>
          <option value="fyi">FYI</option>
        </select>
        <select className={selectClass} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No alerts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={alert.id} className={`bg-card rounded-xl shadow-lg shadow-black/20 p-5 ${alert.priority === 'urgent' ? 'border-red-500/20' : 'border-white/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${typeColors[alert.alert_type] || ''}`}>
                      {alert.alert_type.replace('_', ' ')}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[alert.status] || ''}`}>
                      {alert.status}
                    </span>
                    <span className={`text-xs ${priorityColors[alert.priority]}`}>{alert.priority} priority</span>
                  </div>
                  <h3 className="text-white font-medium mt-2">{alert.title}</h3>
                  {alert.body && <p className="text-sm text-gray-400 mt-1">{alert.body}</p>}
                  <p className="text-xs text-gray-600 mt-2">{timeAgo(alert.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Approval buttons for approval-type alerts that are still open */}
                  {canApprove && alert.alert_type === 'approval' && alert.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleApproval(alert.id, 'approved')}
                        disabled={approvingId === alert.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(alert.id, 'rejected')}
                        disabled={approvingId === alert.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {canWrite && (
                    <button onClick={() => setDeletingAlert(alert)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <AlertFormModal onClose={() => setShowForm(false)} inputClass={inputClass} />}
      {deletingAlert && <DeleteConfirm itemName={deletingAlert.title} onConfirm={handleDelete} onCancel={() => setDeletingAlert(null)} />}
    </div>
  )
}

function AlertFormModal({ onClose, inputClass }: { onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', body: '', alert_type: 'info', priority: 'normal', target_role: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, body: form.body || null, target_role: form.target_role || null }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }
    router.refresh()
    onClose()
  }

  const labelClass = 'block text-sm text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">New Alert</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Invoice requires approval" required />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Additional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.alert_type} onChange={e => setForm(p => ({ ...p, alert_type: e.target.value as typeof p.alert_type }))}>
                <option value="info">Info</option>
                <option value="action_required">Action Required</option>
                <option value="approval">Approval</option>
                <option value="urgent">Urgent</option>
                <option value="fyi">FYI</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select className={inputClass} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof p.priority }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Target Role</label>
            <select className={inputClass} value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}>
              <option value="">All</option>
              <option value="principal">Principal</option>
              <option value="ea">EA</option>
              <option value="cfo">CFO</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Sending...' : 'Send Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
