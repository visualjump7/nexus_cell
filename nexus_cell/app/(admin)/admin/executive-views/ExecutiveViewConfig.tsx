'use client'

import { useEffect, useMemo, useState } from 'react'
import { WIDGET_CATALOG, getWidgetEntry, type WidgetId, DEFAULT_PRINCIPAL_WIDGETS } from '@/lib/widgets'
import { useToast } from '@/components/shared/Toast'
import PreviewPrincipalModal from './PreviewPrincipalModal'

interface Principal {
  user_id: string
  name: string
  email: string | null
}

interface WidgetItem {
  widget_id: WidgetId
  settings?: Record<string, unknown>
}

interface SavedConfig {
  widgets: WidgetItem[]
  greeting_style: 'none' | 'time_of_day' | 'custom'
  custom_greeting: string | null
}

const DEFAULT_CONFIG: SavedConfig = {
  widgets: DEFAULT_PRINCIPAL_WIDGETS as WidgetItem[],
  greeting_style: 'time_of_day',
  custom_greeting: null,
}

export default function ExecutiveViewConfig({
  principals,
  initialPrincipalId,
}: {
  principals: Principal[]
  initialPrincipalId?: string
}) {
  const { toast } = useToast()
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>(initialPrincipalId || principals[0]?.user_id || '')
  const [config, setConfig] = useState<SavedConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Load saved config when principal changes
  useEffect(() => {
    if (!selectedPrincipalId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/executive-views?principal_user_id=${selectedPrincipalId}`)
        const data = await res.json()
        if (cancelled) return
        if (data.config) {
          setConfig({
            widgets: (data.config.widgets || []) as WidgetItem[],
            greeting_style: data.config.greeting_style || 'time_of_day',
            custom_greeting: data.config.custom_greeting || null,
          })
        } else {
          setConfig(DEFAULT_CONFIG)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedPrincipalId])

  const enabledIds = useMemo(() => new Set(config.widgets.map(w => w.widget_id)), [config.widgets])
  const availableWidgets = WIDGET_CATALOG.filter(w => !enabledIds.has(w.id))

  function addWidget(id: WidgetId) {
    const entry = getWidgetEntry(id)
    if (!entry) return
    setConfig(c => ({
      ...c,
      widgets: [...c.widgets, { widget_id: id, settings: entry.defaultSettings }],
    }))
  }

  function removeWidget(index: number) {
    setConfig(c => ({ ...c, widgets: c.widgets.filter((_, i) => i !== index) }))
  }

  function updateSettings(index: number, settings: Record<string, unknown>) {
    setConfig(c => ({
      ...c,
      widgets: c.widgets.map((w, i) => i === index ? { ...w, settings } : w),
    }))
  }

  function move(index: number, direction: -1 | 1) {
    setConfig(c => {
      const next = [...c.widgets]
      const target = index + direction
      if (target < 0 || target >= next.length) return c
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return { ...c, widgets: next }
    })
  }

  function handleDragStart(i: number) {
    setDragIndex(i)
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === overIndex) return
    setConfig(c => {
      const next = [...c.widgets]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(overIndex, 0, moved)
      return { ...c, widgets: next }
    })
    setDragIndex(overIndex)
  }

  function handleDragEnd() {
    setDragIndex(null)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/executive-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal_user_id: selectedPrincipalId,
          widgets: config.widgets,
          greeting_style: config.greeting_style,
          custom_greeting: config.custom_greeting,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Executive view saved', 'success')
      } else {
        toast(data.error || 'Failed to save', 'error')
      }
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (principals.length === 0) {
    return (
      <div className="bg-card-dark rounded-xl p-8 text-center">
        <p className="text-gray-400">No principals in this organization yet.</p>
        <p className="text-xs text-gray-600 mt-1">Invite a principal first, then come back here to configure their view.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Principal selector + actions */}
      <div className="bg-card-dark rounded-xl p-4 flex flex-wrap items-center gap-3">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Configuring for</label>
        <select
          value={selectedPrincipalId}
          onChange={e => setSelectedPrincipalId(e.target.value)}
          className="bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
        >
          {principals.map(p => (
            <option key={p.user_id} value={p.user_id}>{p.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setPreviewOpen(true)}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-all"
        >
          Preview as principal
        </button>
        <button
          onClick={save}
          disabled={saving || loading}
          className="px-4 py-2 bg-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enabled widgets — ordered list */}
        <section className="bg-card-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Principal sees</h2>
            <span className="text-xs text-gray-500">{config.widgets.length} widget{config.widgets.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
          ) : config.widgets.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center italic">
              No widgets enabled. Add one from the catalog.
            </p>
          ) : (
            <ul className="space-y-2 m-0 p-0 list-none">
              {config.widgets.map((w, i) => {
                const entry = getWidgetEntry(w.widget_id)
                if (!entry) return null
                return (
                  <li
                    key={`${w.widget_id}-${i}`}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`bg-[#141520] border border-white/5 rounded-lg p-3 ${dragIndex === i ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 cursor-grab select-none" aria-hidden>⋮⋮</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white font-medium">{entry.label}</p>
                          {entry.pinned && <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Always on</span>}
                          {entry.interactive && <span className="text-[10px] text-blue-400 uppercase tracking-wider">Interactive</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-30 w-7 h-7 rounded hover:bg-white/5">↑</button>
                        <button onClick={() => move(i, 1)} disabled={i === config.widgets.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 w-7 h-7 rounded hover:bg-white/5">↓</button>
                        {!entry.pinned && (
                          <button onClick={() => removeWidget(i)} className="text-gray-500 hover:text-red-400 w-7 h-7 rounded hover:bg-white/5" title="Remove">×</button>
                        )}
                      </div>
                    </div>

                    {/* Per-widget settings */}
                    {w.widget_id === 'bills_due' && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                        <label className="text-xs text-gray-500">Window:</label>
                        <select
                          value={(w.settings?.window as string) || '7d'}
                          onChange={e => updateSettings(i, { ...w.settings, window: e.target.value })}
                          className="bg-[#1a1b2e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="today">Today only</option>
                          <option value="7d">Next 7 days</option>
                          <option value="30d">Next 30 days</option>
                        </select>
                      </div>
                    )}
                    {w.widget_id === 'briefings' && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                        <label className="text-xs text-gray-500">Show latest:</label>
                        <select
                          value={String((w.settings?.limit as number) || 3)}
                          onChange={e => updateSettings(i, { ...w.settings, limit: parseInt(e.target.value, 10) })}
                          className="bg-[#1a1b2e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="1">1</option>
                          <option value="3">3</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                        </select>
                        <span className="text-xs text-gray-600">briefs marked &ldquo;visible to principal&rdquo;</span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Available catalog */}
        <section className="bg-card-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Add a widget</h2>
            <span className="text-xs text-gray-500">{availableWidgets.length} available</span>
          </div>

          {availableWidgets.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center italic">
              All widgets are already enabled.
            </p>
          ) : (
            <ul className="space-y-2 m-0 p-0 list-none">
              {availableWidgets.map(w => (
                <li key={w.id} className="bg-[#141520] border border-white/5 rounded-lg p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{w.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{w.description}</p>
                  </div>
                  <button
                    onClick={() => addWidget(w.id)}
                    className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium rounded transition-colors shrink-0"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Greeting */}
      <section className="bg-card-dark rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-3">Greeting</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={config.greeting_style}
            onChange={e => setConfig(c => ({ ...c, greeting_style: e.target.value as SavedConfig['greeting_style'] }))}
            className="bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
          >
            <option value="time_of_day">Time of day (e.g. Good morning, Sarah)</option>
            <option value="custom">Custom message</option>
            <option value="none">No greeting</option>
          </select>
          {config.greeting_style === 'custom' && (
            <input
              type="text"
              value={config.custom_greeting || ''}
              onChange={e => setConfig(c => ({ ...c, custom_greeting: e.target.value }))}
              placeholder="e.g. Welcome back."
              className="flex-1 min-w-[200px] bg-[#141520] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50"
            />
          )}
        </div>
      </section>

      {previewOpen && (
        <PreviewPrincipalModal
          principalId={selectedPrincipalId}
          principalName={principals.find(p => p.user_id === selectedPrincipalId)?.name || 'Principal'}
          config={config}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
