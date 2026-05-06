'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getWidgetEntry, type WidgetId } from '@/lib/widgets'

interface WidgetItem {
  widget_id: WidgetId
  settings?: Record<string, unknown>
}

interface Config {
  widgets: WidgetItem[]
  greeting_style: 'none' | 'time_of_day' | 'custom'
  custom_greeting: string | null
}

interface Props {
  principalId: string
  principalName: string
  config: Config
  onClose: () => void
}

// Live preview of the in-progress config. Loads the saved version of the
// principal's view in an iframe at /executive-preview/<id> so the EA sees the
// real rendered widgets with real data — not a static mock.
//
// Note: shows the *saved* config, not the unsaved in-progress one. To preview
// unsaved changes, EA saves first then previews. Trade-off chosen for
// simplicity — building a preview-with-pending-config flow would require a
// signed config payload or a session-scoped draft table.
export default function PreviewPrincipalModal({ principalId, principalName, config, onClose }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!mounted) return null

  // Static enabled-list summary so EA can confirm the structure at a glance,
  // even before they save. The iframe below shows the live, saved version.
  const widgetSummary = config.widgets.map(w => getWidgetEntry(w.widget_id)?.label).filter(Boolean).join(' · ')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full sm:w-[min(92vw,440px)] sm:max-w-[440px] sm:rounded-2xl bg-nexus shadow-2xl shadow-black/40 border border-white/10 flex flex-col h-full sm:max-h-[90vh]"
        style={{ background: '#10131b' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-white">Preview as principal</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{principalName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-white w-8 h-8 rounded-md hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
          <p className="text-[11px] text-amber-400 uppercase tracking-wider mb-1">Heads up</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            This preview reflects the <span className="text-white">last saved</span> config.
            Save your changes first to see them live here. The principal&apos;s view always uses the saved version.
          </p>
          {widgetSummary && (
            <div className="mt-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">In-progress order</p>
              <p className="text-xs text-gray-300 leading-relaxed">{widgetSummary || '—'}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden bg-[#0a0c12]">
          <iframe
            src={`/executive-preview/${principalId}`}
            title="Principal view preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
