import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RpCapNum } from './RpText'

/** Ruled list (rule above, one under each row). Server-safe. */
export function RpList({ children, className, as: Tag = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'ul' | 'ol' }) {
  return <Tag className={cn('rp-list', className)}>{children}</Tag>
}

export interface RpRowProps {
  /** Gold cap-num at the left. */
  index?: string | number
  /** Left marker: RpPriority, an icon, a colour square. */
  lead?: React.ReactNode
  title: React.ReactNode
  /** body = 15px/500 Source Sans (default); display = Oswald 18 uppercase. */
  titleStyle?: 'body' | 'display'
  /** 13px muted line(s) under the title. */
  meta?: React.ReactNode
  /** Right side: status tag, figure, time. */
  aside?: React.ReactNode
  /** Row buttons; hover-revealed at md+ on hover devices, always visible otherwise. */
  actions?: React.ReactNode
  /** Title becomes a Link and the whole row is clickable. */
  href?: string
  /** Title becomes a button and the whole row is clickable (when no href). */
  onClick?: () => void
  selected?: boolean
  /** 2px left edge in a tone. */
  edge?: 'gold' | 'alert' | 'blue' | 'green'
  /** Dim, struck-through title. */
  done?: boolean
  /** Rendered element; use 'li' inside <RpList as="ul">. */
  as?: 'div' | 'li'
  className?: string
}

/**
 * List row: [index · lead | title + meta | aside · actions].
 * No hooks, no directive: renders on the server with href, or in a client
 * component with onClick.
 */
export function RpRow({ index, lead, title, titleStyle = 'body', meta, aside, actions, href, onClick, selected, edge, done, as: Tag = 'div', className }: RpRowProps) {
  const titleClass = cn('rp-row-title', titleStyle === 'display' && 'rp-row-title--display')
  const titleNode = href ? (
    <Link href={href} className={cn(titleClass, 'rp-row-link')}>{title}</Link>
  ) : onClick ? (
    <button type="button" onClick={onClick} className={cn(titleClass, 'rp-row-link')}>{title}</button>
  ) : (
    <div className={titleClass}>{title}</div>
  )
  return (
    <Tag
      className={cn(
        'rp-row',
        (href || onClick) && 'rp-row--link',
        edge && `rp-row--edge-${edge}`,
        selected && 'rp-row--selected',
        done && 'rp-row--done',
        className,
      )}
      aria-current={selected ? 'true' : undefined}
    >
      {(index != null || lead) && (
        <div className="rp-row-lead">
          {index != null && <RpCapNum n={index} />}
          {lead}
        </div>
      )}
      <div className="rp-row-main">
        {titleNode}
        {meta != null && meta !== false && <div className="rp-row-meta">{meta}</div>}
      </div>
      {(aside || actions) && (
        <div className="rp-row-end">
          {aside}
          {actions && <div className="rp-row-actions">{actions}</div>}
        </div>
      )}
    </Tag>
  )
}
