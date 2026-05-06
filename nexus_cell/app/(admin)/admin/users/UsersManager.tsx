'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import type { PendingInvitation, UserRole } from '@/lib/types'

interface UserRow {
  user_id: string
  role: string
  status: string
  created_at: string
  full_name: string | null
  email: string | null
}

interface Props {
  initialUsers: UserRow[]
  initialPending: PendingInvitation[]
  currentUserId: string
}

const ROLE_OPTIONS: UserRole[] = ['admin', 'ea', 'cfo', 'principal', 'viewer']
const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', ea: 'EA', cfo: 'CFO', principal: 'Principal', viewer: 'Viewer',
}
const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400',
  ea: 'bg-blue-500/15 text-blue-400',
  cfo: 'bg-purple-500/15 text-purple-400',
  principal: 'bg-emerald-500/15 text-emerald-400',
  viewer: 'bg-gray-500/15 text-gray-400',
}

export default function UsersManager({ initialUsers, initialPending, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [users] = useState(initialUsers)
  const [pending] = useState(initialPending)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null)
  const [approveTarget, setApproveTarget] = useState<PendingInvitation | null>(null)

  async function changeRole(userId: string, role: UserRole) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    toast(res.ok ? 'Role updated' : (data.error || 'Failed'), res.ok ? 'success' : 'error')
    if (res.ok) router.refresh()
  }

  async function toggleStatus(user: UserRow) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/admin/users/${user.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    toast(res.ok ? `User ${newStatus === 'active' ? 'reactivated' : 'deactivated'}` : (data.error || 'Failed'), res.ok ? 'success' : 'error')
    if (res.ok) router.refresh()
  }

  async function rejectInvite(inviteId: string) {
    const res = await fetch(`/api/admin/invitations/${inviteId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    toast(res.ok ? 'Invitation rejected' : (data.error || 'Failed'), res.ok ? 'success' : 'error')
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Pending invitations (top — needs admin attention) */}
      {pending.length > 0 && (
        <section className="bg-card-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-white">Pending invitations</h2>
              <p className="text-xs text-gray-500 mt-0.5">EA-proposed users waiting for your approval</p>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
              {pending.length} pending
            </span>
          </div>
          <ul className="space-y-2 m-0 p-0 list-none">
            {pending.map(inv => {
              const proposer = (inv as unknown as { proposed_by_profile: { full_name: string | null; email: string } | null }).proposed_by_profile
              return (
                <li key={inv.id} className="bg-[#141520] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{inv.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {inv.email} · <span className={`px-1.5 py-0.5 rounded text-[10px] ${ROLE_COLOR[inv.role] || ''}`}>{ROLE_LABEL[inv.role] || inv.role}</span>
                        {proposer && <> · proposed by {proposer.full_name || proposer.email}</>}
                      </p>
                      {inv.notes && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{inv.notes}&rdquo;</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setApproveTarget(inv)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectInvite(inv.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Members table */}
      <section className="bg-card-dark rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Members</h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-3 py-1.5 bg-emerald-500 hover:brightness-110 text-white text-xs font-medium rounded-lg transition-all"
          >
            + Create user
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-left text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u.user_id === currentUserId
                return (
                  <tr key={u.user_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="text-white">{u.full_name || '—'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <span className={`text-xs px-2 py-1 rounded ${ROLE_COLOR[u.role] || ''}`}>{ROLE_LABEL[u.role] || u.role} (you)</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.user_id, e.target.value as UserRole)}
                          className="bg-[#141520] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-400/50"
                        >
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setResetTarget(u)}
                          disabled={isSelf}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelf ? 'Use Settings to change your own password' : 'Reset password'}
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={isSelf}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen && <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); router.refresh() }} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} onReset={() => { setResetTarget(null); router.refresh() }} />}
      {approveTarget && <ApproveInviteModal invite={approveTarget} onClose={() => setApproveTarget(null)} onApproved={() => { setApproveTarget(null); router.refresh() }} />}
    </div>
  )
}

// ───── Modals ─────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), password, role }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('User created — share credentials with them', 'success')
        onCreated()
      } else {
        setErr(data.error || 'Failed to create user')
      }
    } catch {
      setErr('Network error')
    }
    setSubmitting(false)
  }

  return (
    <ModalShell title="Create user" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full name"><input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" autoComplete="off" /></Field>
        <Field label="Password" hint="At least 8 characters. Share this with the new user.">
          <input type="text" className={inputCls + ' font-mono'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a strong password" autoComplete="new-password" />
        </Field>
        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg">Cancel</button>
          <button onClick={submit} disabled={submitting || !email || !fullName || password.length < 8} className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-medium text-sm rounded-lg">
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ResetPasswordModal({ user, onClose, onReset }: { user: UserRow; onClose: () => void; onReset: () => void }) {
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.user_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Password reset — share new password with user', 'success')
        onReset()
      } else {
        setErr(data.error || 'Failed to reset')
      }
    } catch {
      setErr('Network error')
    }
    setSubmitting(false)
  }

  return (
    <ModalShell title={`Reset password for ${user.full_name || user.email}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="New password" hint="At least 8 characters. Share this with the user.">
          <input type="text" className={inputCls + ' font-mono'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg">Cancel</button>
          <button onClick={submit} disabled={submitting || password.length < 8} className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-medium text-sm rounded-lg">
            {submitting ? 'Resetting…' : 'Reset'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ApproveInviteModal({ invite, onClose, onApproved }: { invite: PendingInvitation; onClose: () => void; onApproved: () => void }) {
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/invitations/${invite.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('User created from invitation — share credentials', 'success')
        onApproved()
      } else {
        setErr(data.error || 'Failed to approve')
      }
    } catch {
      setErr('Network error')
    }
    setSubmitting(false)
  }

  return (
    <ModalShell title={`Approve invitation for ${invite.full_name}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          Email: <span className="text-white">{invite.email}</span> · Role: <span className="text-white">{ROLE_LABEL[invite.role] || invite.role}</span>
        </p>
        <Field label="Set password" hint="At least 8 characters. Share this with the new user.">
          <input type="text" className={inputCls + ' font-mono'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg">Cancel</button>
          <button onClick={submit} disabled={submitting || password.length < 8} className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-medium text-sm rounded-lg">
            {submitting ? 'Creating…' : 'Approve & create'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ───── Tiny shared bits ─────

const inputCls = 'w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#10131b] rounded-xl shadow-2xl shadow-black/40 w-full max-w-md p-6 border border-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}
