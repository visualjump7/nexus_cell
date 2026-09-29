'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Gift, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  idea: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  purchased: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shipped: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  thanked: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

interface Props { gifts: Gift[]; role: UserRole }

export default function GiftsList({ gifts, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null)

  const filtered = gifts.filter(g => statusFilter === 'all' || g.status === statusFilter)

  function formatCurrency(amt: number | null) {
    if (!amt) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleDelete() {
    if (!deletingGift) return
    await fetch(`/api/gifts/${deletingGift.id}`, { method: 'DELETE' })
    setDeletingGift(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-6xl">
      <header className="rp-head">
        <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2.5">
          <span className="rp-eyebrow">Clubhouse</span>
          <h1 className="rp-title">Gifts</h1>
          <p className="rp-caption">{filtered.length} gift{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingGift(null); setShowForm(true) }} className="rp-btn-solid">
            New gift
          </button>
        )}
        </div>
      </header>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="idea">Idea</option>
          <option value="purchased">Purchased</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="thanked">Thanked</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rp-panel p-12 text-center">
          <p className="text-gray-500">No gifts found.</p>
        </div>
      ) : (
        <div className="rp-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F1F1F] text-left rp-eyebrow--muted">
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Occasion</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(gift => (
                <tr key={gift.id} className="border-b border-[#1F1F1F] hover:bg-[#141618] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{gift.recipient}</td>
                  <td className="px-4 py-3 text-gray-400">{gift.occasion || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{gift.description || '—'}</td>
                  <td className="px-4 py-3 text-white font-mono">{formatCurrency(gift.amount)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(gift.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[gift.status] || ''}`}>{gift.status}</span>
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditingGift(gift); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeletingGift(gift)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <GiftFormModal gift={editingGift} onClose={() => { setShowForm(false); setEditingGift(null) }} inputClass={inputClass} />}
      {deletingGift && <DeleteConfirm itemName={`gift for ${deletingGift.recipient}`} onConfirm={handleDelete} onCancel={() => setDeletingGift(null)} />}
    </div>
  )
}

function GiftFormModal({ gift, onClose, inputClass }: { gift: Gift | null; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!gift
  const [form, setForm] = useState({
    recipient: gift?.recipient || '',
    occasion: gift?.occasion || '',
    description: gift?.description || '',
    amount: gift?.amount?.toString() || '',
    date: gift?.date || '',
    status: gift?.status || 'idea',
    notes: gift?.notes || '',
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
      occasion: form.occasion || null,
      description: form.description || null,
      date: form.date || null,
      notes: form.notes || null,
    }
    const url = isEditing ? `/api/gifts/${gift.id}` : '/api/gifts'
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
      <div className="rp-panel w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="rp-eyebrow">{isEditing ? 'Edit Gift' : 'New Gift'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className={labelClass}>Recipient *</label><input className={inputClass} value={form.recipient} onChange={e => setForm(p => ({ ...p, recipient: e.target.value }))} placeholder="e.g. Lead architect" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Occasion</label><input className={inputClass} value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))} placeholder="e.g. Topping-out" /></div>
            <div><label className={labelClass}>Date</label><input className={inputClass} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div><label className={labelClass}>Description</label><input className={inputClass} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Club jacket, satin silver" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                <option value="idea">Idea</option>
                <option value="purchased">Purchased</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="thanked">Thanked</option>
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="rp-btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="rp-btn-solid flex-1 disabled:cursor-not-allowed justify-center">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
