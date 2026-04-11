'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subscription, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paused: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

interface Props { subscriptions: Subscription[]; role: UserRole }

export default function SubscriptionsList({ subscriptions, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null)

  const filtered = subscriptions.filter(s => statusFilter === 'all' || s.status === statusFilter)

  function formatCurrency(amt: number | null, currency: string) {
    if (!amt) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function isUpcoming(d: string | null) {
    if (!d) return false
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 30 * 86400000
  }

  async function handleDelete() {
    if (!deletingSub) return
    await fetch(`/api/subscriptions/${deletingSub.id}`, { method: 'DELETE' })
    setDeletingSub(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} subscription{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingSub(null); setShowForm(true) }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Subscription
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No subscriptions found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Next Renewal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{sub.name}</p>
                    {sub.category && <p className="text-xs text-gray-500">{sub.category}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{sub.provider || '—'}</td>
                  <td className="px-4 py-3 text-white font-mono">{formatCurrency(sub.amount, sub.currency)}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{sub.frequency}</td>
                  <td className="px-4 py-3">
                    <span className={isUpcoming(sub.next_renewal) ? 'text-amber-400' : 'text-gray-400'}>
                      {formatDate(sub.next_renewal)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[sub.status] || ''}`}>{sub.status}</span>
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditingSub(sub); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeletingSub(sub)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <SubFormModal sub={editingSub} onClose={() => { setShowForm(false); setEditingSub(null) }} inputClass={inputClass} />}
      {deletingSub && <DeleteConfirm itemName={deletingSub.name} onConfirm={handleDelete} onCancel={() => setDeletingSub(null)} />}
    </div>
  )
}

function SubFormModal({ sub, onClose, inputClass }: { sub: Subscription | null; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!sub
  const [form, setForm] = useState({
    name: sub?.name || '',
    provider: sub?.provider || '',
    amount: sub?.amount?.toString() || '',
    currency: sub?.currency || 'USD',
    frequency: sub?.frequency || 'monthly',
    next_renewal: sub?.next_renewal || '',
    category: sub?.category || '',
    auto_renew: sub?.auto_renew ?? true,
    status: sub?.status || 'active',
    login_url: sub?.login_url || '',
    notes: sub?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      amount: form.amount ? parseFloat(form.amount) : null,
      provider: form.provider || null,
      next_renewal: form.next_renewal || null,
      category: form.category || null,
      login_url: form.login_url || null,
      notes: form.notes || null,
    }
    const url = isEditing ? `/api/subscriptions/${sub.id}` : '/api/subscriptions'
    const method = isEditing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Subscription' : 'New Subscription'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className={labelClass}>Name *</label><input className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Wine Club" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Provider</label><input className={inputClass} value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} placeholder="e.g. Opus One" /></div>
            <div><label className={labelClass}>Category</label><input className={inputClass} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Wine & Spirits" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
            <div>
              <label className={labelClass}>Currency</label>
              <select className={inputClass} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <select className={inputClass} value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as typeof p.frequency }))}>
                <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Next Renewal</label><input className={inputClass} type="date" value={form.next_renewal} onChange={e => setForm(p => ({ ...p, next_renewal: e.target.value }))} /></div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                <option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Login URL</label><input className={inputClass} value={form.login_url} onChange={e => setForm(p => ({ ...p, login_url: e.target.value }))} placeholder="https://" /></div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="auto_renew" checked={form.auto_renew} onChange={e => setForm(p => ({ ...p, auto_renew: e.target.checked }))} className="rounded bg-gray-900 border-gray-700 text-emerald-600 focus:ring-emerald-500/50" />
            <label htmlFor="auto_renew" className="text-sm text-gray-400">Auto-renew</label>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
