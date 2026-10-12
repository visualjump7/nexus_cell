'use client'

import { getWidgetEntry, type WidgetId } from '@/lib/widgets'
import { RpModal, RpTag } from '@/components/rp'

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
  // Static enabled-list summary so EA can confirm the structure at a glance,
  // even before they save. The iframe below shows the live, saved version.
  const widgetSummary = config.widgets.map(w => getWidgetEntry(w.widget_id)?.label).filter(Boolean).join(' · ')

  return (
    <RpModal
      open
      onClose={onClose}
      size="xl"
      eyebrow="Preview"
      title={principalName}
    >
      <div className="flex flex-col gap-3 border border-rp-line bg-rp-panel px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <RpTag tone="gold">Last saved view</RpTag>
          <p className="text-[14px] text-rp-muted">
            The preview shows the <span className="text-rp-text">saved</span> view. Save your changes first to see them here; the owner always sees the saved version.
          </p>
        </div>
        {widgetSummary && (
          <p className="text-[13px] leading-relaxed text-rp-muted">
            <span className="mr-2 font-display text-[11px] uppercase tracking-[.16em] text-rp-dim">In-progress order</span>
            {widgetSummary}
          </p>
        )}
      </div>

      <iframe
        src={`/executive-preview/${principalId}`}
        title="Owner view preview"
        className="block aspect-[9/16] w-full shrink-0 border border-rp-line bg-rp-bg sm:aspect-[16/10] sm:max-h-[calc(100vh-280px)] sm:min-h-[360px]"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </RpModal>
  )
}
