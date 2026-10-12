import { cn } from '@/lib/utils'
import { pad2 } from './format'

/** Gold (default) or muted Oswald eyebrow: '03 · Projects'. */
export function RpEyebrow({ children, tone = 'gold', className }: { children: React.ReactNode; tone?: 'gold' | 'muted'; className?: string }) {
  return <span className={cn(tone === 'muted' ? 'rp-eyebrow--muted' : 'rp-eyebrow', className)}>{children}</span>
}

const TITLE_SIZE: Record<'hero' | 'panel' | 'sub' | 'item', string> = {
  hero: 'rp-title rp-title--hero',
  panel: 'rp-title',
  sub: 'rp-title--sub',
  item: 'rp-title--item',
}

/** Oswald uppercase title. panel = clamp(36–64), hero = clamp(44–88), sub = clamp(26–40), item = 24px. */
export function RpTitle({ as: Tag = 'h1', size = 'panel', children, className, id }: {
  as?: 'h1' | 'h2' | 'h3'
  size?: 'hero' | 'panel' | 'sub' | 'item'
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return <Tag id={id} className={cn(TITLE_SIZE[size], className)}>{children}</Tag>
}

/** 18px / 1.45 muted line, 60ch (56ch when narrow). */
export function RpLede({ children, narrow, className }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return <p className={cn('rp-lede', narrow && 'rp-lede--narrow', className)}>{children}</p>
}

/** Gold two-digit index: 3 → '03'. Strings are padded when numeric. */
export function RpCapNum({ n, className }: { n: number | string; className?: string }) {
  const text = typeof n === 'number' || /^\d+$/.test(n) ? pad2(n) : n
  return <span className={cn('rp-cap-num', className)}>{text}</span>
}

/** Dim Oswald counter: '03 / 11'. */
export function RpCounter({ current, total, className }: { current: number; total: number; className?: string }) {
  return (
    <span className={cn('rp-counter', className)} aria-label={`${current} of ${total}`}>
      {pad2(current)} / {pad2(total)}
    </span>
  )
}
