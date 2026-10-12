// Chart chrome for recharts screens. No directive and no hooks: the frame,
// legend and bar list render in server or client code; the recharts
// components you put inside RpChartFrame must live in a client component.
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { RpMeter } from './RpMeter'
import type { RpTone } from './types'
import { fmtPct } from './format'

/** Recharts props in the concept language: gold/blue/green series, #1F1F1F grid, Oswald ticks. */
export const RP_CHART = {
  colors: BRAND.chart,
  grid: '#1F1F1F',
  axis: '#26292C',
  tick: { fill: '#6E7578', fontSize: 11, fontFamily: 'var(--font-display)', letterSpacing: '0.14em' },
  tooltip: {
    contentStyle: { background: '#0A0B0C', border: '1px solid #26292C', borderRadius: 0, padding: '10px 12px', boxShadow: 'none' },
    labelStyle: { fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: '#9AA0A4' },
    itemStyle: { color: '#F5F5F5', fontSize: 13 },
    cursor: { fill: 'rgba(205,161,75,.06)' },
  },
  bar: { radius: 0, maxBarSize: 28 },
  line: { strokeWidth: 1.5 },
}

export interface RpLegendItem { label: string; color: string }

/** 8px squares + 12px muted labels. */
export function RpLegend({ items, className }: { items: RpLegendItem[]; className?: string }) {
  if (!items.length) return null
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2', className)}>
      {items.map(it => (
        <li key={it.label} className="flex items-center gap-2 text-xs text-rp-muted">
          <span aria-hidden className="h-2 w-2 shrink-0" style={{ background: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

export interface RpChartFrameProps {
  /** Muted Oswald label, e.g. 'Draws by month'. */
  eyebrow: string
  /** Headline figure in Oswald, e.g. '$12.4M'. */
  value?: React.ReactNode
  sub?: React.ReactNode
  legend?: RpLegendItem[]
  children: React.ReactNode
  /** Chart area height in px. Default 240. Pass 0 to let children size themselves. */
  height?: number
  className?: string
}

/** Bordered chart cell: eyebrow + figure + sub, legend, then the chart area. */
export function RpChartFrame({ eyebrow, value, sub, legend, children, height = 240, className }: RpChartFrameProps) {
  return (
    <section className={cn('rp-box flex min-w-0 flex-col gap-4 p-5', className)}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="rp-eyebrow--muted">{eyebrow}</span>
          {value != null && <span className="rp-stat-value">{value}</span>}
          {sub != null && <span className="text-[13px] leading-snug text-rp-muted">{sub}</span>}
        </div>
        {legend && legend.length > 0 && <RpLegend items={legend} />}
      </header>
      <div className="min-w-0" style={height ? { height } : undefined}>{children}</div>
    </section>
  )
}

export interface RpBarListItem {
  label: string
  value: number
  /** Pre-formatted value; otherwise `format(value)`. */
  display?: string
  tone?: RpTone
  href?: string
}

export interface RpBarListProps {
  items: RpBarListItem[]
  /** Meter scale. Default: the largest value. */
  max?: number
  format?: (n: number) => string
  className?: string
}

/** Ranked list with meters — the replacement for donuts. */
export function RpBarList({ items, max, format, className }: RpBarListProps) {
  const total = items.reduce((a, b) => a + (Number.isFinite(b.value) ? b.value : 0), 0)
  const scale = max ?? Math.max(0, ...items.map(i => i.value))
  const fmt = format ?? ((n: number) => n.toLocaleString('en-US'))
  return (
    <ol className={cn('flex flex-col', className)}>
      {items.map((it, i) => {
        const label = it.href
          ? <Link href={it.href} className="rp-link truncate">{it.label}</Link>
          : <span className="truncate">{it.label}</span>
        return (
          <li key={`${it.label}-${i}`} className="flex flex-col gap-2 border-t border-rp-line py-3 first:border-t-0 first:pt-0">
            <div className="flex items-baseline gap-3 text-[15px] text-rp-text">
              <span className="flex min-w-0 flex-1">{label}</span>
              <span className="shrink-0 font-display text-[15px] tracking-[.04em] tabular-nums">{it.display ?? fmt(it.value)}</span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-rp-dim">{total > 0 ? fmtPct(it.value / total) : '—'}</span>
            </div>
            <RpMeter value={scale > 0 ? it.value / scale : 0} tone={it.tone ?? 'gold'} size={2} label={it.label} />
          </li>
        )
      })}
    </ol>
  )
}
