'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import NexusEnergyOrb from '@/components/NexusEnergyOrb'
import NexusCharacter from '@/components/NexusCharacter'

interface Props {
  initialFullName: string
  email: string
  canSuggestUsers?: boolean
  initialHeroStyle?: 'orb' | 'character'
}

type Tab = 'profile' | 'password' | 'appearance' | 'suggest_user'

export default function SettingsTabs({ initialFullName, email, canSuggestUsers, initialHeroStyle = 'orb' }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('profile')

  // Profile state
  const [fullName, setFullName] = useState(initialFullName)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Appearance — hero style
  const [heroStyle, setHeroStyle] = useState<'orb' | 'character'>(initialHeroStyle)
  const [savingHero, setSavingHero] = useState<'orb' | 'character' | null>(null)

  async function saveHeroStyle(next: 'orb' | 'character') {
    if (next === heroStyle || savingHero) return
    setSavingHero(next)
    // Optimistic — preview swaps immediately, revert on error.
    const prev = heroStyle
    setHeroStyle(next)
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero_style: next }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Appearance updated — refresh the home page to see it.', 'success')
        router.refresh()
      } else {
        setHeroStyle(prev)
        toast(data.error || 'Failed to save', 'error')
      }
    } catch {
      setHeroStyle(prev)
      toast('Failed to save', 'error')
    }
    setSavingHero(null)
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Profile updated', 'success')
        router.refresh()
      } else {
        toast(data.error || 'Failed to save', 'error')
      }
    } catch {
      toast('Failed to save', 'error')
    }
    setSavingProfile(false)
  }

  async function changePassword() {
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Password changed', 'success')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch {
      setPasswordError('Failed to change password')
    }
    setSavingPassword(false)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {(['profile', 'password', 'appearance', ...(canSuggestUsers ? ['suggest_user' as Tab] : [])] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? 'text-white border-emerald-400'
                : 'text-gray-500 hover:text-white border-transparent'
            }`}
          >
            {t === 'profile' ? 'Profile' : t === 'password' ? 'Password' : t === 'appearance' ? 'Appearance' : 'Suggest a user'}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="bg-card-dark rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-[#0c0d14] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-600 mt-1.5">Email changes are managed by your administrator.</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={saveProfile}
              disabled={savingProfile || fullName.trim() === initialFullName.trim() || fullName.trim().length === 0}
              className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-all"
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Appearance tab — pick the hero element on the command panel */}
      {tab === 'appearance' && (
        <div className="bg-card-dark rounded-xl p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Choose what greets you on the command panel. Both behave identically — different vibes only.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HeroChoiceCard
              label="Energy Orb"
              caption="Glowing sphere with subtle particles and ripples."
              selected={heroStyle === 'orb'}
              saving={savingHero === 'orb'}
              onClick={() => saveHeroStyle('orb')}
            >
              <div className="pointer-events-none scale-[0.4] origin-center">
                <NexusEnergyOrb size={200} />
              </div>
            </HeroChoiceCard>
            <HeroChoiceCard
              label="Character"
              caption="Half-dome face with eyes that follow your cursor."
              selected={heroStyle === 'character'}
              saving={savingHero === 'character'}
              onClick={() => saveHeroStyle('character')}
            >
              <div className="pointer-events-none scale-[0.45] origin-center">
                <NexusCharacter size={200} />
              </div>
            </HeroChoiceCard>
          </div>
          <p className="text-[11px] text-gray-600">
            Refresh the command panel after switching to see the change.
          </p>
        </div>
      )}

      {/* Suggest a user tab — EA proposes, admin approves */}
      {tab === 'suggest_user' && canSuggestUsers && <SuggestUserPanel />}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="bg-card-dark rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
              placeholder="Repeat the new password"
            />
          </div>
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          <div className="flex justify-end pt-2">
            <button
              onClick={changePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-all"
            >
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// EA-only panel for proposing a new user. Submits to /api/admin/invitations
// which creates a pending row; admin reviews + approves in /admin/users.
function SuggestUserPanel() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'principal' | 'ea' | 'cfo' | 'viewer'>('viewer')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          role,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Suggestion sent — awaiting admin approval', 'success')
        setEmail('')
        setFullName('')
        setRole('viewer')
        setNotes('')
      } else {
        setErr(data.error || 'Failed to submit')
      }
    } catch {
      setErr('Network error')
    }
    setSubmitting(false)
  }

  const inputCls = 'w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50'

  return (
    <div className="bg-card-dark rounded-xl p-5 space-y-4">
      <p className="text-xs text-gray-500">
        Suggest a new user. An administrator will review your suggestion, set a password, and create the account. They&apos;ll relay credentials to the new user.
      </p>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Full name</label>
        <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
        <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
        <select className={inputCls} value={role} onChange={e => setRole(e.target.value as typeof role)}>
          <option value="viewer">Viewer</option>
          <option value="principal">Principal</option>
          <option value="ea">EA</option>
          <option value="cfo">CFO</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
        <textarea
          className={inputCls + ' min-h-[72px] resize-none'}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Why should this person be added? Any context for the admin."
        />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex justify-end pt-2">
        <button
          onClick={submit}
          disabled={submitting || !email || !fullName}
          className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-all"
        >
          {submitting ? 'Sending…' : 'Send for approval'}
        </button>
      </div>
    </div>
  )
}

// Reusable card for the Appearance picker. Shows a scaled-down preview of
// the hero element + label, with a teal border + checkmark when selected.
function HeroChoiceCard({
  label,
  caption,
  selected,
  saving,
  onClick,
  children,
}: {
  label: string
  caption: string
  selected: boolean
  saving: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`relative bg-[#141520] rounded-xl p-4 text-left transition-all border-2 disabled:opacity-60 ${
        selected
          ? 'border-emerald-400/60 ring-1 ring-emerald-400/30'
          : 'border-white/[0.06] hover:border-white/[0.15]'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className="h-32 flex items-center justify-center overflow-hidden mb-3">
        {children}
      </div>
      <p className="text-sm text-white font-medium">{label}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{caption}</p>
    </button>
  )
}
