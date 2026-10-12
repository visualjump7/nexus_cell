import { cn } from '@/lib/utils'
import type { RpAspect } from './types'
import { frameClass } from './frame'

export interface RpPendingProps {
  /** Default 'Asset pending'. */
  label?: string
  /** File or subject name under the label (12px dim). */
  name?: string
  /** Render as its own framed block (with an aspect) instead of filling a frame. */
  standalone?: boolean
  /** Aspect when standalone (default 'aerial' 16/10). */
  aspect?: RpAspect
  className?: string
}

/** The branded striped plate for any missing image, chart or map. Server-safe. */
export function RpPending({ label = 'Asset pending', name, standalone, aspect = 'aerial', className }: RpPendingProps) {
  const plate = (
    <span className={cn('rp-pending', !standalone && className)}>
      <span className="rp-pending-label">{label}</span>
      {name && <span className="rp-pending-name">{name}</span>}
    </span>
  )
  if (!standalone) return plate
  return <div className={cn(frameClass(aspect, false), 'rp-frame--static', className)}>{plate}</div>
}
