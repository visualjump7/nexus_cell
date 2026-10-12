/* eslint-disable @next/next/no-img-element */
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

export type RpPinesPlacement = 'head' | 'subhead' | 'foot' | 'gate' | 'backdrop' | 'empty'

const DEFAULT_VARIANT: Record<RpPinesPlacement, 'left' | 'right' | 'paired'> = {
  head: 'right',
  subhead: 'left',
  foot: 'right',
  gate: 'paired',
  backdrop: 'paired',
  empty: 'paired',
}

const SRC = {
  left: BRAND.pinesLeft,
  right: BRAND.pinesRight,
  paired: BRAND.pines,
} as const

/**
 * Near-invisible pine silhouettes (brightness .09, z-index -1). The parent must
 * be position:relative inside an isolated ancestor (RpPage, RpEmpty, the gate).
 * head/subhead hide at ≤1099px, foot at ≤699px. Decorative: alt="" aria-hidden.
 */
export function RpPines({ placement, variant, className }: { placement: RpPinesPlacement; variant?: 'left' | 'right' | 'paired'; className?: string }) {
  const v = variant ?? DEFAULT_VARIANT[placement]
  return <img src={SRC[v]} alt="" aria-hidden className={cn('rp-pines', `rp-pines--${placement}`, className)} />
}
