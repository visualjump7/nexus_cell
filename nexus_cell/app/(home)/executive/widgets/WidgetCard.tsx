// Shared wrapper around every executive widget. Keeps spacing, borders, and
// typography consistent so the principal view feels like one composition
// regardless of which widgets the EA enabled.

interface Props {
  title?: string
  subtitle?: string
  // Right-aligned slot (e.g. "View all" link or filter pill)
  trailing?: React.ReactNode
  children: React.ReactNode
  // For widgets that should fill more visual weight (e.g. AI chat) — flex-grow
  prominent?: boolean
}

export default function WidgetCard({ title, subtitle, trailing, children, prominent }: Props) {
  return (
    <section
      className={prominent ? 'rp-surface' : 'rp-panel'}
      style={{ padding: '20px 22px' }}
    >
      {(title || trailing) && (
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && (
              <h3 className={prominent ? 'rp-eyebrow' : 'rp-eyebrow--muted'}>{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#6E7578] mt-1">{subtitle}</p>
            )}
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

// Empty state used by widgets when there's nothing to show.
export function WidgetEmpty({ message }: { message: string }) {
  return (
    <p className="text-sm text-[#6E7578]">{message}</p>
  )
}
