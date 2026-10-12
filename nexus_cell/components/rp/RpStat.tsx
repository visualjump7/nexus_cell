import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RpTone } from './types'
import { RpMeter } from './RpMeter'
import { RpCapNum } from './RpText'

export interface RpStatStripProps {
  children: React.ReactNode
  /** Columns at full width (default 4); cells wrap at 160px. */
  cols?: 2 | 3 | 4 | 5 | 6
  className?: string
}

/** Ruled grid of stat cells (hairlines between cells, no doubled borders). Server-safe. */
export function RpStatStrip({ children, cols = 4, className }: RpStatStripProps) {
  // Phones (two columns): an odd last cell spans the row instead of leaving a hole.
  return (
    <div
      className={cn('rp-ruled max-[499px]:[&>:last-child:nth-child(odd)]:col-span-full', className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(max(160px, calc((100% - ${cols - 1}px) / ${cols})), 1fr))` }}
    >
      {children}
    </div>
  )
}

const VALUE_TONE: Record<NonNullable<RpStatProps['tone']>, string> = {
  default: 'text-rp-text',
  gold: 'text-rp-gold',
  green: 'text-rp-green',
  blue: 'text-rp-blue',
  alert: 'text-rp-alert',
}

export interface RpStatProps {
  /** Oswald 11 uppercase muted label. */
  label: string
  /** The figure, Oswald 500 tabular: '$198.6M', '36%', 43. */
  value: React.ReactNode
  /** 13px muted sub-line (' · ' separated). */
  sub?: React.ReactNode
  /** Makes the whole cell a link with a surface hover. */
  href?: string
  /** Gold index before the label. */
  index?: string | number
  tone?: 'default' | 'gold' | 'green' | 'blue' | 'alert'
  /** Meter at the foot of the cell. value 0..1 (>1 → alert). */
  meter?: { value: number; tone?: RpTone; marker?: number }
  /** Extra content at the bottom (after the meter). */
  trailing?: React.ReactNode
  className?: string
}

/** One KPI cell. Put inside RpStatStrip. Server-safe. */
export function RpStat({ label, value, sub, href, index, tone = 'default', meter, trailing, className }: RpStatProps) {
  const body = (
    <>
      <span className="rp-stat-label">
        {index != null && <RpCapNum n={index} />}
        <span>{label}</span>
      </span>
      <span className={cn('rp-stat-value', VALUE_TONE[tone])}>{value}</span>
      {sub != null && sub !== false && <span className="rp-stat-sub">{sub}</span>}
      {meter && (
        <RpMeter value={meter.value} tone={meter.tone} marker={meter.marker} label={label} className="mt-auto" />
      )}
      {trailing}
    </>
  )
  if (href) {
    return (
      <Link href={href} className={cn('rp-stat rp-stat--link', className)}>
        {body}
      </Link>
    )
  }
  return <div className={cn('rp-stat', className)}>{body}</div>
}
