'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import type { PendingInvitation, UserRole } from '@/lib/types'
import {
  RpSubhead,
  RpTable,
  RpStatus,
  RpTag,
  RpButton,
  RpEmpty,
  RpModal,
  RpField,
  RpInput,
  RpSelect,
  Plus,
  fmtDate,
  dot,
} from '@/components/rp'

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
  admin: 'Administrator', ea: "Owner's Rep", cfo: 'CFO', principal: 'Owner', viewer: 'Viewer',
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
    <div className="flex flex-col gap-[var(--rp-gap)]">
      {/* Pending invitations (top — needs admin attention) */}
      {pending.length > 0 && (
        <section className="flex flex-col gap-5">
          <RpSubhead
            flush
            title="Pending invitations"
            spec="Proposed by the owner's rep, waiting for your approval"
            aside={<RpTag tone="gold">{pending.length} pending</RpTag>}
          />
          <RpTable minWidth={860} caption="Pending invitations">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Proposed by</th>
                <th>Date</th>
                <th className="num relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {pending.map(inv => {
                const proposer = (inv as unknown as { proposed_by_profile: { full_name: string | null; email: string } | null }).proposed_by_profile
                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="font-medium text-rp-text">{inv.full_name}</span>
                      {inv.notes && <span className="sub">&ldquo;{inv.notes}&rdquo;</span>}
                    </td>
                    <td className="text-rp-muted">{inv.email}</td>
                    <td><RpStatus kind="role" value={inv.role} /></td>
                    <td className="text-rp-muted">{proposer ? (proposer.full_name || proposer.email) : '—'}</td>
                    <td className="whitespace-nowrap text-rp-muted">{fmtDate(inv.created_at)}</td>
                    <td className="num">
                      <span className="inline-flex items-center gap-2">
                        <RpButton size="sm" onClick={() => setApproveTarget(inv)}>Approve</RpButton>
                        <RpButton variant="danger" size="sm" onClick={() => rejectInvite(inv.id)}>Reject</RpButton>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </RpTable>
        </section>
      )}

      {/* Members table */}
      <section className="flex flex-col gap-5">
        <RpSubhead
          flush={pending.length === 0}
          title="Members"
          spec={dot(`${users.length} account${users.length !== 1 ? 's' : ''}`, `${users.filter(u => u.status === 'active').length} active`)}
          aside={<RpButton size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => setCreateOpen(true)}>Create user</RpButton>}
        />
        {users.length === 0 ? (
          <RpEmpty compact title="No members yet." line="Create the first account, or approve an invitation from the owner's rep." />
        ) : (
          <RpTable minWidth={880} caption="Members">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="num relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u.user_id === currentUserId
                return (
                  <tr key={u.user_id}>
                    <td>
                      <span className="font-medium text-rp-text">{u.full_name || '—'}</span>
                      {isSelf && <span className="sub">You</span>}
                    </td>
                    <td className="text-rp-muted">{u.email}</td>
                    <td>
                      {isSelf ? (
                        <RpStatus kind="role" value={u.role} />
                      ) : (
                        <RpSelect
                          value={u.role}
                          onChange={e => changeRole(u.user_id, e.target.value as UserRole)}
                          aria-label={`Role for ${u.full_name || u.email || 'member'}`}
                          className="!min-h-9 w-[180px] text-[14px]"
                        >
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </RpSelect>
                      )}
                    </td>
                    <td><RpStatus kind="member" value={u.status} /></td>
                    <td className="num">
                      <span className="inline-flex items-center gap-2">
                        <RpButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetTarget(u)}
                          disabled={isSelf}
                          title={isSelf ? 'Use Settings to change your own password' : 'Reset password'}
                        >
                          Reset password
                        </RpButton>
                        <RpButton
                          variant={u.status === 'active' ? 'danger' : 'ghost'}
                          size="sm"
                          onClick={() => toggleStatus(u)}
                          disabled={isSelf}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </RpButton>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </RpTable>
        )}
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
    <RpModal
      open
      onClose={onClose}
      size="sm"
      eyebrow="New member"
      title="Create user"
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton onClick={submit} disabled={submitting || !email || !fullName || password.length < 8}>
            {submitting ? 'Creating…' : 'Create'}
          </RpButton>
        </>
      }
    >
      <RpField label="Full name" htmlFor="cu-name"><RpInput id="cu-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" /></RpField>
      <RpField label="Email" htmlFor="cu-email"><RpInput id="cu-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" autoComplete="off" /></RpField>
      <RpField label="Password" htmlFor="cu-password" hint="At least 8 characters. Share this with the new user.">
        <RpInput id="cu-password" type="text" className="tracking-[.04em]" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a strong password" autoComplete="new-password" />
      </RpField>
      <RpField label="Role" htmlFor="cu-role">
        <RpSelect id="cu-role" value={role} onChange={e => setRole(e.target.value as UserRole)}>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </RpSelect>
      </RpField>
      {err && <p className="rp-error" role="alert">{err}</p>}
    </RpModal>
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
    <RpModal
      open
      onClose={onClose}
      size="sm"
      eyebrow="Reset password"
      title={user.full_name || user.email || 'Member'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton onClick={submit} disabled={submitting || password.length < 8}>
            {submitting ? 'Resetting…' : 'Reset'}
          </RpButton>
        </>
      }
    >
      <RpField label="New password" htmlFor="rp-new-password" hint="At least 8 characters. Share this with the user.">
        <RpInput id="rp-new-password" type="text" className="tracking-[.04em]" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
      </RpField>
      {err && <p className="rp-error" role="alert">{err}</p>}
    </RpModal>
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
    <RpModal
      open
      onClose={onClose}
      size="sm"
      eyebrow="Approve invitation"
      title={invite.full_name}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton onClick={submit} disabled={submitting || password.length < 8}>
            {submitting ? 'Creating…' : 'Approve & create'}
          </RpButton>
        </>
      }
    >
      <p className="text-[15px] text-rp-muted">
        {invite.email} · <span className="text-rp-text">{ROLE_LABEL[invite.role] || invite.role}</span>
      </p>
      <RpField label="Set password" htmlFor="ai-password" hint="At least 8 characters. Share this with the new user.">
        <RpInput id="ai-password" type="text" className="tracking-[.04em]" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
      </RpField>
      {err && <p className="rp-error" role="alert">{err}</p>}
    </RpModal>
  )
}
