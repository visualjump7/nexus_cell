'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectContact } from '@/lib/types'
import {
  RpButton, RpCardGrid, RpCheck, RpField, RpFormGrid, RpInput, RpKV, RpModal, RpStatus, RpTag,
  Plus, RP_ICON, fmtDate, fmtMoney, fmtRange,
} from '@/components/rp'

// Design and consulting trades read blue; field trades stay neutral.
const DESIGN_TRADE = /architect|engineer|design|survey|consult|legal|interior/i

function insuranceState(c: ProjectContact): 'on_file' | 'expiring' | 'expired' | 'missing' {
  if (!c.insurance_on_file) return 'missing'
  if (!c.insurance_expiry) return 'on_file'
  const diff = new Date(c.insurance_expiry).getTime() - Date.now()
  if (diff < 0) return 'expired'
  if (diff < 30 * 86400000) return 'expiring'
  return 'on_file'
}

function term(c: ProjectContact): string {
  if (c.contract_start && c.contract_end) return fmtRange(c.contract_start, c.contract_end)
  if (c.contract_start) return `From ${fmtDate(c.contract_start)}`
  if (c.contract_end) return `To ${fmtDate(c.contract_end)}`
  return '—'
}

interface Props { blockId: string; contacts: ProjectContact[]; canWrite: boolean }

export default function SubcontractorBlock({ blockId, contacts, canWrite }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProjectContact | null>(null)

  async function handleDelete(id: string) {
    await fetch(`/api/project-blocks/${blockId}/contacts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave(data: Record<string, unknown>) {
    if (editing) {
      await fetch(`/api/project-blocks/${blockId}/contacts/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    } else {
      await fetch(`/api/project-blocks/${blockId}/contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, contact_type: 'subcontractor' }),
      })
    }
    setShowForm(false)
    setEditing(null)
    router.refresh()
  }

  if (contacts.length === 0 && !canWrite) {
    return <p className="text-[15px] text-rp-muted">No trades on the package yet.</p>
  }

  return (
    <div>
      <RpCardGrid min={320} max={2}>
        {contacts.map(c => {
          const ins = insuranceState(c)
          return (
            <article key={c.id} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h4 className="min-w-0 font-display text-xl uppercase leading-[1.15] tracking-[.03em] text-rp-text">
                    {c.company_name || c.name}
                  </h4>
                  {c.trade && (
                    <RpTag tone={DESIGN_TRADE.test(c.trade) ? 'blue' : 'neutral'} className="shrink-0">{c.trade}</RpTag>
                  )}
                </div>
                <p className="text-sm leading-snug text-rp-muted">
                  {c.name}{c.role ? ` — ${c.role}` : ''}
                </p>
              </div>
              <RpKV
                items={[
                  {
                    label: 'Contract',
                    value: c.contract_value_cents
                      ? <span className="font-display text-base font-medium tracking-[.02em]">{fmtMoney(c.contract_value_cents / 100)}</span>
                      : '—',
                    num: true,
                  },
                  { label: 'Term', value: term(c) },
                  { label: 'Insurance', value: <RpStatus kind="insurance" value={ins} /> },
                ]}
              />
              {canWrite && (
                <div className="mt-auto flex items-center gap-4">
                  <RpButton variant="text" size="sm" className="text-rp-muted" onClick={() => { setEditing(c); setShowForm(true) }}>Edit</RpButton>
                  <RpButton variant="text" size="sm" className="text-rp-muted hover:text-rp-alert" onClick={() => handleDelete(c.id)}>Remove</RpButton>
                </div>
              )}
            </article>
          )
        })}
        {canWrite && (
          <div className="flex min-h-[160px] flex-col items-start justify-center gap-3 p-5">
            <span className="rp-eyebrow--muted">{contacts.length ? 'Add a trade' : 'No trades listed yet'}</span>
            <RpButton
              variant="ghost"
              size="sm"
              icon={<Plus {...RP_ICON} size={14} />}
              onClick={() => { setEditing(null); setShowForm(true) }}
            >
              Add subcontractor
            </RpButton>
          </div>
        )}
      </RpCardGrid>

      {showForm && (
        <SubcontractorForm
          contact={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function SubcontractorForm({ contact, onSave, onCancel }: {
  contact: ProjectContact | null
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    company_name: contact?.company_name || '',
    name: contact?.name || '',
    trade: contact?.trade || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    contract_value_cents: contact?.contract_value_cents ? (contact.contract_value_cents / 100).toString() : '',
    contract_start: contact?.contract_start || '',
    contract_end: contact?.contract_end || '',
    license_number: contact?.license_number || '',
    insurance_on_file: contact?.insurance_on_file || false,
    insurance_expiry: contact?.insurance_expiry || '',
    notes: contact?.notes || '',
  })

  function handleSubmit() {
    if (!form.company_name || !form.name || !form.trade) return
    onSave({
      ...form,
      company_name: form.company_name,
      contract_value_cents: form.contract_value_cents ? Math.round(parseFloat(form.contract_value_cents) * 100) : null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      license_number: form.license_number || null,
      insurance_expiry: form.insurance_expiry || null,
      notes: form.notes || null,
    })
  }

  type TextKey = Exclude<keyof typeof form, 'insurance_on_file'>
  const set = (k: TextKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <RpModal
      open
      onClose={onCancel}
      size="lg"
      eyebrow={contact ? 'Edit subcontractor' : 'Add subcontractor'}
      title={form.company_name || 'Subcontractor'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onCancel}>Cancel</RpButton>
          <RpButton type="submit" form="subcontractor-form">{contact ? 'Save' : 'Add'}</RpButton>
        </>
      }
    >
      <form id="subcontractor-form" onSubmit={e => { e.preventDefault(); handleSubmit() }}>
        <RpFormGrid>
          <RpField label="Company" htmlFor="sc-company" required>
            <RpInput id="sc-company" value={form.company_name} onChange={set('company_name')} required />
          </RpField>
          <RpField label="Trade" htmlFor="sc-trade" required>
            <RpInput id="sc-trade" value={form.trade} onChange={set('trade')} placeholder="Paving, electrical, civil" required />
          </RpField>
          <RpField label="Contact name" htmlFor="sc-name" required>
            <RpInput id="sc-name" value={form.name} onChange={set('name')} required />
          </RpField>
          <RpField label="Email" htmlFor="sc-email">
            <RpInput id="sc-email" inputMode="email" value={form.email} onChange={set('email')} />
          </RpField>
          <RpField label="Phone" htmlFor="sc-phone">
            <RpInput id="sc-phone" type="tel" value={form.phone} onChange={set('phone')} />
          </RpField>
          <RpField label="Contract value ($)" htmlFor="sc-value">
            <RpInput id="sc-value" type="number" step="0.01" value={form.contract_value_cents} onChange={set('contract_value_cents')} />
          </RpField>
          <RpField label="Contract start" htmlFor="sc-start">
            <RpInput id="sc-start" type="date" value={form.contract_start} onChange={set('contract_start')} />
          </RpField>
          <RpField label="Contract end" htmlFor="sc-end">
            <RpInput id="sc-end" type="date" value={form.contract_end} onChange={set('contract_end')} />
          </RpField>
          <RpField label="Licence no." htmlFor="sc-licence">
            <RpInput id="sc-licence" value={form.license_number} onChange={set('license_number')} />
          </RpField>
          <div className="flex items-end pb-3">
            <RpCheck
              id="sc-ins"
              checked={form.insurance_on_file}
              onChange={v => setForm(p => ({ ...p, insurance_on_file: v }))}
              label="Insurance on file"
            />
          </div>
          {form.insurance_on_file && (
            <RpField label="Insurance expiry" htmlFor="sc-ins-exp">
              <RpInput id="sc-ins-exp" type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
            </RpField>
          )}
        </RpFormGrid>
      </form>
    </RpModal>
  )
}
