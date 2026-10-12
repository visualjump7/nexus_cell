import { cn } from '@/lib/utils'

/** Root of every routed page and list component: column with the page gap,
 *  max 1400px, left-aligned, one rp-fade entrance. Server-safe. */
export function RpPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rp-page', className)}>{children}</div>
}
