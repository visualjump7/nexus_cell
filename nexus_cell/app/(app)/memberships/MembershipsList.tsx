'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Membership, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  expired: 'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

interface Props { memberships: Membership[]; role: UserRole }

export default function MembershipsList({ memberships, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingMem, setEditingMem] = useState<Membership | null>(null)
  const [deletingMem, setDeletingMem] = useState<Membership | null>(null)

  const filtered = memberships.filter(m => statusFilter === 'all' || m.status === statusFilter)

  function formatCurrency(amt: number | null) {
    if (!amt) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function isExpiringSoon(d: string | null) {
    if (!d) return false
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 60 * 86400000
  }

  async function handleDelete() {
    if (!deletingMem) return
    await fetch(`/api/memberships/${deletingMem.id}`, { method: 'DELETE' })
    setDeletingMem(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} membership{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingMem(null); setShowForm(true) }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Membership
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No memberships found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Renewal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(mem => (
                <tr key={mem.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{mem.name}</p>
                    {mem.member_id && <p className="text-xs text-gray-600 font-mono">#{mem.member_id}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{mem.organization_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{mem.tier || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={isExpiringSoon(mem.expiry_date) ? 'text-amber-400' : mem.status === 'expired' ? 'text-red-400' : 'text-gray-400'}>
                      {formatDate(mem.expiry_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-mono">{formatCurrency(mem.renewal_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[mem.status] || ''}`}>{mem.status}</span>
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditingMem(mem); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeletingMem(mem)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <MemFormModal mem={editingMem} onClose={() => { setShowForm(false); setEditingMem(null) }} inputClass={inputClass} />}
      {deletingMem && <DeleteConfirm itemName={deletingMem.name} onConfirm={handleDelete} onCancel={() => setDeletingMem(null)} />}
    </div>
  )
}

function MemFormModal({ mem, onClose, inputClass }: { mem: Membership | null; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!mem
  const [form, setForm] = useState({
    name: mem?.name || '',
    organization_name: mem?.organization_name || '',
    member_id: mem?.member_id || '',
    tier: mem?.tier || '',
    expiry_date: mem?.expiry_date || '',
    renewal_amount: mem?.renewal_amount?.toString() || '',
    category: mem?.category || '',
    status: mem?.status || 'active',
    notes: mem?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      renewal_amount: form.renewal_amount ? parseFloat(form.renewal_amount) : null,
      organization_name: form.organization_name || null,
      member_id: form.member_id || null,
      tier: form.tier || null,
      expiry_date: form.expiry_date || null,
      category: form.category || null,
      notes: form.notes || null,
    }
    const url = isEditing ? `/api/memberships/${mem.id}` : '/api/memberships'
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
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Membership' : 'New Membership'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className={labelClass}>Name *</label><input className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Augusta National" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Organization</label><input className={inputClass} value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} placeholder="Club / org name" /></div>
            <div><label className={labelClass}>Member ID</label><input className={inputClass} value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Tier</label><input className={inputClass} value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} placeholder="e.g. Platinum" /></div>
            <div><label className={labelClass}>Category</label><input className={inputClass} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Country Club" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Expiry Date</label><input className={inputClass} type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
            <div><label className={labelClass}>Renewal Amount</label><input className={inputClass} type="number" step="0.01" min="0" value={form.renewal_amount} onChange={e => setForm(p => ({ ...p, renewal_amount: e.target.value }))} placeholder="0.00" /></div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
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
