'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Gift, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import {
  RpPage,
  RpPageHeader,
  RpGroup,
  RpGroupHead,
  RpTabs,
  RpFilterBar,
  RpTable,
  RpStatus,
  RpButton,
  RpEmpty,
  RpModal,
  RpField,
  RpInput,
  RpSelect,
  RpTextarea,
  RpFormGrid,
  Plus,
  fmtMoney,
  fmtDate,
} from '@/components/rp'

const STATUSES: { id: Gift['status']; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'purchased', label: 'Purchased' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'thanked', label: 'Thanked' },
]

interface Props {
  gifts: Gift[]
  role: UserRole
  /** Rendered inside the Clubhouse view: a group head instead of a page header. */
  embedded?: boolean
}

export default function GiftsList({ gifts, role, embedded }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null)

  const filtered = gifts.filter(g => statusFilter === 'all' || g.status === statusFilter)

  function formatCurrency(amt: number | null) {
    if (!amt) return '—'
    return fmtMoney(amt)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return fmtDate(d)
  }

  async function handleDelete() {
    if (!deletingGift) return
    await fetch(`/api/gifts/${deletingGift.id}`, { method: 'DELETE' })
    setDeletingGift(null)
    router.refresh()
  }

  const openNew = () => { setEditingGift(null); setShowForm(true) }
  const newButton = canWrite && (
    <RpButton size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={openNew}>New gift</RpButton>
  )
  const countLabel = `${filtered.length} gift${filtered.length !== 1 ? 's' : ''}`

  const body = (
    <>
      <RpFilterBar count={countLabel}>
        <RpTabs
          size="sm"
          ariaLabel="Gift status"
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { id: 'all', label: 'All', count: gifts.length },
            ...STATUSES.map(s => ({ id: s.id, label: s.label, count: gifts.filter(g => g.status === s.id).length })),
          ]}
        />
      </RpFilterBar>

      {filtered.length === 0 ? (
        <RpEmpty
          compact
          title={gifts.length === 0 ? 'Nothing logged yet.' : 'No gifts at this stage.'}
          line="Thank-yous for trades, topping-out gifts and club presentations are logged here."
          action={gifts.length === 0 ? newButton : undefined}
        />
      ) : (
        <RpTable minWidth={760} caption="Gifts">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Occasion</th>
              <th>Description</th>
              <th className="num">Amount</th>
              <th>Date</th>
              <th>Status</th>
              {canWrite && <th className="num relative"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(gift => (
              <tr key={gift.id}>
                <td className="font-medium text-rp-text">{gift.recipient}</td>
                <td className="text-rp-muted">{gift.occasion || '—'}</td>
                <td className="max-w-[240px] truncate text-rp-muted" title={gift.description || undefined}>{gift.description || '—'}</td>
                <td className="num">{formatCurrency(gift.amount)}</td>
                <td className="whitespace-nowrap text-rp-muted">{formatDate(gift.date)}</td>
                <td><RpStatus kind="gift" value={gift.status} /></td>
                {canWrite && (
                  <td className="num">
                    <span className="inline-flex gap-4">
                      <RpButton variant="text" size="sm" onClick={() => { setEditingGift(gift); setShowForm(true) }}>Edit</RpButton>
                      <RpButton variant="text" size="sm" onClick={() => setDeletingGift(gift)}>Delete</RpButton>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </RpTable>
      )}

      {showForm && <GiftFormModal gift={editingGift} onClose={() => { setShowForm(false); setEditingGift(null) }} />}
      {deletingGift && <DeleteConfirm itemName={`gift for ${deletingGift.recipient}`} onConfirm={handleDelete} onCancel={() => setDeletingGift(null)} />}
    </>
  )

  if (embedded) {
    return (
      <RpGroup>
        <RpGroupHead
          title="Gifts"
          line="From idea to thank-you note"
          aside={newButton || undefined}
        />
        {body}
      </RpGroup>
    )
  }

  return (
    <RpPage>
      <RpPageHeader eyebrow="Clubhouse" title="Gifts" line={`${countLabel} · from idea to thank-you note`} actions={newButton || undefined} />
      {body}
    </RpPage>
  )
}

function GiftFormModal({ gift, onClose }: { gift: Gift | null; onClose: () => void }) {
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={isEditing ? 'Edit gift' : 'New gift'}
      title={form.recipient || 'Gift'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="gift-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Create gift'}
          </RpButton>
        </>
      }
    >
      <form id="gift-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Recipient" htmlFor="gift-recipient" required className="sm:col-span-2">
            <RpInput id="gift-recipient" value={form.recipient} onChange={e => setForm(p => ({ ...p, recipient: e.target.value }))} placeholder="e.g. Lead architect" required />
          </RpField>
          <RpField label="Occasion" htmlFor="gift-occasion">
            <RpInput id="gift-occasion" value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))} placeholder="e.g. Topping-out" />
          </RpField>
          <RpField label="Date" htmlFor="gift-date">
            <RpInput id="gift-date" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </RpField>
          <RpField label="Description" htmlFor="gift-description" className="sm:col-span-2">
            <RpInput id="gift-description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Club jacket, satin silver" />
          </RpField>
          <RpField label="Amount" htmlFor="gift-amount">
            <RpInput id="gift-amount" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </RpField>
          <RpField label="Status" htmlFor="gift-status">
            <RpSelect id="gift-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </RpSelect>
          </RpField>
          <RpField label="Notes" htmlFor="gift-notes" className="sm:col-span-2">
            <RpTextarea id="gift-notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
          {error && <p className="rp-error sm:col-span-2" role="alert">{error}</p>}
        </RpFormGrid>
      </form>
    </RpModal>
  )
}
