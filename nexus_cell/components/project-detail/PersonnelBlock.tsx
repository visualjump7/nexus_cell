'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectContact } from '@/lib/types'
import {
  RpButton, RpCardGrid, RpField, RpFormGrid, RpInput, RpModal, RpStatus,
  Plus, RP_ICON, dot,
} from '@/components/rp'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  if (contacts.length === 0 && !canWrite) {
    return <p className="text-[15px] text-rp-muted">No one on the package yet.</p>
  }

  return (
    <div>
      <RpCardGrid min={260} max={3}>
        {contacts.map(c => (
          <article key={c.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="rp-inset grid h-10 w-10 shrink-0 place-items-center font-display text-sm tracking-[.08em] text-rp-muted"
              >
                {getInitials(c.name)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h4 className="font-display text-lg uppercase leading-[1.15] tracking-[.02em] text-rp-text">{c.name}</h4>
                {(c.role || c.company) && (
                  <p className="text-sm leading-snug text-rp-muted">{dot(c.role, c.company)}</p>
                )}
              </div>
            </div>
            {(c.email || c.phone) && (
              <div className="flex flex-col gap-1 text-sm">
                {c.email && <a href={`mailto:${c.email}`} className="rp-link truncate text-rp-text">{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} className="rp-link tabular-nums text-rp-muted">{c.phone}</a>}
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
              <RpStatus kind="contact" value={c.status} />
              {canWrite && (
                <span className="flex items-center gap-4">
                  <RpButton variant="text" size="sm" className="text-rp-muted" onClick={() => { setEditing(c); setShowForm(true) }}>Edit</RpButton>
                  <RpButton variant="text" size="sm" className="text-rp-muted hover:text-rp-alert" onClick={() => handleDelete(c.id)}>Remove</RpButton>
                </span>
              )}
            </div>
          </article>
        ))}
        {canWrite && (
          <div className="flex min-h-[160px] flex-col items-start justify-center gap-3 p-5">
            <span className="rp-eyebrow--muted">{contacts.length ? 'Add to the team' : 'No one listed yet'}</span>
            <RpButton
              variant="ghost"
              size="sm"
              icon={<Plus {...RP_ICON} size={14} />}
              onClick={() => { setEditing(null); setShowForm(true) }}
            >
              Add person
            </RpButton>
          </div>
        )}
      </RpCardGrid>

      {showForm && (
        <PersonnelForm
          contact={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function PersonnelForm({ contact, onSave, onCancel }: {
  contact: ProjectContact | null
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <RpModal
      open
      onClose={onCancel}
      eyebrow={contact ? 'Edit person' : 'Add person'}
      title={form.name || 'Team member'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onCancel}>Cancel</RpButton>
          <RpButton type="submit" form="personnel-form">{contact ? 'Save' : 'Add'}</RpButton>
        </>
      }
    >
      <form
        id="personnel-form"
        onSubmit={e => { e.preventDefault(); if (form.name) onSave(form) }}
      >
        <RpFormGrid>
          <RpField label="Name" htmlFor="pc-name" required>
            <RpInput id="pc-name" value={form.name} onChange={set('name')} required />
          </RpField>
          <RpField label="Role" htmlFor="pc-role">
            <RpInput id="pc-role" value={form.role} onChange={set('role')} placeholder="GC, architect, civil engineer" />
          </RpField>
          <RpField label="Company" htmlFor="pc-company">
            <RpInput id="pc-company" value={form.company} onChange={set('company')} />
          </RpField>
          <RpField label="Department" htmlFor="pc-dept">
            <RpInput id="pc-dept" value={form.department} onChange={set('department')} />
          </RpField>
          <RpField label="Email" htmlFor="pc-email">
            <RpInput id="pc-email" inputMode="email" value={form.email} onChange={set('email')} />
          </RpField>
          <RpField label="Phone" htmlFor="pc-phone">
            <RpInput id="pc-phone" type="tel" value={form.phone} onChange={set('phone')} />
          </RpField>
        </RpFormGrid>
      </form>
    </RpModal>
  )
}
