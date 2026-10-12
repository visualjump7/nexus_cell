import { cn } from '@/lib/utils'

export interface RpTableProps {
  /** Plain <thead>/<tbody>/<tfoot>. Cell conventions: td.num (right, tabular),
   *  td.idx (gold index), span.sub (13px muted second line), tr[data-href] (pointer),
   *  tr[aria-selected=true] (gold edge). */
  children: React.ReactNode
  /** 10px row padding instead of 12. */
  dense?: boolean
  /** Table min-width in px; the wrapper scrolls sideways below it. */
  minWidth?: number
  /** Screen-reader caption. */
  caption?: string
  className?: string
}

/** Ruled data table: Oswald header, rules between rows, surface hover. Scrolls inside its wrapper. Server-safe. */
export function RpTable({ children, dense, minWidth, caption, className }: RpTableProps) {
  return (
    <div className={cn('rp-table-wrap', className)}>
      <table className={cn('rp-table', dense && 'rp-table--dense')} style={minWidth ? { minWidth } : undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

export interface RpKVItem { label: string; value: React.ReactNode; num?: boolean }

/** Key–value rows: Oswald dim label left, 15px value right. cols=2 sets two columns from 560px. Server-safe. */
export function RpKV({ items, cols = 1, className }: { items: RpKVItem[]; cols?: 1 | 2; className?: string }) {
  return (
    <dl className={cn('rp-kv', cols === 2 && 'rp-kv--2', className)}>
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`} className="rp-kv-row">
          <dt>{it.label}</dt>
          <dd className={cn(it.num && 'num')}>{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
