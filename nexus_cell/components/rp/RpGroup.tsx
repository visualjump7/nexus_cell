import { cn } from '@/lib/utils'
import { RpCapNum } from './RpText'

/** Stacked group (flex column, gap 16). Consecutive groups get a rule + 24px. Server-safe. */
export function RpGroup({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn('rp-group', className)}>{children}</section>
}

export interface RpGroupHeadProps {
  num?: string | number
  title: React.ReactNode
  /** Tag beside the title. */
  tag?: React.ReactNode
  /** 14px muted line. */
  line?: React.ReactNode
  /** Right side (ml-auto): a figure, a count, a meter, buttons. */
  aside?: React.ReactNode
  as?: 'h2' | 'h3' | 'h4'
  className?: string
}

/** Group head: gold num, Oswald 24 title, tag, muted line, aside at the right. Server-safe. */
export function RpGroupHead({ num, title, tag, line, aside, as: Tag = 'h3', className }: RpGroupHeadProps) {
  return (
    <div className={cn('rp-group-head', className)}>
      {num != null && <RpCapNum n={num} className="text-[13px]" />}
      <Tag className="rp-group-title">{title}</Tag>
      {tag}
      {line != null && line !== false && <span className="rp-group-line">{line}</span>}
      {aside != null && aside !== false && <div className="rp-group-aside">{aside}</div>}
    </div>
  )
}
