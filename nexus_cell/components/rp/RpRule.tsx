import { cn } from '@/lib/utils'
import type { RpTone } from './types'
import { RpTag } from './RpTag'

/** 1px #1F1F1F rule. Rules sit above sections, never under headings. */
export function RpRule({ className }: { className?: string }) {
  return <hr className={cn('m-0 border-0 border-t border-rp-line', className)} />
}

/** Disclaimer / note: rule above, 13px dim, 70ch. */
export function RpNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('rp-note', className)}>{children}</p>
}

/** Provenance row: tag + 13px muted text. e.g. AS ISSUED · CUBE 3 Studio · Sheet A-80a. */
export function RpSource({ tag, tone = 'neutral', children, className }: { tag: string; tone?: RpTone; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rp-source', className)}>
      <RpTag tone={tone}>{tag}</RpTag>
      {children != null && <span>{children}</span>}
    </div>
  )
}
