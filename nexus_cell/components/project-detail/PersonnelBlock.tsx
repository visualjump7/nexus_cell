'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectContact } from '@/lib/types'

const statusColors: Record<string, string> = {
  active: 'bg-[#A4CC5C]/15 text-[#A4CC5C]',
  'on-leave': 'bg-amber-500/15 text-amber-400',
  completed: 'bg-[#3989CB]/15 text-[#7FB3DE]',
  terminated: 'bg-red-500/15 text-red-400',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getInitialColor(name: string) {
  const colors = ['bg-[#8C6830]', 'bg-[#2C6699]', 'bg-[#5E7F2C]', 'bg-[#3A3E42]', 'bg-[#6B4F28]', 'bg-[#565C60]']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

interface Props { blockId: string; contacts: ProjectContact[]; canWrite: boolean }

export default function PersonnelBlock({ blockId, contacts, canWrite }: Props) {
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
        body: JSON.stringify({ ...data, contact_type: 'personnel' }),
      })
    }
    setShowForm(false)
    setEditing(null)
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 bg-[#0A0B0C] border border-[#26292C] rounded-sm text-white placeholder-[#6E7578] focus:outline-none focus:border-[#CDA14B] text-sm'

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contacts.map(c => (
          <div key={c.id} className="rp-surface p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-sm ${getInitialColor(c.name)} flex items-center justify-center shrink-0`}>
              <span className="font-display text-xs tracking-[0.08em] text-white">{getInitials(c.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <span className={`font-display text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-sm ${statusColors[c.status] || ''}`}>{c.status}</span>
              </div>
              {c.role && <p className="text-xs text-gray-400 mt-0.5">{c.role}{c.company ? ` · ${c.company}` : ''}</p>}
              <div className="flex gap-3 mt-2">
                {c.email && <a href={`mailto:${c.email}`} className="text-[11px] text-[#CDA14B] hover:text-[#E0BF7B]">{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} className="text-[11px] text-gray-500">{c.phone}</a>}
              </div>
              {canWrite && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setEditing(c); setShowForm(true) }} className="text-[10px] text-gray-500 hover:text-white">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-[10px] text-gray-500 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {canWrite && !showForm && (
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="mt-3 rp-btn-ghost !min-h-[30px] !px-3 !py-1">Add personnel</button>
      )}

      {showForm && (
        <PersonnelForm
          contact={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          inputClass={inputClass}
        />
      )}
    </div>
  )
}

function PersonnelForm({ contact, onSave, onCancel, inputClass }: {
  contact: ProjectContact | null
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  inputClass: string
}) {
  const [form, setForm] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    company: contact?.company || '',
    department: contact?.department || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    status: contact?.status || 'active',
    notes: contact?.notes || '',
  })

  return (
    <div className="mt-3 rp-surface p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className={inputClass} placeholder="Role * (e.g. GC, Architect, Civil engineer)" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
        <input className={inputClass} placeholder="Company" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
        <input className={inputClass} placeholder="Department" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
        <input className={inputClass} placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <input className={inputClass} placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => form.name && onSave(form)} className="rp-btn-solid !min-h-[34px] !px-4 !py-1.5 !text-[11px]">
          {contact ? 'Update' : 'Add'}
        </button>
        <button onClick={onCancel} className="rp-btn-ghost !min-h-[30px] !px-3 !py-1">Cancel</button>
      </div>
    </div>
  )
}
