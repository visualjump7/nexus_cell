import { cn } from '@/lib/utils'

/** Row of filters (tabs, selects, search) with a dim counter at the right, e.g. '118 tasks'. Server-safe. */
export function RpFilterBar({ children, count, className }: { children: React.ReactNode; count?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3', className)}>
      {children}
      {count != null && count !== false && <span className="rp-counter ml-auto">{count}</span>}
    </div>
  )
}
