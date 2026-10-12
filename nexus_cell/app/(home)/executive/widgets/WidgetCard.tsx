import { RpEmpty } from '@/components/rp'

// Shared cell for every executive widget. The owner's view lays the cells out
// in a ruled grid (hairlines between cells), so a widget is never a box of its
// own: a gold number (CSS counter set by ExecutiveView), a muted Oswald label,
// an optional figure or link at the right, then the content.

interface Props {
  title?: string
  subtitle?: string
  // Right-aligned slot (e.g. an Oswald figure or a text link)
  trailing?: React.ReactNode
  children: React.ReactNode
  // The full-width Ask Nexus cell: gold label instead of muted
  prominent?: boolean
}

export default function WidgetCard({ title, subtitle, trailing, children, prominent }: Props) {
  return (
    <section className="flex h-full min-w-0 flex-col gap-4 p-6">
      {(title || trailing) && (
        <header className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-baseline gap-3">
            <span
              aria-hidden
              className="rp-cap-num text-[13px] leading-none before:content-[counter(widget,decimal-leading-zero)]"
            />
            {title && <h2 className={prominent ? 'rp-eyebrow' : 'rp-eyebrow--muted'}>{title}</h2>}
            {trailing && <div className="ml-auto shrink-0 self-center">{trailing}</div>}
          </div>
          {subtitle && <p className="text-[13px] leading-snug text-rp-muted">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

// Empty state used by widgets when there's nothing to show. Flat inside the
// cell (the grid already draws the rules), no pines.
export function WidgetEmpty({ message }: { message: string }) {
  return <RpEmpty compact pines={false} title={message} className="min-h-0 border-0 bg-transparent p-0" />
}
