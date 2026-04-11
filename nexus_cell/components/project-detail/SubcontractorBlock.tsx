'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectContact } from '@/lib/types'

const tradeColors: Record<string, string> = {
  Electrical: 'bg-amber-500/15 text-amber-400',
  Mechanical: 'bg-blue-500/15 text-blue-400',
  HVAC: 'bg-teal-500/15 text-teal-400',
  Plumbing: 'bg-cyan-500/15 text-cyan-400',
  Legal: 'bg-purple-500/15 text-purple-400',
  General: 'bg-gray-500/15 text-gray-400',
  Architecture: 'bg-rose-500/15 text-rose-400',
  Landscaping: 'bg-emerald-500/15 text-emerald-400',
  Interior: 'bg-orange-500/15 text-orange-400',
  Marine: 'bg-blue-500/15 text-blue-400',
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

  const inputClass = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm'

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
          <div key={c.id} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">{c.company_name || c.name}</h4>
              {c.trade && <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTradeColor(c.trade)}`}>{c.trade}</span>}
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
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">&#10003; Insurance on file</span>
                )
              ) : (
                <span className="text-[10px] text-red-400 flex items-center gap-1">&#9888; No insurance on file</span>
              )}
            </div>
            {canWrite && (
              <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                <button onClick={() => { setEditing(c); setShowForm(true) }} className="text-[10px] text-gray-500 hover:text-white">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-[10px] text-gray-500 hover:text-red-400">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canWrite && !showForm && (
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="mt-3 text-xs text-teal-400 hover:text-teal-300">+ Add Subcontractor</button>
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
    <div className="mt-3 bg-white/5 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} placeholder="Company Name *" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
        <input className={inputClass} placeholder="Trade *" value={form.trade} onChange={e => setForm(p => ({ ...p, trade: e.target.value }))} />
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
        <button onClick={handleSubmit} className="px-3 py-1.5 bg-teal-500 hover:brightness-110 text-white text-xs rounded-lg font-medium">
          {contact ? 'Update' : 'Add'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-gray-300 text-xs rounded-lg">Cancel</button>
      </div>
    </div>
  )
}
