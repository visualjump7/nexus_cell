import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RpCapNum } from './RpText'

export interface RpCardGridProps {
  children: React.ReactNode
  /** Minimum cell width in px (default 240). */
  min?: number
  /** Maximum columns (default 4). */
  max?: 1 | 2 | 3 | 4
  /** Ruled cells (default) or separate cells with gaps (image cards). */
  ruled?: boolean
  className?: string
}

/** Card grid. ruled = hairline grid like the concept's section index; not ruled = gap-x-4 gap-y-8. Server-safe. */
export function RpCardGrid({ children, min = 240, max = 4, ruled = true, className }: RpCardGridProps) {
  if (ruled) {
    return (
      <div
        className={cn('rp-ruled', className)}
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(max(min(100%, ${min}px), calc((100% - ${max - 1}px) / ${max})), 1fr))` }}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      className={cn('grid gap-x-4 gap-y-8', className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(max(min(100%, ${min}px), calc((100% - ${(max - 1) * 16}px) / ${max})), 1fr))` }}
    >
      {children}
    </div>
  )
}

export interface RpCardProps {
  num?: string | number
  title: React.ReactNode
  line?: React.ReactNode
  /** Whole card is a Link with a surface hover. */
  href?: string
  /** Right of the number row (e.g. a gold count or a tag). */
  aside?: React.ReactNode
  /** Frame/figure above the text. */
  media?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** The concept's section-index card: gold num, Oswald 20 title, 14px line. Server-safe. */
export function RpCard({ num, title, line, href, aside, media, children, className }: RpCardProps) {
  const body = (
    <>
      {media}
      {(num != null || aside) && (
        <div className="flex h-4 items-center justify-between gap-3">
          {num != null ? <RpCapNum n={num} className="text-xs leading-none tracking-[.1em]" /> : <span />}
          {aside}
        </div>
      )}
      <h3 className="rp-card-title">{title}</h3>
      {line != null && line !== false && <p className="text-sm leading-[1.4] text-rp-muted">{line}</p>}
      {children}
    </>
  )
  const cls = cn('rp-card', className)
  if (href) return <Link href={href} className={cn(cls, 'rp-card--link')}>{body}</Link>
  return <div className={cls}>{body}</div>
}

export interface RpBoxProps {
  children: React.ReactNode
  /** ground = #0A0B0C + rule (default); panel = #0E0F11 inset/mat. */
  tone?: 'ground' | 'panel'
  /** none (default) · md = p-5 · lg = px-6 py-7. */
  pad?: 'none' | 'md' | 'lg'
  as?: 'div' | 'section' | 'article'
  className?: string
  id?: string
}

/** Bordered square box. Never #141618 as a card fill. Server-safe. */
export function RpBox({ children, tone = 'ground', pad = 'none', as: Tag = 'div', className, id }: RpBoxProps) {
  return (
    <Tag
      id={id}
      className={cn(
        tone === 'panel' ? 'rp-inset' : 'rp-box',
        pad === 'md' && 'p-5',
        pad === 'lg' && 'px-6 py-7',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
