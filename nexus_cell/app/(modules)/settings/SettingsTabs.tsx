'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import NexusEnergyOrb from '@/components/NexusEnergyOrb'
import NexusCharacter from '@/components/NexusCharacter'
import {
  RpTabs,
  RpBox,
  RpEyebrow,
  RpField,
  RpInput,
  RpSelect,
  RpTextarea,
  RpFormGrid,
  RpButton,
  RpCardGrid,
} from '@/components/rp'

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

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'appearance', label: 'Appearance' },
    ...(canSuggestUsers ? [{ id: 'suggest_user', label: 'Suggest a user' }] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <RpTabs ariaLabel="Account settings" items={tabs} value={tab} onChange={id => setTab(id as Tab)} />

      {/* Profile tab */}
      {tab === 'profile' && (
        <RpBox pad="lg" className="flex max-w-[640px] flex-col gap-5">
          <RpEyebrow tone="muted">Profile</RpEyebrow>
          <RpField label="Full name" htmlFor="settings-name">
            <RpInput
              id="settings-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </RpField>
          <RpField label="Email" htmlFor="settings-email" hint="Email changes are managed by your administrator.">
            <RpInput id="settings-email" type="email" value={email} disabled />
          </RpField>
          <div className="flex justify-end border-t border-rp-line pt-5">
            <RpButton
              onClick={saveProfile}
              disabled={savingProfile || fullName.trim() === initialFullName.trim() || fullName.trim().length === 0}
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </RpButton>
          </div>
        </RpBox>
      )}

      {/* Appearance tab — pick the hero element on the command panel */}
      {tab === 'appearance' && (
        <div className="flex flex-col gap-5">
          <p className="max-w-[60ch] text-[15px] leading-normal text-rp-muted">
            Choose what greets you on the home screen. Both behave the same; only the look changes.
          </p>
          <RpCardGrid max={2} min={260} className="max-w-[860px]">
            <HeroChoiceCard
              num="01"
              label="Energy orb"
              caption="A glowing sphere with quiet particles and ripples."
              selected={heroStyle === 'orb'}
              saving={savingHero === 'orb'}
              onClick={() => saveHeroStyle('orb')}
            >
              <div className="pointer-events-none origin-center scale-[0.4]">
                <NexusEnergyOrb size={200} />
              </div>
            </HeroChoiceCard>
            <HeroChoiceCard
              num="02"
              label="Character"
              caption="A half-dome face with eyes that follow your cursor."
              selected={heroStyle === 'character'}
              saving={savingHero === 'character'}
              onClick={() => saveHeroStyle('character')}
            >
              <div className="pointer-events-none origin-center scale-[0.45]">
                <NexusCharacter size={200} />
              </div>
            </HeroChoiceCard>
          </RpCardGrid>
          <p className="text-[13px] text-rp-dim">Refresh the home screen after switching to see the change.</p>
        </div>
      )}

      {/* Suggest a user tab — EA proposes, admin approves */}
      {tab === 'suggest_user' && canSuggestUsers && <SuggestUserPanel />}

      {/* Password tab */}
      {tab === 'password' && (
        <RpBox pad="lg" className="flex max-w-[640px] flex-col gap-5">
          <RpEyebrow tone="muted">Change password</RpEyebrow>
          <RpField label="New password" htmlFor="settings-new-password" hint="At least 8 characters.">
            <RpInput
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              invalid={!!passwordError}
            />
          </RpField>
          <RpField label="Confirm new password" htmlFor="settings-confirm-password" error={passwordError || undefined}>
            <RpInput
              id="settings-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat the new password"
              invalid={!!passwordError}
            />
          </RpField>
          <div className="flex justify-end border-t border-rp-line pt-5">
            <RpButton
              onClick={changePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? 'Updating…' : 'Update password'}
            </RpButton>
          </div>
        </RpBox>
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

  return (
    <RpBox pad="lg" className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <RpEyebrow tone="muted">Suggest a user</RpEyebrow>
        <p className="text-[15px] leading-normal text-rp-muted">
          Propose a new account. An administrator reviews it, sets a password and creates the account, then passes the credentials on.
        </p>
      </div>
      <RpFormGrid>
        <RpField label="Full name" htmlFor="suggest-name">
          <RpInput id="suggest-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
        </RpField>
        <RpField label="Email" htmlFor="suggest-email">
          <RpInput id="suggest-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
        </RpField>
        <RpField label="Role" htmlFor="suggest-role" className="sm:col-span-2">
          <RpSelect id="suggest-role" value={role} onChange={e => setRole(e.target.value as typeof role)}>
            <option value="viewer">Viewer</option>
            <option value="principal">Owner</option>
            <option value="ea">Owner&apos;s Rep</option>
            <option value="cfo">CFO</option>
          </RpSelect>
        </RpField>
        <RpField label="Notes (optional)" htmlFor="suggest-notes" className="sm:col-span-2">
          <RpTextarea
            id="suggest-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Why this person should be added, and any context for the administrator."
          />
        </RpField>
      </RpFormGrid>
      {err && <p className="rp-error" role="alert">{err}</p>}
      <div className="flex justify-end border-t border-rp-line pt-5">
        <RpButton
          onClick={submit}
          disabled={submitting || !email || !fullName}
        >
          {submitting ? 'Sending…' : 'Send for approval'}
        </RpButton>
      </div>
    </RpBox>
  )
}

// Appearance choice cell: the live preview, an Oswald label and a line. Pressed
// = gold 1px outline (inset) plus a 14% gold wash; no radius, no check badge.
// The orb and character render their own <button>, so the cell is a block with
// a stretched toggle button over it (no nested buttons), and the preview is inert.
function HeroChoiceCard({
  num,
  label,
  caption,
  selected,
  saving,
  onClick,
  children,
}: {
  num: string
  label: string
  caption: string
  selected: boolean
  saving: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative flex flex-col gap-2.5 p-5 transition-colors duration-200 ${
        selected
          ? 'bg-rp-gold/[.14] outline outline-1 -outline-offset-1 outline-rp-gold'
          : 'hover:bg-rp-surface'
      } ${saving ? 'opacity-60' : ''}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className={`font-display text-xs tracking-[.1em] ${selected ? 'text-rp-gold' : 'text-rp-dim'}`}>{num}</span>
        <span className="font-display text-[11px] uppercase tracking-[.16em] text-rp-muted">
          {saving ? 'Saving…' : selected ? 'In use' : 'Use this'}
        </span>
      </span>
      <span
        aria-hidden
        ref={el => { el?.setAttribute('inert', '') }}
        className="pointer-events-none flex h-36 items-center justify-center overflow-hidden"
      >
        {children}
      </span>
      <span className="font-display text-xl uppercase leading-[1.1] tracking-[.03em] text-rp-text">{label}</span>
      <span className="text-[14px] leading-[1.4] text-rp-muted">{caption}</span>
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        aria-pressed={selected}
        aria-label={`${label} · ${caption}`}
        className="absolute inset-0 z-[1] cursor-pointer disabled:cursor-wait"
      />
    </div>
  )
}
