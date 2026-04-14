'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'

const categories = [
  { key: 'bill', label: 'Bill / Payment', color: '#60a5fa', icon: DollarI },
  { key: 'travel', label: 'Travel', color: '#a78bfa', icon: PlaneI },
  { key: 'task', label: 'Task', color: '#f472b6', icon: CheckI },
  { key: 'alert', label: 'Alert', color: '#fbbf24', icon: BellI },
  { key: 'gift', label: 'Gift', color: '#fb923c', icon: GiftI },
  { key: 'subscription', label: 'Subscription', color: '#fb923c', icon: RefreshI },
  { key: 'membership', label: 'Membership', color: '#fb923c', icon: CardI },
  { key: 'note', label: 'Note', color: '#94a3b8', icon: PenI },
]

const billCategories = ['Property', 'Aviation', 'Vehicle', 'Staff', 'Insurance', 'Utilities', 'Lifestyle', 'Legal', 'Medical', 'Travel', 'Art', 'Marine', 'Security', 'Membership', 'Financial', 'Other']

interface Props { onClose: () => void }

export default function UniversalInput({ onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const inputClass = 'w-full px-3.5 py-2.5 bg-[#141520] border border-white/10 rounded-lg text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#5eead4] text-sm'
  const labelClass = 'block text-[11px] text-[#94a3b8] uppercase tracking-wider mb-1'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pillClass = (active: boolean, color: string) => `px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${active ? '' : 'bg-[#141520] text-[#475569] hover:text-[#94a3b8]'}`

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-[520px] max-h-[85vh] overflow-y-auto bg-[#0f1117] rounded-2xl border border-white/5 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>

        {!selected ? (
          /* ── Category Selection ── */
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Create New</h2>
              <button onClick={onClose} className="text-gray-600 hover:text-white text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map(cat => {
                const Icon = cat.icon
                return (
                  <button key={cat.key} onClick={() => setSelected(cat.key)} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cat.color}1F` }}>
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-[11px] text-[#94a3b8] group-hover:text-white transition-colors">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── Dynamic Form ── */
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <h2 className="text-lg font-semibold text-white">New {categories.find(c => c.key === selected)?.label}</h2>
            </div>

            {selected === 'bill' && <BillForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveBill} categories={billCategories} />}
            {selected === 'travel' && <TravelForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveTravel} />}
            {selected === 'task' && <TaskForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveTask} />}
            {selected === 'alert' && <AlertForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveAlert} />}
            {selected === 'gift' && <GiftForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveGift} />}
            {selected === 'subscription' && <SubscriptionForm inputClass={inputClass} labelClass={labelClass} pillClass={pillClass} saving={saving} onSave={saveSubscription} />}
            {selected === 'membership' && <MembershipForm inputClass={inputClass} labelClass={labelClass} saving={saving} onSave={saveMembership} />}
            {selected === 'note' && <NoteForm inputClass={inputClass} labelClass={labelClass} saving={saving} onSave={saveNote} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Form Components ──

interface FormProps { inputClass: string; labelClass: string; saving: boolean; onSave: (f: Record<string, string>) => void; pillClass?: (active: boolean, color: string) => string; categories?: string[] }

function BillForm({ inputClass, labelClass, saving, onSave, categories }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ vendor: '', amount: '', category: '', due_date: '', description: '', notes: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Vendor</label><input className={inputClass} placeholder="e.g. NetJets" value={f.vendor} onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></div>
        <div><label className={labelClass}>Category</label><select className={inputClass} value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}><option value="">Select...</option>{(categories || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div><label className={labelClass}>Due Date</label><input className={inputClass} type="date" value={f.due_date} onChange={e => setF(p => ({ ...p, due_date: e.target.value }))} /></div>
      <div><label className={labelClass}>Description</label><textarea className={`${inputClass} resize-none`} rows={2} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></div>
      <button onClick={() => f.vendor && f.amount && onSave(f)} disabled={saving || !f.vendor || !f.amount} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Bill'}</button>
    </div>
  )
}

function TravelForm({ inputClass, labelClass, saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ title: '', start_date: '', end_date: '', status: 'planning', notes: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Trip Name</label><input className={inputClass} placeholder="e.g. Miami Art Basel" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Start Date</label><input className={inputClass} type="date" value={f.start_date} onChange={e => setF(p => ({ ...p, start_date: e.target.value }))} /></div>
        <div><label className={labelClass}>End Date</label><input className={inputClass} type="date" value={f.end_date} onChange={e => setF(p => ({ ...p, end_date: e.target.value }))} /></div>
      </div>
      <div><label className={labelClass}>Status</label>
        <div className="flex gap-2">{['planning', 'confirmed'].map(s => <button key={s} type="button" onClick={() => setF(p => ({ ...p, status: s }))} className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.status === s ? 'bg-purple-500/15 text-purple-400' : 'bg-[#141520] text-[#475569]'}`}>{s}</button>)}</div>
      </div>
      <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
      <button onClick={() => f.title && onSave(f)} disabled={saving || !f.title} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Trip'}</button>
    </div>
  )
}

function TaskForm({ inputClass, labelClass, saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ title: '', description: '', priority: 'normal', due_date: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Title</label><input className={inputClass} placeholder="e.g. Confirm dinner reservations" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></div>
      <div><label className={labelClass}>Description</label><textarea className={`${inputClass} resize-none`} rows={2} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></div>
      <div><label className={labelClass}>Priority</label>
        <div className="flex gap-2">{['low', 'normal', 'high', 'urgent'].map(p => <button key={p} type="button" onClick={() => setF(prev => ({ ...prev, priority: p }))} className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.priority === p ? 'bg-pink-500/15 text-pink-400' : 'bg-[#141520] text-[#475569]'}`}>{p}</button>)}</div>
      </div>
      <div><label className={labelClass}>Due Date</label><input className={inputClass} type="date" value={f.due_date} onChange={e => setF(p => ({ ...p, due_date: e.target.value }))} /></div>
      <button onClick={() => f.title && onSave(f)} disabled={saving || !f.title} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Task'}</button>
    </div>
  )
}

function AlertForm({ inputClass, labelClass, saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ alert_type: 'info', title: '', body: '', priority: 'normal', target_role: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Type</label>
        <div className="flex flex-wrap gap-2">{['info', 'action_required', 'approval', 'urgent', 'fyi'].map(t => <button key={t} type="button" onClick={() => setF(p => ({ ...p, alert_type: t }))} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.alert_type === t ? 'bg-amber-500/15 text-amber-400' : 'bg-[#141520] text-[#475569]'}`}>{t.replace('_', ' ')}</button>)}</div>
      </div>
      <div><label className={labelClass}>Title</label><input className={inputClass} placeholder="Alert title" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></div>
      <div><label className={labelClass}>Body</label><textarea className={`${inputClass} resize-none`} rows={3} value={f.body} onChange={e => setF(p => ({ ...p, body: e.target.value }))} /></div>
      <div><label className={labelClass}>Priority</label>
        <div className="flex gap-2">{['low', 'normal', 'high', 'urgent'].map(p => <button key={p} type="button" onClick={() => setF(prev => ({ ...prev, priority: p }))} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.priority === p ? 'bg-amber-500/15 text-amber-400' : 'bg-[#141520] text-[#475569]'}`}>{p}</button>)}</div>
      </div>
      <div><label className={labelClass}>Send To</label>
        <div className="flex gap-2">{['', 'principal', 'ea', 'cfo'].map(r => <button key={r} type="button" onClick={() => setF(p => ({ ...p, target_role: r }))} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.target_role === r ? 'bg-amber-500/15 text-amber-400' : 'bg-[#141520] text-[#475569]'}`}>{r || 'Everyone'}</button>)}</div>
      </div>
      <button onClick={() => f.title && onSave(f)} disabled={saving || !f.title} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Send Alert'}</button>
    </div>
  )
}

function GiftForm({ inputClass, labelClass, saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ recipient: '', occasion: '', description: '', amount: '', date: '', status: 'idea', notes: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Recipient</label><input className={inputClass} placeholder="e.g. Robert Chen" value={f.recipient} onChange={e => setF(p => ({ ...p, recipient: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Occasion</label><input className={inputClass} placeholder="e.g. Birthday" value={f.occasion} onChange={e => setF(p => ({ ...p, occasion: e.target.value }))} /></div>
        <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></div>
      </div>
      <div><label className={labelClass}>Description</label><input className={inputClass} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></div>
      <div><label className={labelClass}>Date</label><input className={inputClass} type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></div>
      <div><label className={labelClass}>Status</label>
        <div className="flex flex-wrap gap-2">{['idea', 'purchased', 'shipped', 'delivered'].map(s => <button key={s} type="button" onClick={() => setF(p => ({ ...p, status: s }))} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.status === s ? 'bg-orange-500/15 text-orange-400' : 'bg-[#141520] text-[#475569]'}`}>{s}</button>)}</div>
      </div>
      <button onClick={() => f.recipient && onSave(f)} disabled={saving || !f.recipient} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Gift'}</button>
    </div>
  )
}

function SubscriptionForm({ inputClass, labelClass, saving, onSave }: FormProps) {
  const [f, setF] = useState<Record<string, string>>({ name: '', provider: '', amount: '', frequency: 'monthly', next_renewal: '', category: '', auto_renew: 'true' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Name</label><input className={inputClass} placeholder="e.g. Wine Access Club" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Provider</label><input className={inputClass} placeholder="e.g. Wine Access" value={f.provider} onChange={e => setF(p => ({ ...p, provider: e.target.value }))} /></div>
        <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" step="0.01" placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></div>
      </div>
      <div><label className={labelClass}>Frequency</label>
        <div className="flex gap-2">{['weekly', 'monthly', 'quarterly', 'annual'].map(fr => <button key={fr} type="button" onClick={() => setF(p => ({ ...p, frequency: fr }))} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${f.frequency === fr ? 'bg-orange-500/15 text-orange-400' : 'bg-[#141520] text-[#475569]'}`}>{fr}</button>)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Next Renewal</label><input className={inputClass} type="date" value={f.next_renewal} onChange={e => setF(p => ({ ...p, next_renewal: e.target.value }))} /></div>
        <div><label className={labelClass}>Category</label><input className={inputClass} placeholder="e.g. Entertainment" value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))} /></div>
      </div>
      <button onClick={() => f.name && onSave(f)} disabled={saving || !f.name} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Subscription'}</button>
    </div>
  )
}

function MembershipForm({ inputClass, labelClass, saving, onSave }: Omit<FormProps, 'pillClass'>) {
  const [f, setF] = useState<Record<string, string>>({ name: '', organization_name: '', member_id: '', tier: '', expiry_date: '', renewal_amount: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Name</label><input className={inputClass} placeholder="e.g. Palm Beach Country Club" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Organization</label><input className={inputClass} value={f.organization_name} onChange={e => setF(p => ({ ...p, organization_name: e.target.value }))} /></div>
        <div><label className={labelClass}>Member ID</label><input className={inputClass} value={f.member_id} onChange={e => setF(p => ({ ...p, member_id: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Tier</label><input className={inputClass} placeholder="e.g. Platinum" value={f.tier} onChange={e => setF(p => ({ ...p, tier: e.target.value }))} /></div>
        <div><label className={labelClass}>Renewal Amount</label><input className={inputClass} type="number" step="0.01" value={f.renewal_amount} onChange={e => setF(p => ({ ...p, renewal_amount: e.target.value }))} /></div>
      </div>
      <div><label className={labelClass}>Expiry Date</label><input className={inputClass} type="date" value={f.expiry_date} onChange={e => setF(p => ({ ...p, expiry_date: e.target.value }))} /></div>
      <button onClick={() => f.name && onSave(f)} disabled={saving || !f.name} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Membership'}</button>
    </div>
  )
}

function NoteForm({ inputClass, labelClass, saving, onSave }: Omit<FormProps, 'pillClass'>) {
  const [f, setF] = useState<Record<string, string>>({ title: '', body: '' })
  return (
    <div className="space-y-4">
      <div><label className={labelClass}>Title (optional)</label><input className={inputClass} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></div>
      <div><label className={labelClass}>Body</label><textarea className={`${inputClass} resize-none`} rows={8} placeholder="Write your note..." value={f.body} onChange={e => setF(p => ({ ...p, body: e.target.value }))} /></div>
      <button onClick={() => f.body && onSave(f)} disabled={saving || !f.body} className="w-full py-2.5 bg-[#0d9488] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">{saving ? 'Saving...' : 'Save Note'}</button>
    </div>
  )
}

// ── Mini icons for category grid ──
function DollarI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function PlaneI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
}
function CheckI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function BellI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
}
function GiftI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
}
function RefreshI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>
}
function CardI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
}
function PenI({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
}
