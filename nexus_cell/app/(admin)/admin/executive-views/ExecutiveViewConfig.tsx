'use client'

import { useEffect, useMemo, useState } from 'react'
import { WIDGET_CATALOG, getWidgetEntry, type WidgetId, DEFAULT_PRINCIPAL_WIDGETS } from '@/lib/widgets'
import { useToast } from '@/components/shared/Toast'
import {
  RpChips,
  RpTabs,
  RpButton,
  RpTag,
  RpCapNum,
  RpGroup,
  RpGroupHead,
  RpCardGrid,
  RpEmpty,
  RpLoading,
  RpSelect,
  RpInput,
  RpSubhead,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  pad2,
} from '@/components/rp'
import PreviewPrincipalModal from './PreviewPrincipalModal'

const GREETINGS: { id: SavedConfigGreeting; label: string }[] = [
  { id: 'time_of_day', label: 'Time of day' },
  { id: 'custom', label: 'Custom message' },
  { id: 'none', label: 'No greeting' },
]
type SavedConfigGreeting = 'none' | 'time_of_day' | 'custom'

const SETTING_LABEL = 'font-display text-[11px] uppercase tracking-[.16em] text-rp-muted'

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
        toast('Owner view saved', 'success')
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
      <RpEmpty
        title="No owner accounts yet."
        line="Invite an owner first, then come back here to set up their view."
        action={<RpButton variant="ghost" href="/admin/users" arrow>Members</RpButton>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-[var(--rp-gap)]">
      {/* Owner picker + actions */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-col gap-3">
          <span className={SETTING_LABEL}>Configuring for</span>
          <RpChips
            ariaLabel="Owner"
            value={selectedPrincipalId}
            onChange={setSelectedPrincipalId}
            items={principals.map((p, i) => ({ id: p.user_id, num: pad2(i + 1), label: p.name }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RpButton variant="ghost" onClick={() => setPreviewOpen(true)}>Preview</RpButton>
          <RpButton onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : 'Save'}</RpButton>
        </div>
      </div>

      <div className="grid gap-x-10 gap-y-[var(--rp-gap)] lg:grid-cols-2">
        {/* Enabled widgets — ordered list */}
        <RpGroup className="min-w-0">
          <RpGroupHead
            as="h2"
            title="Owner sees"
            line="In order, top to bottom · drag or use the arrows"
            aside={<span className="rp-counter">{config.widgets.length} widget{config.widgets.length !== 1 ? 's' : ''}</span>}
          />

          {loading ? (
            <RpLoading rows={5} label="Loading the saved view" />
          ) : config.widgets.length === 0 ? (
            <RpEmpty compact pines={false} title="Nothing on screen yet." line="Add a widget from the catalog." />
          ) : (
            <ol className="m-0 list-none border-t border-rp-line p-0">
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
                    className={`border-b border-rp-line py-3.5 transition-colors duration-200 hover:bg-rp-surface ${dragIndex === i ? 'bg-rp-surface opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3 px-1">
                      <span className="mt-0.5 cursor-grab select-none text-[13px] text-rp-dim" aria-hidden title="Drag to reorder">
                        <RpCapNum n={i + 1} className="text-[13px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-medium text-rp-text">{entry.label}</p>
                          {entry.pinned && <RpTag tone="gold">Always on</RpTag>}
                          {entry.interactive && <RpTag tone="blue">Interactive</RpTag>}
                        </div>
                        <p className="mt-1 text-[13px] leading-snug text-rp-muted">{entry.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <RpButton variant="icon" size="sm" aria-label={`Move ${entry.label} up`} onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowUp size={14} strokeWidth={1.5} />
                        </RpButton>
                        <RpButton variant="icon" size="sm" aria-label={`Move ${entry.label} down`} onClick={() => move(i, 1)} disabled={i === config.widgets.length - 1}>
                          <ArrowDown size={14} strokeWidth={1.5} />
                        </RpButton>
                        {!entry.pinned && (
                          <RpButton variant="icon" size="sm" aria-label={`Remove ${entry.label}`} title="Remove" onClick={() => removeWidget(i)}>
                            <X size={14} strokeWidth={1.5} />
                          </RpButton>
                        )}
                      </div>
                    </div>

                    {/* Per-widget settings */}
                    {w.widget_id === 'bills_due' && (
                      <div className="ml-9 mt-3 flex flex-wrap items-center gap-3">
                        <label htmlFor={`setting-window-${i}`} className={SETTING_LABEL}>Window</label>
                        <RpSelect
                          id={`setting-window-${i}`}
                          value={(w.settings?.window as string) || '7d'}
                          onChange={e => updateSettings(i, { ...w.settings, window: e.target.value })}
                          className="!min-h-9 w-[180px] text-[14px]"
                        >
                          <option value="today">Today only</option>
                          <option value="7d">Next 7 days</option>
                          <option value="30d">Next 30 days</option>
                        </RpSelect>
                      </div>
                    )}
                    {w.widget_id === 'briefings' && (
                      <div className="ml-9 mt-3 flex flex-wrap items-center gap-3">
                        <label htmlFor={`setting-limit-${i}`} className={SETTING_LABEL}>Show latest</label>
                        <RpSelect
                          id={`setting-limit-${i}`}
                          value={String((w.settings?.limit as number) || 3)}
                          onChange={e => updateSettings(i, { ...w.settings, limit: parseInt(e.target.value, 10) })}
                          className="!min-h-9 w-[96px] text-[14px]"
                        >
                          <option value="1">1</option>
                          <option value="3">3</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                        </RpSelect>
                        <span className="text-[13px] text-rp-dim">briefs marked &ldquo;visible to owner&rdquo;</span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </RpGroup>

        {/* Available catalog (side by side at lg: no stacked-group rule there) */}
        <RpGroup className="min-w-0 lg:!border-t-0 lg:!pt-0">
          <RpGroupHead
            as="h2"
            title="Catalog"
            line="Widgets not on this owner's screen"
            aside={<span className="rp-counter">{availableWidgets.length} available</span>}
          />

          {availableWidgets.length === 0 ? (
            <RpEmpty compact pines={false} title="Everything is on." line="Every widget is already on this owner's screen." />
          ) : (
            <RpCardGrid max={2} min={220}>
              {availableWidgets.map(w => (
                <div key={w.id} className="flex flex-col gap-2.5 p-5">
                  <p className="font-display text-[18px] uppercase leading-[1.1] tracking-[.03em] text-rp-text">{w.label}</p>
                  <p className="flex-1 text-[14px] leading-[1.4] text-rp-muted">{w.description}</p>
                  <RpButton variant="ghost" size="sm" className="self-start" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => addWidget(w.id)}>
                    Add
                  </RpButton>
                </div>
              ))}
            </RpCardGrid>
          )}
        </RpGroup>
      </div>

      {/* Greeting */}
      <section className="flex flex-col gap-5">
        <RpSubhead
          size="md"
          title="Greeting"
          spec="The line above the owner's widgets"
        />
        <div className="flex flex-wrap items-center gap-4">
          <RpTabs
            size="sm"
            ariaLabel="Greeting style"
            items={GREETINGS}
            value={config.greeting_style}
            onChange={id => setConfig(c => ({ ...c, greeting_style: id as SavedConfig['greeting_style'] }))}
          />
          {config.greeting_style === 'custom' && (
            <RpInput
              type="text"
              aria-label="Custom greeting"
              value={config.custom_greeting || ''}
              onChange={e => setConfig(c => ({ ...c, custom_greeting: e.target.value }))}
              placeholder="e.g. Welcome back."
              className="min-w-[220px] max-w-[420px] flex-1"
            />
          )}
        </div>
        {config.greeting_style === 'time_of_day' && (
          <p className="text-[13px] text-rp-dim">For example: Good morning, Sarah.</p>
        )}
      </section>

      {previewOpen && (
        <PreviewPrincipalModal
          principalId={selectedPrincipalId}
          principalName={principals.find(p => p.user_id === selectedPrincipalId)?.name || 'Owner'}
          config={config}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
