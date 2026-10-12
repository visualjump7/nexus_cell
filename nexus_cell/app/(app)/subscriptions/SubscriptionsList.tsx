'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subscription, UserRole } from '@/lib/types'
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
  RpTag,
  RpButton,
  RpEmpty,
  RpModal,
  RpField,
  RpInput,
  RpSelect,
  RpTextarea,
  RpCheck,
  RpFormGrid,
  Plus,
  fmtMoney,
  fmtDate,
  daysUntil,
} from '@/components/rp'

const STATUSES: { id: Subscription['status']; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'cancelled', label: 'Cancelled' },
]

const FREQUENCY_LABEL: Record<Subscription['frequency'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

interface Props {
  subscriptions: Subscription[]
  role: UserRole
  /** Rendered inside the Clubhouse view: a group head instead of a page header. */
  embedded?: boolean
}

/** Renewal tag: gold within 30 days, alert once lapsed, neutral otherwise. */
function RenewalTag({ date }: { date: string | null }) {
  if (!date) return <span className="text-rp-dim">—</span>
  const d = daysUntil(date)
  if (!Number.isFinite(d)) return <span className="text-rp-dim">—</span>
  if (d < 0) return <RpTag tone="alert" title={`Renewal was due ${fmtDate(date)}`}>Lapsed</RpTag>
  if (d <= 30) return <RpTag tone="gold">Renews {fmtDate(date, 'short')}</RpTag>
  return <RpTag>Renews {fmtDate(date)}</RpTag>
}

export default function SubscriptionsList({ subscriptions, role, embedded }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null)

  const filtered = subscriptions.filter(s => statusFilter === 'all' || s.status === statusFilter)

  function formatCurrency(amt: number | null, currency: string) {
    if (!amt) return '—'
    return fmtMoney(amt, { currency })
  }

  async function handleDelete() {
    if (!deletingSub) return
    await fetch(`/api/subscriptions/${deletingSub.id}`, { method: 'DELETE' })
    setDeletingSub(null)
    router.refresh()
  }

  const openNew = () => { setEditingSub(null); setShowForm(true) }
  const newButton = canWrite && (
    <RpButton size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={openNew}>New subscription</RpButton>
  )
  const countLabel = `${filtered.length} subscription${filtered.length !== 1 ? 's' : ''}`

  const body = (
    <>
      <RpFilterBar count={countLabel}>
        <RpTabs
          size="sm"
          ariaLabel="Subscription status"
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { id: 'all', label: 'All', count: subscriptions.length },
            ...STATUSES.map(s => ({ id: s.id, label: s.label, count: subscriptions.filter(x => x.status === s.id).length })),
          ]}
        />
      </RpFilterBar>

      {filtered.length === 0 ? (
        <RpEmpty
          compact
          title={subscriptions.length === 0 ? 'Nothing logged yet.' : 'No subscriptions here.'}
          line="Project software, site services and club systems, with their renewal dates."
          action={subscriptions.length === 0 ? newButton : undefined}
        />
      ) : (
        <RpTable minWidth={800} caption="Software and services">
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th className="num">Amount</th>
              <th>Frequency</th>
              <th>Next renewal</th>
              <th>Status</th>
              {canWrite && <th className="num relative"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sub => (
              <tr key={sub.id}>
                <td>
                  <span className="font-medium text-rp-text">{sub.name}</span>
                  {sub.category && <span className="sub">{sub.category}</span>}
                </td>
                <td className="text-rp-muted">{sub.provider || '—'}</td>
                <td className="num">{formatCurrency(sub.amount, sub.currency)}</td>
                <td className="text-rp-muted">{FREQUENCY_LABEL[sub.frequency] || sub.frequency}</td>
                <td className="whitespace-nowrap"><RenewalTag date={sub.next_renewal} /></td>
                <td><RpStatus kind="subscription" value={sub.status} /></td>
                {canWrite && (
                  <td className="num">
                    <span className="inline-flex gap-4">
                      <RpButton variant="text" size="sm" onClick={() => { setEditingSub(sub); setShowForm(true) }}>Edit</RpButton>
                      <RpButton variant="text" size="sm" onClick={() => setDeletingSub(sub)}>Delete</RpButton>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </RpTable>
      )}

      {showForm && <SubFormModal sub={editingSub} onClose={() => { setShowForm(false); setEditingSub(null) }} />}
      {deletingSub && <DeleteConfirm itemName={deletingSub.name} onConfirm={handleDelete} onCancel={() => setDeletingSub(null)} />}
    </>
  )

  if (embedded) {
    return (
      <RpGroup>
        <RpGroupHead title="Software & services" line="Systems the club and the build run on" aside={newButton || undefined} />
        {body}
      </RpGroup>
    )
  }

  return (
    <RpPage>
      <RpPageHeader eyebrow="Clubhouse" title="Software & services" line={`${countLabel} · systems the club and the build run on`} actions={newButton || undefined} />
      {body}
    </RpPage>
  )
}

function SubFormModal({ sub, onClose }: { sub: Subscription | null; onClose: () => void }) {
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={isEditing ? 'Edit subscription' : 'New subscription'}
      title={form.name || 'Subscription'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="sub-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Create'}
          </RpButton>
        </>
      }
    >
      <form id="sub-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Name" htmlFor="sub-name" required className="sm:col-span-2">
            <RpInput id="sub-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Procore" required />
          </RpField>
          <RpField label="Provider" htmlFor="sub-provider">
            <RpInput id="sub-provider" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} placeholder="e.g. Procore Technologies" />
          </RpField>
          <RpField label="Category" htmlFor="sub-category">
            <RpInput id="sub-category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Project software" />
          </RpField>
          <RpField label="Amount" htmlFor="sub-amount">
            <RpInput id="sub-amount" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </RpField>
          <div className="grid grid-cols-2 gap-4">
            <RpField label="Currency" htmlFor="sub-currency">
              <RpSelect id="sub-currency" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
              </RpSelect>
            </RpField>
            <RpField label="Frequency" htmlFor="sub-frequency">
              <RpSelect id="sub-frequency" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as typeof p.frequency }))}>
                <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
              </RpSelect>
            </RpField>
          </div>
          <RpField label="Next renewal" htmlFor="sub-renewal">
            <RpInput id="sub-renewal" type="date" value={form.next_renewal} onChange={e => setForm(p => ({ ...p, next_renewal: e.target.value }))} />
          </RpField>
          <RpField label="Status" htmlFor="sub-status">
            <RpSelect id="sub-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option>
            </RpSelect>
          </RpField>
          <RpField label="Login URL" htmlFor="sub-login" className="sm:col-span-2">
            <RpInput id="sub-login" value={form.login_url} onChange={e => setForm(p => ({ ...p, login_url: e.target.value }))} placeholder="https://" />
          </RpField>
          <RpField label="Notes" htmlFor="sub-notes" className="sm:col-span-2">
            <RpTextarea id="sub-notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
          <RpCheck
            id="auto_renew"
            className="sm:col-span-2"
            checked={form.auto_renew}
            onChange={v => setForm(p => ({ ...p, auto_renew: v }))}
            label="Auto-renew"
          />
          {error && <p className="rp-error sm:col-span-2" role="alert">{error}</p>}
        </RpFormGrid>
      </form>
    </RpModal>
  )
}
