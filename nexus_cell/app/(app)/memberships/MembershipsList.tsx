'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Membership, UserRole } from '@/lib/types'
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
  RpFormGrid,
  Plus,
  fmtMoney,
  fmtDate,
  daysUntil,
} from '@/components/rp'

const STATUSES: { id: Membership['status']; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
  { id: 'cancelled', label: 'Cancelled' },
]

interface Props {
  memberships: Membership[]
  role: UserRole
  /** Rendered inside the Clubhouse view: a group head instead of a page header. */
  embedded?: boolean
}

/** Expiry: a gold tag inside 60 days, otherwise the date. */
function Expiry({ date }: { date: string | null }) {
  if (!date) return <span className="text-rp-dim">—</span>
  const d = daysUntil(date)
  if (Number.isFinite(d) && d > 0 && d <= 60) return <RpTag tone="gold">Expires {fmtDate(date, 'short')}</RpTag>
  return <span className="text-rp-muted">{fmtDate(date)}</span>
}

export default function MembershipsList({ memberships, role, embedded }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingMem, setEditingMem] = useState<Membership | null>(null)
  const [deletingMem, setDeletingMem] = useState<Membership | null>(null)

  const filtered = memberships.filter(m => statusFilter === 'all' || m.status === statusFilter)

  function formatCurrency(amt: number | null) {
    if (!amt) return '—'
    return fmtMoney(amt)
  }

  async function handleDelete() {
    if (!deletingMem) return
    await fetch(`/api/memberships/${deletingMem.id}`, { method: 'DELETE' })
    setDeletingMem(null)
    router.refresh()
  }

  const openNew = () => { setEditingMem(null); setShowForm(true) }
  const newButton = canWrite && (
    <RpButton size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={openNew}>New membership</RpButton>
  )
  const countLabel = `${filtered.length} membership${filtered.length !== 1 ? 's' : ''}`

  const body = (
    <>
      <RpFilterBar count={countLabel}>
        <RpTabs
          size="sm"
          ariaLabel="Membership status"
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { id: 'all', label: 'All', count: memberships.length },
            ...STATUSES.map(s => ({ id: s.id, label: s.label, count: memberships.filter(m => m.status === s.id).length })),
          ]}
        />
      </RpFilterBar>

      {filtered.length === 0 ? (
        <RpEmpty
          compact
          title={memberships.length === 0 ? 'Nothing logged yet.' : 'No memberships here.'}
          line="Sanctioning bodies, club affiliations and the cards that come with them."
          action={memberships.length === 0 ? newButton : undefined}
        />
      ) : (
        <RpTable minWidth={760} caption="Memberships">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Tier</th>
              <th>Expiry</th>
              <th className="num">Renewal</th>
              <th>Status</th>
              {canWrite && <th className="num relative"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(mem => (
              <tr key={mem.id}>
                <td>
                  <span className="font-medium text-rp-text">{mem.name}</span>
                  {mem.member_id && <span className="sub tabular-nums">No. {mem.member_id}</span>}
                </td>
                <td className="text-rp-muted">{mem.organization_name || '—'}</td>
                <td className="text-rp-muted">{mem.tier || '—'}</td>
                <td className="whitespace-nowrap"><Expiry date={mem.expiry_date} /></td>
                <td className="num">{formatCurrency(mem.renewal_amount)}</td>
                <td><RpStatus kind="membership" value={mem.status} /></td>
                {canWrite && (
                  <td className="num">
                    <span className="inline-flex gap-4">
                      <RpButton variant="text" size="sm" onClick={() => { setEditingMem(mem); setShowForm(true) }}>Edit</RpButton>
                      <RpButton variant="text" size="sm" onClick={() => setDeletingMem(mem)}>Delete</RpButton>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </RpTable>
      )}

      {showForm && <MemFormModal mem={editingMem} onClose={() => { setShowForm(false); setEditingMem(null) }} />}
      {deletingMem && <DeleteConfirm itemName={deletingMem.name} onConfirm={handleDelete} onCancel={() => setDeletingMem(null)} />}
    </>
  )

  if (embedded) {
    return (
      <RpGroup>
        <RpGroupHead title="Memberships" line="Club and sanctioning-body memberships, by expiry" aside={newButton || undefined} />
        {body}
      </RpGroup>
    )
  }

  return (
    <RpPage>
      <RpPageHeader eyebrow="Clubhouse" title="Memberships" line={`${countLabel} · club and sanctioning-body memberships`} actions={newButton || undefined} />
      {body}
    </RpPage>
  )
}

function MemFormModal({ mem, onClose }: { mem: Membership | null; onClose: () => void }) {
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={isEditing ? 'Edit membership' : 'New membership'}
      title={form.name || 'Membership'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="mem-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Create'}
          </RpButton>
        </>
      }
    >
      <form id="mem-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Name" htmlFor="mem-name" required className="sm:col-span-2">
            <RpInput id="mem-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. SCCA" required />
          </RpField>
          <RpField label="Organization" htmlFor="mem-org">
            <RpInput id="mem-org" value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} placeholder="Club or sanctioning body" />
          </RpField>
          <RpField label="Member ID" htmlFor="mem-id">
            <RpInput id="mem-id" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))} />
          </RpField>
          <RpField label="Tier" htmlFor="mem-tier">
            <RpInput id="mem-tier" value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} placeholder="e.g. Founding" />
          </RpField>
          <RpField label="Category" htmlFor="mem-category">
            <RpInput id="mem-category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Motorsport" />
          </RpField>
          <RpField label="Expiry date" htmlFor="mem-expiry">
            <RpInput id="mem-expiry" type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
          </RpField>
          <RpField label="Renewal amount" htmlFor="mem-renewal">
            <RpInput id="mem-renewal" type="number" step="0.01" min="0" value={form.renewal_amount} onChange={e => setForm(p => ({ ...p, renewal_amount: e.target.value }))} placeholder="0.00" />
          </RpField>
          <RpField label="Status" htmlFor="mem-status" className="sm:col-span-2">
            <RpSelect id="mem-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
            </RpSelect>
          </RpField>
          <RpField label="Notes" htmlFor="mem-notes" className="sm:col-span-2">
            <RpTextarea id="mem-notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
          {error && <p className="rp-error sm:col-span-2" role="alert">{error}</p>}
        </RpFormGrid>
      </form>
    </RpModal>
  )
}
