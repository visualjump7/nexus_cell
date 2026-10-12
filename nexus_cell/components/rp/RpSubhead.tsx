import { cn } from '@/lib/utils'
import { RpCapNum } from './RpText'
import { RpPines } from './RpPines'

export interface RpSubheadProps {
  /** Anchor id (used by RpSectionNav). */
  id?: string
  /** Gold cap-num before the title. */
  num?: string | number
  title: React.ReactNode
  /** ' · ' spec line, 16px muted. */
  spec?: React.ReactNode
  /** Tabs / actions at the right, bottom-aligned; wraps under as a whole. */
  aside?: React.ReactNode
  /** lg = clamp(26–40) (default), md = Oswald 24. */
  size?: 'lg' | 'md'
  /** No rule above. */
  flush?: boolean
  /** Left pine cluster standing on the rule (hidden ≤1099px). */
  pines?: boolean
  as?: 'h2' | 'h3'
  className?: string
}

/** In-page section header: rule above, big title, spec, tabs/actions right. Server-safe. */
export function RpSubhead({ id, num, title, spec, aside, size = 'lg', flush, pines, as: Tag = 'h2', className }: RpSubheadProps) {
  return (
    <div id={id} className={cn('rp-subhead', flush && 'rp-subhead--flush', className)}>
      <div className="rp-subhead-text">
        <Tag className={cn(size === 'md' ? 'rp-title--item' : 'rp-title--sub', 'flex items-baseline gap-3')}>
          {num != null && <RpCapNum n={num} className="text-[.5em] leading-none" />}
          <span className="min-w-0">{title}</span>
        </Tag>
        {spec != null && spec !== false && <p className="rp-spec">{spec}</p>}
      </div>
      {aside && <div className="rp-subhead-aside">{aside}</div>}
      {pines && <RpPines placement="subhead" />}
    </div>
  )
}
