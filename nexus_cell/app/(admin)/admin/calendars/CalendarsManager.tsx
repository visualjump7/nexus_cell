'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import DeleteConfirm from '@/components/DeleteConfirm'
import type { ExternalCalendar } from '@/lib/types'
import {
  RpSubhead,
  RpTable,
  RpTag,
  RpStatus,
  RpButton,
  RpEmpty,
  RpModal,
  RpField,
  RpInput,
  RpTabs,
  Plus,
  timeAgo,
  dot,
} from '@/components/rp'

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

function syncState(c: CalendarRow): 'ok' | 'error' | 'never' {
  if (c.last_sync_error) return 'error'
  return c.last_synced_at ? 'ok' : 'never'
}

/** 8px colour square (calendar colours are data, not decoration). */
function Swatch({ color }: { color: string }) {
  return <i aria-hidden className="block h-2 w-2 shrink-0" style={{ background: color }} />
}

export default function CalendarsManager({ initialCalendars }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [calendars] = useState(initialCalendars)
  const [editing, setEditing] = useState<CalendarRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CalendarRow | null>(null)

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
    const res = await fetch(`/api/external-calendars/${c.id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      toast('Deleted', 'success')
      router.refresh()
    } else {
      const data = await res.json()
      toast(data.error || 'Failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-[var(--rp-gap)]">
      {/* Active calendars */}
      <section className="flex flex-col gap-5">
        <RpSubhead
          flush
          title="Active"
          spec={dot(`${active.length} calendar${active.length === 1 ? '' : 's'}`, `${active.reduce((s, c) => s + c.event_count, 0)} events cached`)}
          aside={<RpButton size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => setAdding(true)}>Add calendar</RpButton>}
        />
        {active.length === 0 ? (
          <RpEmpty
            compact
            title="No calendars yet."
            line="Add a calendar to subscribe to an iCal feed. Its events appear beside the build schedule."
          />
        ) : (
          <RpTable minWidth={900} caption="Active calendars">
            <thead>
              <tr>
                <th>Calendar</th>
                <th>Provider</th>
                <th className="num">Events</th>
                <th>Last synced</th>
                <th>Status</th>
                <th className="num relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {active.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <Swatch color={c.color} />
                      <span className="font-medium text-rp-text">{c.name}</span>
                    </span>
                    {c.last_sync_error && (
                      <span className="sub max-w-[320px] truncate pl-5" title={c.last_sync_error}>{c.last_sync_error}</span>
                    )}
                  </td>
                  <td><RpTag>{PROVIDER_LABEL[c.provider] || c.provider}</RpTag></td>
                  <td className="num">{c.event_count}</td>
                  <td className="whitespace-nowrap text-rp-muted" suppressHydrationWarning>{c.last_synced_at ? timeAgo(c.last_synced_at) : 'Never'}</td>
                  <td><RpStatus kind="sync" value={syncState(c)} /></td>
                  <td className="num">
                    <span className="inline-flex items-center gap-2">
                      <RpButton variant="ghost" size="sm" onClick={() => syncNow(c.id)} disabled={syncingId === c.id}>
                        {syncingId === c.id ? 'Syncing…' : 'Sync now'}
                      </RpButton>
                      <RpButton variant="ghost" size="sm" onClick={() => setEditing(c)}>Edit</RpButton>
                      <RpButton variant="ghost" size="sm" onClick={() => archive(c)}>Archive</RpButton>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </RpTable>
        )}
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="flex flex-col gap-5">
          <RpSubhead size="md" title="Archived" spec={`${archived.length} calendar${archived.length === 1 ? '' : 's'} · hidden from members`} />
          <RpTable minWidth={640} caption="Archived calendars">
            <thead>
              <tr>
                <th>Calendar</th>
                <th>Provider</th>
                <th className="num">Events</th>
                <th className="num relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {archived.map(c => (
                <tr key={c.id} className="text-rp-muted">
                  <td>
                    <span className="flex items-center gap-3 opacity-70">
                      <Swatch color={c.color} />
                      <span>{c.name}</span>
                    </span>
                  </td>
                  <td><RpTag tone="dim">{PROVIDER_LABEL[c.provider] || c.provider}</RpTag></td>
                  <td className="num">{c.event_count}</td>
                  <td className="num">
                    <span className="inline-flex items-center gap-2">
                      <RpButton variant="ghost" size="sm" onClick={() => archive(c)}>Restore</RpButton>
                      <RpButton variant="danger" size="sm" onClick={() => setDeleting(c)}>Delete</RpButton>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </RpTable>
        </section>
      )}

      {(adding || editing) && (
        <CalendarFormModal
          calendar={editing}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSaved={() => { setAdding(false); setEditing(null); router.refresh() }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          itemName={`"${deleting.name}" and its cached events`}
          onConfirm={() => hardDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
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

const COLORS = ['#CDA14B', '#3989CB', '#A4CC5C', '#E0BF7B', '#7FB3DE', '#9AA0A4', '#C8DE9A', '#8C6830']

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
  const [color, setColor] = useState(calendar?.color || '#3989CB')
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={isEditing ? 'Edit calendar' : 'Add a calendar'}
      title={name.trim() || (isEditing ? 'Calendar' : 'New calendar')}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton onClick={save} disabled={saving || !name.trim() || !icsUrl.trim()}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Add calendar'}
          </RpButton>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <span className="rp-label">Provider</span>
        <RpTabs
          size="sm"
          ariaLabel="Provider"
          value={provider}
          onChange={id => setProvider(id as typeof provider)}
          items={(['apple', 'outlook', 'google', 'ics'] as const).map(p => ({ id: p, label: PROVIDER_LABEL[p] }))}
        />
        <p className="rp-hint leading-relaxed">{PROVIDER_HELP[provider]}</p>
      </div>

      <RpField label="Name" htmlFor="cal-name">
        <RpInput id="cal-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Site office iCloud" />
      </RpField>

      <RpField label="ICS URL" htmlFor="cal-url">
        <RpInput id="cal-url" className="text-[14px]" value={icsUrl} onChange={e => { setIcsUrl(e.target.value); setTestResult(null) }} placeholder="https://… or webcal://…" />
      </RpField>
      <div className="-mt-2 flex flex-wrap items-center gap-3">
        <RpButton variant="text" size="sm" onClick={testUrl} disabled={!icsUrl.trim() || testing}>
          {testing ? 'Testing…' : 'Test fetch'}
        </RpButton>
        {testResult && (
          <RpTag tone={testResult.ok ? 'green' : 'alert'}>{testResult.ok ? 'Reachable' : 'Failed'} · {testResult.msg}</RpTag>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="rp-label">Colour</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Calendar colour">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-pressed={color === c}
              aria-label={`Colour ${c}`}
              className={`h-7 w-7 transition-[outline-color] duration-200 ${
                color === c ? 'outline outline-1 outline-offset-2 outline-rp-text' : 'outline outline-1 outline-offset-2 outline-transparent hover:outline-rp-line3'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {err && <p className="rp-error" role="alert">{err}</p>}
    </RpModal>
  )
}
