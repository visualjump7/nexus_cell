'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill } from '@/lib/types'
import { RpModal, RpButton, RpField, RpInput, RpSelect, RpTextarea, RpFormGrid } from '@/components/rp'

// Construction cost categories (matches the seeded payables). The column is free text.
const categories = [
  'Design & Engineering', 'Site Work', 'Track & Paddock', 'Garages', 'Clubhouse', 'Homes',
  'Utilities', 'Permits', 'Legal', 'Insurance', 'Taxes', 'Marketing', 'Merchandise', 'Other',
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={isEditing ? 'Edit bill' : 'New bill'}
      title={form.vendor.trim() || (isEditing ? 'Bill' : 'New payable')}
      size="md"
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="bill-form" disabled={saving}>
            {saving ? 'Saving' : isEditing ? 'Save bill' : 'Create bill'}
          </RpButton>
        </>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Vendor" htmlFor="bill-vendor" required className="sm:col-span-2">
            <RpInput id="bill-vendor" value={form.vendor} onChange={e => update('vendor', e.target.value)} placeholder="Paving contractor, surveyor, county" required />
          </RpField>

          <RpField label="Amount" htmlFor="bill-amount" required>
            <RpInput id="bill-amount" type="number" step="0.01" min="0" inputMode="decimal" className="tabular-nums" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" required />
          </RpField>

          <RpField label="Currency" htmlFor="bill-currency">
            <RpSelect id="bill-currency" value={form.currency} onChange={e => update('currency', e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </RpSelect>
          </RpField>

          <RpField label="Category" htmlFor="bill-category">
            <RpSelect id="bill-category" value={form.category} onChange={e => update('category', e.target.value)}>
              <option value="">Select</option>
              {form.category && !categories.includes(form.category) && (
                <option value={form.category}>{form.category}</option>
              )}
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </RpSelect>
          </RpField>

          <RpField label="Due date" htmlFor="bill-due">
            <RpInput id="bill-due" type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} />
          </RpField>

          {isEditing && (
            <RpField label="Status" htmlFor="bill-status">
              <RpSelect id="bill-status" value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
                <option value="overdue">Overdue</option>
              </RpSelect>
            </RpField>
          )}

          <RpField label="Payment method" htmlFor="bill-method">
            <RpInput id="bill-method" value={form.payment_method} onChange={e => update('payment_method', e.target.value)} placeholder="Wire, ACH, check" />
          </RpField>

          <RpField label="Description" htmlFor="bill-description" className="sm:col-span-2">
            <RpInput id="bill-description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Package and scope, e.g. Garage campus · draw #4" />
          </RpField>

          <RpField label="Notes" htmlFor="bill-notes" className="sm:col-span-2">
            <RpTextarea id="bill-notes" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Internal notes" />
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error mt-4" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
