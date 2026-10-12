import { cn } from '@/lib/utils'
import { RpPines } from './RpPines'

export interface RpEmptyProps {
  /** Default 'Nothing logged yet.' */
  title?: string
  line?: React.ReactNode
  action?: React.ReactNode
  /** Paired pines at the foot (default true). */
  pines?: boolean
  /** Shorter box (py-8, min-h 140). */
  compact?: boolean
  className?: string
}

/** Empty state: muted 'Empty' eyebrow, Oswald title, one line, an action, pines behind. Server-safe. */
export function RpEmpty({ title = 'Nothing logged yet.', line, action, pines = true, compact, className }: RpEmptyProps) {
  return (
    <div
      className={cn(
        'rp-box relative isolate flex flex-col items-start gap-3 overflow-hidden px-6',
        compact ? 'min-h-[140px] py-8' : 'min-h-[200px] py-12',
        className,
      )}
    >
      <span className="rp-eyebrow--muted">Empty</span>
      <p className="font-display text-2xl uppercase leading-[1.1] tracking-[.02em] text-rp-text">{title}</p>
      {line != null && line !== false && <p className="max-w-[56ch] text-[15px] leading-normal text-rp-muted">{line}</p>}
      {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      {pines && <RpPines placement="empty" />}
    </div>
  )
}

export interface RpLoadingProps {
  /** Default 'Loading'. */
  label?: string
  /** N hairline rows (44px) instead of the plate. */
  rows?: number
  className?: string
}

/** Loading state without spinners: hairline rows, or a 160px pending plate with the label. Server-safe. */
export function RpLoading({ label = 'Loading', rows, className }: RpLoadingProps) {
  if (rows && rows > 0) {
    return (
      <div className={cn('flex flex-col border-t border-rp-line', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-11 border-b border-rp-line" aria-hidden />
        ))}
      </div>
    )
  }
  return (
    <div className={cn('relative h-40 border border-rp-line', className)} role="status" aria-live="polite">
      <span className="rp-pending">
        <span className="rp-pending-label">{label}</span>
      </span>
    </div>
  )
}
