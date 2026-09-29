'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectContact } from '@/lib/types'

const tradeColors: Record<string, string> = {
  General: 'bg-[#CDA14B]/15 text-[#E0BF7B]',
  Paving: 'bg-[#CDA14B]/15 text-[#E0BF7B]',
  Track: 'bg-[#CDA14B]/15 text-[#E0BF7B]',
  Sitework: 'bg-[#CDA14B]/15 text-[#E0BF7B]',
  Civil: 'bg-[#CDA14B]/15 text-[#E0BF7B]',
  Architecture: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  Engineering: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  Electrical: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  Mechanical: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  HVAC: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  Plumbing: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  Landscaping: 'bg-[#A4CC5C]/15 text-[#A4CC5C]',
  Legal: 'bg-[#9AA0A4]/15 text-[#9AA0A4]',
  Interior: 'bg-[#9AA0A4]/15 text-[#9AA0A4]',
}

function getTradeColor(trade: string | null) {
  if (!trade) return 'bg-gray-500/15 text-gray-400'
  for (const [key, val] of Object.entries(tradeColors)) {
    if (trade.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'bg-gray-500/15 text-gray-400'
}

function formatCents(cents: number | null) {
  if (!cents) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
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

  const inputClass = 'w-full px-3 py-2 bg-[#0A0B0C] border border-[#26292C] rounded-sm text-white placeholder-[#6E7578] focus:outline-none focus:border-[#CDA14B] text-sm'

  function isInsuranceExpiring(expiry: string | null) {
    if (!expiry) return false
    const diff = new Date(expiry).getTime() - Date.now()
    return diff > 0 && diff < 30 * 86400000
  }

  function isInsuranceExpired(expiry: string | null) {
    if (!expiry) return false
    return new Date(expiry).getTime() < Date.now()
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contacts.map(c => (
          <div key={c.id} className="rp-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display text-[15px] uppercase tracking-[0.06em] text-white">{c.company_name || c.name}</h4>
              {c.trade && <span className={`font-display text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-sm ${getTradeColor(c.trade)}`}>{c.trade}</span>}
            </div>
            <p className="text-xs text-gray-400">{c.name}{c.role ? ` — ${c.role}` : ''}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {c.contract_value_cents && <span className="text-white font-mono">{formatCents(c.contract_value_cents)}</span>}
              {c.contract_start && c.contract_end && (
                <span>{new Date(c.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {new Date(c.contract_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              )}
            </div>
            {/* Insurance indicator */}
            <div className="flex items-center gap-1.5 mt-2">
              {c.insurance_on_file ? (
                isInsuranceExpired(c.insurance_expiry) ? (
                  <span className="text-[10px] text-red-400 flex items-center gap-1">&#9888; Insurance expired</span>
                ) : isInsuranceExpiring(c.insurance_expiry) ? (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">&#9888; Insurance expiring soon</span>
                ) : (
                  <span className="text-[10px] text-[#A4CC5C] flex items-center gap-1">&#10003; Insurance on file</span>
                )
              ) : (
                <span className="text-[10px] text-red-400 flex items-center gap-1">&#9888; No insurance on file</span>
              )}
            </div>
            {canWrite && (
              <div className="flex gap-2 mt-3 pt-2 border-t border-[#1F1F1F]">
                <button onClick={() => { setEditing(c); setShowForm(true) }} className="text-[10px] text-gray-500 hover:text-white">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-[10px] text-gray-500 hover:text-red-400">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canWrite && !showForm && (
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="mt-3 rp-btn-ghost !min-h-[30px] !px-3 !py-1">Add subcontractor</button>
      )}

      {showForm && (
        <SubcontractorForm
          contact={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          inputClass={inputClass}
        />
      )}
    </div>
  )
}

function SubcontractorForm({ contact, onSave, onCancel, inputClass }: {
  contact: ProjectContact | null
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  inputClass: string
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

  return (
    <div className="mt-3 rp-surface p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} placeholder="Company Name *" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
        <input className={inputClass} placeholder="Trade * (e.g. Paving, Electrical)" value={form.trade} onChange={e => setForm(p => ({ ...p, trade: e.target.value }))} />
        <input className={inputClass} placeholder="Contact Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className={inputClass} placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <input className={inputClass} placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        <input className={inputClass} placeholder="Contract Value ($)" type="number" step="0.01" value={form.contract_value_cents} onChange={e => setForm(p => ({ ...p, contract_value_cents: e.target.value }))} />
        <input className={inputClass} type="date" placeholder="Contract Start" value={form.contract_start} onChange={e => setForm(p => ({ ...p, contract_start: e.target.value }))} />
        <input className={inputClass} type="date" placeholder="Contract End" value={form.contract_end} onChange={e => setForm(p => ({ ...p, contract_end: e.target.value }))} />
        <input className={inputClass} placeholder="License #" value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ins" checked={form.insurance_on_file} onChange={e => setForm(p => ({ ...p, insurance_on_file: e.target.checked }))} className="rounded bg-white/5 border-white/20" />
          <label htmlFor="ins" className="text-sm text-gray-400">Insurance on file</label>
        </div>
      </div>
      {form.insurance_on_file && (
        <input className={inputClass} type="date" placeholder="Insurance Expiry" value={form.insurance_expiry} onChange={e => setForm(p => ({ ...p, insurance_expiry: e.target.value }))} />
      )}
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="rp-btn-solid !min-h-[34px] !px-4 !py-1.5 !text-[11px]">
          {contact ? 'Update' : 'Add'}
        </button>
        <button onClick={onCancel} className="rp-btn-ghost !min-h-[30px] !px-3 !py-1">Cancel</button>
      </div>
    </div>
  )
}
