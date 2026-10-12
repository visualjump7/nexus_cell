import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RpPines } from './RpPines'

export interface RpPageHeaderProps {
  /** '03 · Projects' — use sectionEyebrow() from lib/sections. */
  eyebrow?: string
  /** RpTag / RpStatus shown beside the eyebrow. */
  tags?: React.ReactNode
  title: React.ReactNode
  /** The one declarative line (18px muted lede). */
  line?: React.ReactNode
  /** Optional ' · ' spec line (16px muted). */
  spec?: React.ReactNode
  /** Right column, bottom-aligned; wraps under the text on narrow screens. */
  actions?: React.ReactNode
  /** Back link above the eyebrow: '← Projects'. */
  back?: { href: string; label: string }
  /** Default 'head' (pines beside the title, right side). */
  pines?: 'head' | false
  size?: 'panel' | 'hero'
  className?: string
}

/** The panel header: gold eyebrow, Oswald title, one line. No rule under it. Server-safe. */
export function RpPageHeader({ eyebrow, tags, title, line, spec, actions, back, pines = 'head', size = 'panel', className }: RpPageHeaderProps) {
  return (
    <header className={cn('rp-head', className)}>
      {back && (
        <Link href={back.href} className="rp-btn-back self-start">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="rp-head-grid">
        <div className="rp-head-main">
          {(eyebrow || tags) && (
            <div className="rp-eyebrow-row">
              {eyebrow && <span className="rp-eyebrow rp-head-eyebrow">{eyebrow}</span>}
              {tags}
            </div>
          )}
          <h1 className={cn('rp-title', size === 'hero' && 'rp-title--hero')}>{title}</h1>
          {line != null && line !== false && <p className="rp-lede">{line}</p>}
          {spec != null && spec !== false && <p className="rp-spec">{spec}</p>}
        </div>
        {actions && <div className="rp-head-actions">{actions}</div>}
      </div>
      {pines === 'head' && <RpPines placement="head" />}
    </header>
  )
}
