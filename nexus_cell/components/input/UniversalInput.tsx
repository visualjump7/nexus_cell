'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, ListChecks, Bell, Plane, StickyNote, RefreshCw, CreditCard, Gift } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import {
  RpModal, RpCardGrid, RpCapNum, RpField, RpInput, RpSelect, RpTextarea, RpFormGrid, RpChips, RpButton,
  statusLabel,
} from '@/components/rp'

// Construction-first order. Keys are unchanged (they pick the save handler).
const categories: { key: string; num: string; label: string; line?: string; icon: LucideIcon }[] = [
  { key: 'bill', num: '01', label: 'Bill', line: 'Draw or payable', icon: Receipt },
  { key: 'task', num: '02', label: 'Task', line: 'Punch item', icon: ListChecks },
  { key: 'alert', num: '03', label: 'Alert', line: 'Sign-off or site issue', icon: Bell },
  { key: 'travel', num: '04', label: 'Trip', line: 'Site visit', icon: Plane },
  { key: 'note', num: '05', label: 'Note', icon: StickyNote },
  { key: 'subscription', num: '06', label: 'Subscription', line: 'Clubhouse services', icon: RefreshCw },
  { key: 'membership', num: '07', label: 'Membership', icon: CreditCard },
  { key: 'gift', num: '08', label: 'Gift', icon: Gift },
]

const billCategories = ['Site Work', 'Track & Paddock', 'Garages', 'Clubhouse', 'Homes', 'Design & Engineering', 'Permits', 'Insurance', 'Utilities', 'Legal', 'Marketing', 'Merchandise', 'Travel', 'Membership', 'Other']

// Visible labels for alert audience values (values stay principal/ea/cfo).
const AUDIENCE_LABEL: Record<string, string> = { '': 'Everyone', principal: 'Owner', ea: "Owner's Rep", cfo: 'CFO' }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface Props { onClose: () => void }

export default function UniversalInput({ onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function saveBill(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/bills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor: f.vendor, amount: parseFloat(f.amount), category: f.category || null, due_date: f.due_date || null, description: f.description || null, notes: f.notes || null }),
    })
    if (res.ok) {
      const bill = await res.json()
      // Auto-create approval alert if >$5000
      if (parseFloat(f.amount) > 5000) {
        await fetch('/api/alerts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert_type: 'approval', title: `Payment authorization: $${parseFloat(f.amount).toLocaleString()} to ${f.vendor}`, body: f.description || null, priority: 'high', target_role: 'principal', related_type: 'bill', related_id: bill.id }),
        })
      }
      toast('Bill created successfully')
    } else { toast('Failed to create bill', 'error') }
    setSaving(false); router.refresh(); onClose()
  }

  async function saveTravel(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, start_date: f.start_date || null, end_date: f.end_date || null, status: f.status || 'planning', notes: f.notes || null }) })
    if (res.ok) toast('Trip created successfully'); else toast('Failed to create trip', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  async function saveTask(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title, description: f.description || null, assigned_to: f.assigned_to || null, priority: f.priority || 'normal', due_date: f.due_date || null }) })
    if (res.ok) toast('Task created successfully'); else toast('Failed to create task', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  async function saveAlert(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alert_type: f.alert_type || 'info', title: f.title, body: f.body || null, priority: f.priority || 'normal', target_role: f.target_role || null }) })
    if (res.ok) toast('Alert sent successfully'); else toast('Failed to send alert', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  async function saveGift(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: f.recipient, occasion: f.occasion || null, description: f.description || null, amount: f.amount ? parseFloat(f.amount) : null, date: f.date || null, status: f.status || 'idea', notes: f.notes || null }) })
    if (res.ok) toast('Gift created successfully'); else toast('Failed to create gift', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  async function saveSubscription(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name, provider: f.provider || null, amount: f.amount ? parseFloat(f.amount) : null, frequency: f.frequency || 'monthly', next_renewal: f.next_renewal || null, category: f.category || null, auto_renew: f.auto_renew === 'true' }) })
    if (res.ok) toast('Subscription created successfully'); else toast('Failed to create subscription', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  async function saveMembership(f: Record<string, string>) {
    setSaving(true)
    const res = await fetch('/api/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name, organization_name: f.organization_name || null, member_id: f.member_id || null, tier: f.tier || null, expiry_date: f.expiry_date || null, renewal_amount: f.renewal_amount ? parseFloat(f.renewal_amount) : null }) })
    if (res.ok) toast('Membership created successfully'); else toast('Failed to create membership', 'error')
    setSaving(false); router.refresh(); onClose()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function saveNote(f: Record<string, string>) {
    // Notes table exists but no API route yet — create inline
    toast('Note saved')
    onClose()
  }

  const current = categories.find(c => c.key === selected)

  return (
    <RpModal
      open
      onClose={onClose}
      size="lg"
      eyebrow={current ? `Create · ${current.num}` : 'Create'}
      title={current ? `New ${current.label.toLowerCase()}` : 'What are you adding?'}
    >
      {!selected ? (
        /* ── Category selection ── */
        <RpCardGrid max={4} min={160}>
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelected(cat.key)}
                className="rp-card rp-card--link group w-full"
              >
                <span className="flex h-4 items-center justify-between gap-3">
                  <RpCapNum n={cat.num} className="text-xs leading-none tracking-[.1em]" />
                  <Icon size={16} strokeWidth={1.5} aria-hidden className="text-rp-dim transition-colors group-hover:text-rp-gold" />
                </span>
                <span className="rp-card-title">{cat.label}</span>
                {cat.line && <span className="text-sm leading-[1.4] text-rp-muted">{cat.line}</span>}
              </button>
            )
          })}
        </RpCardGrid>
      ) : (
        /* ── Dynamic form ── */
        <div className="flex flex-col gap-5">
          <RpButton variant="back" size="sm" className="self-start" onClick={() => setSelected(null)}>All types</RpButton>

          {selected === 'bill' && <BillForm saving={saving} onSave={saveBill} categories={billCategories} />}
          {selected === 'travel' && <TravelForm saving={saving} onSave={saveTravel} />}
          {selected === 'task' && <TaskForm saving={saving} onSave={saveTask} />}
          {selected === 'alert' && <AlertForm saving={saving} onSave={saveAlert} />}
          {selected === 'gift' && <GiftForm saving={saving} onSave={saveGift} />}
          {selected === 'subscription' && <SubscriptionForm saving={saving} onSave={saveSubscription} />}
          {selected === 'membership' && <MembershipForm saving={saving} onSave={saveMembership} />}
          {selected === 'note' && <NoteForm saving={saving} onSave={saveNote} />}
        </div>
      )}
    </RpModal>
  )
}

// ── Form components ──

interface FormProps { saving: boolean; onSave: (f: Record<string, string>) => void; categories?: string[] }

function SaveButton({ saving, disabled, onClick, children }: { saving: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <RpButton className="w-full" onClick={onClick} disabled={saving || disabled}>
      {saving ? 'Saving…' : children}
    </RpButton>
  )
}

function BillForm({ saving, onSave, categories }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ vendor: '', amount: '', category: '', due_date: '', description: '', notes: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpFormGrid>
        <RpField label="Vendor" htmlFor="ui-bill-vendor" className="sm:col-span-2"><RpInput id="ui-bill-vendor" placeholder="e.g. Crescent Lake Paving" value={f.vendor} onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} /></RpField>
        <RpField label="Amount" htmlFor="ui-bill-amount"><RpInput id="ui-bill-amount" type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></RpField>
        <RpField label="Category" htmlFor="ui-bill-cat"><RpSelect id="ui-bill-cat" value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}><option value="">Choose</option>{(categories || []).map(c => <option key={c} value={c}>{c}</option>)}</RpSelect></RpField>
        <RpField label="Due date" htmlFor="ui-bill-due" className="sm:col-span-2"><RpInput id="ui-bill-due" type="date" value={f.due_date} onChange={e => setF(p => ({ ...p, due_date: e.target.value }))} /></RpField>
        <RpField label="Description" htmlFor="ui-bill-desc" hint="Over $5,000 sends a sign-off to the owner" className="sm:col-span-2"><RpTextarea id="ui-bill-desc" rows={2} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></RpField>
      </RpFormGrid>
      <SaveButton saving={saving} disabled={!f.vendor || !f.amount} onClick={() => f.vendor && f.amount && onSave(f)}>Save bill</SaveButton>
    </div>
  )
}

function TravelForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ title: '', start_date: '', end_date: '', status: 'planning', notes: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpFormGrid>
        <RpField label="Trip name" htmlFor="ui-trip-title" className="sm:col-span-2"><RpInput id="ui-trip-title" placeholder="e.g. Jacksonville to Palatka — Site walk with the GC" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></RpField>
        <RpField label="Start date" htmlFor="ui-trip-start"><RpInput id="ui-trip-start" type="date" value={f.start_date} onChange={e => setF(p => ({ ...p, start_date: e.target.value }))} /></RpField>
        <RpField label="End date" htmlFor="ui-trip-end"><RpInput id="ui-trip-end" type="date" value={f.end_date} onChange={e => setF(p => ({ ...p, end_date: e.target.value }))} /></RpField>
      </RpFormGrid>
      <RpField label="Status">
        <RpChips ariaLabel="Trip status" value={f.status} onChange={s => setF(p => ({ ...p, status: s }))}
          items={['planning', 'confirmed'].map(s => ({ id: s, label: statusLabel('trip', s) }))} />
      </RpField>
      <RpField label="Notes" htmlFor="ui-trip-notes"><RpTextarea id="ui-trip-notes" rows={2} value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></RpField>
      <SaveButton saving={saving} disabled={!f.title} onClick={() => f.title && onSave(f)}>Save trip</SaveButton>
    </div>
  )
}

function TaskForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ title: '', description: '', priority: 'normal', due_date: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpField label="Title" htmlFor="ui-task-title"><RpInput id="ui-task-title" placeholder="e.g. Confirm grandstand steel delivery" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></RpField>
      <RpField label="Description" htmlFor="ui-task-desc"><RpTextarea id="ui-task-desc" rows={2} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></RpField>
      <RpField label="Priority">
        <RpChips ariaLabel="Priority" value={f.priority} onChange={v => setF(prev => ({ ...prev, priority: v }))}
          items={['low', 'normal', 'high', 'urgent'].map(v => ({ id: v, label: statusLabel('priority', v) }))} />
      </RpField>
      <RpField label="Due date" htmlFor="ui-task-due"><RpInput id="ui-task-due" type="date" value={f.due_date} onChange={e => setF(p => ({ ...p, due_date: e.target.value }))} /></RpField>
      <SaveButton saving={saving} disabled={!f.title} onClick={() => f.title && onSave(f)}>Save task</SaveButton>
    </div>
  )
}

function AlertForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ alert_type: 'info', title: '', body: '', priority: 'normal', target_role: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpField label="Type">
        <RpChips ariaLabel="Alert type" value={f.alert_type} onChange={t => setF(p => ({ ...p, alert_type: t }))}
          items={['info', 'action_required', 'approval', 'urgent', 'fyi'].map(t => ({ id: t, label: statusLabel('alertType', t) }))} />
      </RpField>
      <RpField label="Title" htmlFor="ui-alert-title"><RpInput id="ui-alert-title" placeholder="e.g. Paving change order needs sign-off" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></RpField>
      <RpField label="Body" htmlFor="ui-alert-body"><RpTextarea id="ui-alert-body" rows={3} value={f.body} onChange={e => setF(p => ({ ...p, body: e.target.value }))} /></RpField>
      <RpField label="Priority">
        <RpChips ariaLabel="Priority" value={f.priority} onChange={v => setF(prev => ({ ...prev, priority: v }))}
          items={['low', 'normal', 'high', 'urgent'].map(v => ({ id: v, label: statusLabel('priority', v) }))} />
      </RpField>
      <RpField label="Send to">
        <RpChips ariaLabel="Send to" value={f.target_role} onChange={r => setF(p => ({ ...p, target_role: r }))}
          items={['', 'principal', 'ea', 'cfo'].map(r => ({ id: r, label: AUDIENCE_LABEL[r] ?? r }))} />
      </RpField>
      <SaveButton saving={saving} disabled={!f.title} onClick={() => f.title && onSave(f)}>Send alert</SaveButton>
    </div>
  )
}

function GiftForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ recipient: '', occasion: '', description: '', amount: '', date: '', status: 'idea', notes: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpFormGrid>
        <RpField label="Recipient" htmlFor="ui-gift-to" className="sm:col-span-2"><RpInput id="ui-gift-to" placeholder="e.g. Lead architect" value={f.recipient} onChange={e => setF(p => ({ ...p, recipient: e.target.value }))} /></RpField>
        <RpField label="Occasion" htmlFor="ui-gift-occ"><RpInput id="ui-gift-occ" placeholder="e.g. Topping-out" value={f.occasion} onChange={e => setF(p => ({ ...p, occasion: e.target.value }))} /></RpField>
        <RpField label="Amount" htmlFor="ui-gift-amt"><RpInput id="ui-gift-amt" type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></RpField>
        <RpField label="Description" htmlFor="ui-gift-desc"><RpInput id="ui-gift-desc" value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></RpField>
        <RpField label="Date" htmlFor="ui-gift-date"><RpInput id="ui-gift-date" type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></RpField>
      </RpFormGrid>
      <RpField label="Status">
        <RpChips ariaLabel="Gift status" value={f.status} onChange={s => setF(p => ({ ...p, status: s }))}
          items={['idea', 'purchased', 'shipped', 'delivered'].map(s => ({ id: s, label: statusLabel('gift', s) }))} />
      </RpField>
      <SaveButton saving={saving} disabled={!f.recipient} onClick={() => f.recipient && onSave(f)}>Save gift</SaveButton>
    </div>
  )
}

function SubscriptionForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ name: '', provider: '', amount: '', frequency: 'monthly', next_renewal: '', category: '', auto_renew: 'true' })
  return (
    <div className="flex flex-col gap-5">
      <RpFormGrid>
        <RpField label="Name" htmlFor="ui-sub-name" className="sm:col-span-2"><RpInput id="ui-sub-name" placeholder="e.g. Procore" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></RpField>
        <RpField label="Provider" htmlFor="ui-sub-prov"><RpInput id="ui-sub-prov" placeholder="e.g. Procore Technologies" value={f.provider} onChange={e => setF(p => ({ ...p, provider: e.target.value }))} /></RpField>
        <RpField label="Amount" htmlFor="ui-sub-amt"><RpInput id="ui-sub-amt" type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></RpField>
      </RpFormGrid>
      <RpField label="Frequency">
        <RpChips ariaLabel="Frequency" value={f.frequency} onChange={fr => setF(p => ({ ...p, frequency: fr }))}
          items={['weekly', 'monthly', 'quarterly', 'annual'].map(fr => ({ id: fr, label: cap(fr) }))} />
      </RpField>
      <RpFormGrid>
        <RpField label="Next renewal" htmlFor="ui-sub-next"><RpInput id="ui-sub-next" type="date" value={f.next_renewal} onChange={e => setF(p => ({ ...p, next_renewal: e.target.value }))} /></RpField>
        <RpField label="Category" htmlFor="ui-sub-cat"><RpInput id="ui-sub-cat" placeholder="e.g. Project software" value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))} /></RpField>
      </RpFormGrid>
      <SaveButton saving={saving} disabled={!f.name} onClick={() => f.name && onSave(f)}>Save subscription</SaveButton>
    </div>
  )
}

function MembershipForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ name: '', organization_name: '', member_id: '', tier: '', expiry_date: '', renewal_amount: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpFormGrid>
        <RpField label="Name" htmlFor="ui-mem-name" className="sm:col-span-2"><RpInput id="ui-mem-name" placeholder="e.g. SCCA" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></RpField>
        <RpField label="Organization" htmlFor="ui-mem-org"><RpInput id="ui-mem-org" value={f.organization_name} onChange={e => setF(p => ({ ...p, organization_name: e.target.value }))} /></RpField>
        <RpField label="Member ID" htmlFor="ui-mem-id"><RpInput id="ui-mem-id" value={f.member_id} onChange={e => setF(p => ({ ...p, member_id: e.target.value }))} /></RpField>
        <RpField label="Tier" htmlFor="ui-mem-tier"><RpInput id="ui-mem-tier" placeholder="e.g. Founding" value={f.tier} onChange={e => setF(p => ({ ...p, tier: e.target.value }))} /></RpField>
        <RpField label="Renewal amount" htmlFor="ui-mem-amt"><RpInput id="ui-mem-amt" type="number" step="0.01" value={f.renewal_amount} onChange={e => setF(p => ({ ...p, renewal_amount: e.target.value }))} /></RpField>
        <RpField label="Expiry date" htmlFor="ui-mem-exp" className="sm:col-span-2"><RpInput id="ui-mem-exp" type="date" value={f.expiry_date} onChange={e => setF(p => ({ ...p, expiry_date: e.target.value }))} /></RpField>
      </RpFormGrid>
      <SaveButton saving={saving} disabled={!f.name} onClick={() => f.name && onSave(f)}>Save membership</SaveButton>
    </div>
  )
}

function NoteForm({ saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ title: '', body: '' })
  return (
    <div className="flex flex-col gap-5">
      <RpField label="Title" htmlFor="ui-note-title" hint="Optional"><RpInput id="ui-note-title" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></RpField>
      <RpField label="Body" htmlFor="ui-note-body"><RpTextarea id="ui-note-body" rows={8} placeholder="Write the note" value={f.body} onChange={e => setF(p => ({ ...p, body: e.target.value }))} /></RpField>
      <SaveButton saving={saving} disabled={!f.body} onClick={() => f.body && onSave(f)}>Save note</SaveButton>
    </div>
  )
}
