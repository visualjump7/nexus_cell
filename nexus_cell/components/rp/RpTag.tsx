import { cn } from '@/lib/utils'
import type { RpTone } from './types'
import { statusDef, type RpStatusKind } from './status'

const TONE_CLASS: Record<RpTone, string> = {
  neutral: '',
  gold: 'rp-tag--gold',
  green: 'rp-tag--green',
  blue: 'rp-tag--blue',
  alert: 'rp-tag--alert',
  dim: 'rp-tag--dim',
}

export interface RpTagProps {
  tone?: RpTone
  /** Prefix a 6px square marker in the tag colour. */
  square?: boolean
  children: React.ReactNode
  className?: string
  title?: string
}

/** Outlined Oswald tag (11px, .16em). Tone colours text and border; never filled. Server-safe. */
export function RpTag({ tone = 'neutral', square, children, className, title }: RpTagProps) {
  return (
    <span className={cn('rp-tag', TONE_CLASS[tone], className)} title={title}>
      {square && <i aria-hidden className="rp-tag-sq" />}
      {children}
    </span>
  )
}

/** Alias kept for screens that think in "badges". */
export const RpBadge = RpTag

export interface RpStatusProps {
  kind: RpStatusKind
  value?: string | null
  square?: boolean
  className?: string
}

/** Status tag from the single tone map (components/rp/status.ts). Unknown values render neutral. */
export function RpStatus({ kind, value, square, className }: RpStatusProps) {
  const def = statusDef(kind, value)
  return <RpTag tone={def.tone} square={square} className={className}>{def.label}</RpTag>
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#3A3E42',
  normal: '#9AA0A4',
  high: '#CDA14B',
  urgent: '#C8553D',
}
const PRIORITY_LABEL: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }

/** 8px square priority marker (low steel, normal muted, high gold, urgent alert). */
export function RpPriority({ value, withLabel, className }: { value: 'low' | 'normal' | 'high' | 'urgent' | string; withLabel?: boolean; className?: string }) {
  const label = PRIORITY_LABEL[value] ?? 'Normal'
  const color = PRIORITY_COLOR[value] ?? PRIORITY_COLOR.normal
  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="img" aria-label={`${label} priority`}>
      <i aria-hidden className="block h-2 w-2 shrink-0" style={{ background: color }} />
      {withLabel && <span className="font-display text-[11px] uppercase tracking-[.14em] text-rp-muted">{label}</span>}
    </span>
  )
}
