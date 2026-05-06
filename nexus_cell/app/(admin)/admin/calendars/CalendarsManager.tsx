'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import type { ExternalCalendar } from '@/lib/types'

type CalendarRow = ExternalCalendar & { event_count: number }

interface Props {
  initialCalendars: CalendarRow[]
}

const PROVIDER_LABEL: Record<string, string> = {
  apple: 'Apple',
  outlook: 'Outlook',
  google: 'Google',
  ics: 'ICS',
}

const PROVIDER_DOT: Record<string, string> = {
  apple: 'bg-gray-300',
  outlook: 'bg-blue-400',
  google: 'bg-emerald-400',
  ics: 'bg-purple-400',
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function CalendarsManager({ initialCalendars }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [calendars] = useState(initialCalendars)
  const [editing, setEditing] = useState<CalendarRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const active = calendars.filter(c => !c.archived)
  const archived = calendars.filter(c => c.archived)

  async function syncNow(id: string) {
    setSyncingId(id)
    try {
      const res = await fetch(`/api/external-calendars/${id}/sync`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast(`Synced — ${data.eventsUpserted ?? 0} event${data.eventsUpserted === 1 ? '' : 's'}`, 'success')
      } else {
        toast(data.error || 'Sync failed', 'error')
      }
      router.refresh()
    } finally {
      setSyncingId(null)
    }
  }

  async function archive(c: CalendarRow) {
    const res = await fetch(`/api/external-calendars/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !c.archived }),
    })
    if (res.ok) {
      toast(c.archived ? 'Restored' : 'Archived', 'success')
      router.refresh()
    } else {
      const data = await res.json()
      toast(data.error || 'Failed', 'error')
    }
  }

  async function hardDelete(c: CalendarRow) {
    if (!confirm(`Delete "${c.name}" permanently? This removes all cached events.`)) return
    const res = await fetch(`/api/external-calendars/${c.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Deleted', 'success')
      router.refresh()
    } else {
      const data = await res.json()
      toast(data.error || 'Failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 bg-emerald-500 hover:brightness-110 text-white text-xs font-medium rounded-lg transition-all"
        >
          + Add calendar
        </button>
      </div>

      {/* Active calendars */}
      <section className="bg-card-dark rounded-xl">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Active</h2>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500 italic px-5 py-8 text-center">
            No external calendars yet. Click &ldquo;Add calendar&rdquo; to subscribe to an iCal feed.
          </p>
        ) : (
          <ul className="divide-y divide-white/5 m-0 p-0 list-none">
            {active.map(c => (
              <CalendarRow
                key={c.id}
                cal={c}
                syncing={syncingId === c.id}
                onSync={() => syncNow(c.id)}
                onEdit={() => setEditing(c)}
                onArchive={() => archive(c)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="bg-card-dark rounded-xl">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Archived</h2>
            <span className="text-xs text-gray-600">{archived.length}</span>
          </div>
          <ul className="divide-y divide-white/5 m-0 p-0 list-none">
            {archived.map(c => (
              <li key={c.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <p className="text-sm text-gray-300 flex-1">{c.name}</p>
                <button onClick={() => archive(c)} className="text-xs text-emerald-400 hover:underline">Restore</button>
                <button onClick={() => hardDelete(c)} className="text-xs text-red-400 hover:underline">Delete</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(adding || editing) && (
        <CalendarFormModal
          calendar={editing}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSaved={() => { setAdding(false); setEditing(null); router.refresh() }}
        />
      )}
    </div>
  )

  function CalendarRow({ cal, syncing, onSync, onEdit, onArchive }: {
    cal: CalendarRow
    syncing: boolean
    onSync: () => void
    onEdit: () => void
    onArchive: () => void
  }) {
    return (
      <li className="px-5 py-3 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cal.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium truncate">{cal.name}</p>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${PROVIDER_DOT[cal.provider]}`} />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{PROVIDER_LABEL[cal.provider]}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            <span>{cal.event_count} event{cal.event_count === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>synced {timeAgo(cal.last_synced_at)}</span>
            {cal.last_sync_error && (
              <>
                <span>·</span>
                <span className="text-red-400 truncate" title={cal.last_sync_error}>error: {cal.last_sync_error}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onSync}
            disabled={syncing}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button
            onClick={onEdit}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
          >
            Edit
          </button>
          <button
            onClick={onArchive}
            className="text-xs text-gray-400 hover:text-amber-400 px-2 py-1 rounded hover:bg-white/5"
          >
            Archive
          </button>
        </div>
      </li>
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Add / Edit modal
// ─────────────────────────────────────────────────────────────────────────

const PROVIDER_HELP: Record<string, string> = {
  apple:   'In the Calendar app: right-click your calendar → Share Calendar → check Public Calendar → copy URL.',
  outlook: 'Outlook web → Settings → Calendar → Shared calendars → Publish a calendar → copy ICS link.',
  google:  'Google Calendar → Settings → integrate calendar → Public address in iCal format → copy URL.',
  ics:     'Paste any iCal/ICS feed URL (https:// or webcal://).',
}

function CalendarFormModal({
  calendar,
  onClose,
  onSaved,
}: {
  calendar: CalendarRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const isEditing = !!calendar
  const [name, setName] = useState(calendar?.name || '')
  const [icsUrl, setIcsUrl] = useState(calendar?.ics_url || '')
  const [provider, setProvider] = useState<'apple' | 'outlook' | 'google' | 'ics'>(
    (calendar?.provider as 'apple' | 'outlook' | 'google' | 'ics') || 'apple',
  )
  const [color, setColor] = useState(calendar?.color || '#3b82f6')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function testUrl() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/external-calendars/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ics_url: icsUrl.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, msg: `Found ${data.eventsUpserted ?? 0} event${data.eventsUpserted === 1 ? '' : 's'}` })
      } else {
        setTestResult({ ok: false, msg: data.error || 'Failed' })
      }
    } catch {
      setTestResult({ ok: false, msg: 'Network error' })
    }
    setTesting(false)
  }

  async function save() {
    setErr('')
    setSaving(true)
    try {
      const url = isEditing ? `/api/external-calendars/${calendar!.id}` : '/api/external-calendars'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ics_url: icsUrl.trim(), provider, color }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(isEditing ? 'Calendar updated' : 'Calendar added — syncing in background', 'success')
        onSaved()
      } else {
        setErr(data.error || 'Failed to save')
      }
    } catch {
      setErr('Network error')
    }
    setSaving(false)
  }

  const inputCls = 'w-full bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50'
  const COLORS = ['#3b82f6', '#a855f7', '#22d3ee', '#f59e0b', '#ec4899', '#84cc16', '#eab308', '#6366f1']

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#10131b] rounded-xl shadow-2xl shadow-black/40 w-full max-w-md p-6 border border-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          {isEditing ? 'Edit calendar' : 'Add a calendar'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Provider</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['apple', 'outlook', 'google', 'ics'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    provider === p
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{PROVIDER_HELP[provider]}</p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Stefanie's iCloud" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">ICS URL</label>
            <input className={inputCls + ' font-mono text-xs'} value={icsUrl} onChange={e => { setIcsUrl(e.target.value); setTestResult(null) }} placeholder="https://… or webcal://…" />
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={testUrl}
                disabled={!icsUrl.trim() || testing}
                className="text-[11px] text-emerald-400 hover:underline disabled:opacity-50"
              >
                {testing ? 'Testing…' : 'Test fetch'}
              </button>
              {testResult && (
                <span className={`text-[11px] ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.ok ? '✓' : '✗'} {testResult.msg}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#10131b] scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !name.trim() || !icsUrl.trim()}
              className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-medium text-sm rounded-lg"
            >
              {saving ? 'Saving…' : isEditing ? 'Save' : 'Add calendar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
