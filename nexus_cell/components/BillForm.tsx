'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill } from '@/lib/types'

const categories = [
  'Site Work', 'Track & Paddock', 'Garages', 'Clubhouse', 'Homes',
  'Design & Engineering', 'Permits', 'Insurance', 'Utilities', 'Legal',
  'Marketing', 'Merchandise', 'Travel', 'Membership', 'Other',
]

interface BillFormProps {
  bill?: Bill | null
  onClose: () => void
}

export default function BillForm({ bill, onClose }: BillFormProps) {
  const router = useRouter()
  const isEditing = !!bill

  const [form, setForm] = useState({
    vendor: bill?.vendor || '',
    description: bill?.description || '',
    amount: bill?.amount?.toString() || '',
    currency: bill?.currency || 'USD',
    category: bill?.category || '',
    due_date: bill?.due_date || '',
    payment_method: bill?.payment_method || '',
    notes: bill?.notes || '',
    status: bill?.status || 'pending',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      description: form.description || null,
      category: form.category || null,
      due_date: form.due_date || null,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    }

    const url = isEditing ? `/api/bills/${bill.id}` : '/api/bills'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  const inputClass = 'w-full px-3 py-2 bg-[#0A0B0C] border border-[#26292C] rounded-sm text-white placeholder-[#6E7578] focus:outline-none focus:border-[#CDA14B] text-sm'
  const labelClass = 'block font-display text-[11px] uppercase tracking-[0.16em] text-[#9AA0A4] mb-1.5'

  return (
    <div className="fixed inset-0 bg-[rgba(8,9,10,.85)] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="rp-panel w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
          <h2 className="rp-eyebrow">{isEditing ? 'Edit bill' : 'New bill'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-[#6E7578] hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Vendor *</label>
              <input className={inputClass} value={form.vendor} onChange={e => update('vendor', e.target.value)} placeholder="e.g. Paving contractor" required />
            </div>

            <div>
              <label className={labelClass}>Amount *</label>
              <input className={inputClass} type="number" step="0.01" min="0" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" required />
            </div>

            <div>
              <label className={labelClass}>Currency</label>
              <select className={inputClass} value={form.currency} onChange={e => update('currency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={e => update('category', e.target.value)}>
                <option value="">Select...</option>
                {form.category && !categories.includes(form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Due Date</label>
              <input className={inputClass} type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} />
            </div>

            {isEditing && (
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => update('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Payment Method</label>
              <input className={inputClass} value={form.payment_method} onChange={e => update('payment_method', e.target.value)} placeholder="e.g. Wire, AmEx" />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Description</label>
              <input className={inputClass} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Brief description" />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="rp-btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rp-btn-solid flex-1">
              {saving ? 'Saving...' : isEditing ? 'Update Bill' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
