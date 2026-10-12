import type { ReactNode } from 'react'
import { Plane, BedDouble, Car, TrainFront, CarTaxiFront, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tripImage } from '@/lib/project-imagery'
import type { RpImage } from '@/components/rp'

// Lucide stroke icons at the kit size (16 / 1.5). Colour comes from the
// caller (currentColor), usually the segment colour in lib/travel-constants.

const ICON = { size: 16, strokeWidth: 1.5 }

export function FlightIcon() { return <Plane {...ICON} aria-hidden /> }
export function HotelIcon() { return <BedDouble {...ICON} aria-hidden /> }
export function CarIcon() { return <Car {...ICON} aria-hidden /> }
export function TrainIcon() { return <TrainFront {...ICON} aria-hidden /> }
export function GroundIcon() { return <CarTaxiFront {...ICON} aria-hidden /> }
export function OtherIcon() { return <MapPin {...ICON} aria-hidden /> }

const iconMap: Record<string, LucideIcon> = {
  flight: Plane,
  hotel: BedDouble,
  car: Car,
  train: TrainFront,
  ground_transport: CarTaxiFront,
  other: MapPin,
}

/** Segment icon; pass a size for larger contexts (default 16). */
export function getSegmentIcon(type: string, size = ICON.size): ReactNode {
  const Icon = iconMap[type] || MapPin
  return <Icon size={size} strokeWidth={ICON.strokeWidth} aria-hidden />
}

const LABELS: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  car: 'Car',
  train: 'Train',
  ground_transport: 'Ground',
  other: 'Other',
}

/** Short type label: 'Flight', 'Hotel', 'Ground' … */
export function segmentLabel(type: string): string {
  return LABELS[type] || type.replace(/_/g, ' ')
}

/**
 * Split a trip title into purpose and route.
 * 'Jacksonville to Palatka — OAC & Draw #10 Site Week' → { purpose: 'OAC & Draw #10 Site Week', route: 'Jacksonville → Palatka' }
 * 'Benchmarking Tour — Thermal, Monticello & Atlanta' → { purpose: 'Benchmarking Tour', route: 'Thermal, Monticello & Atlanta' }
 * A title without a dash is all purpose.
 */
export function tripParts(title: string | null | undefined): { purpose: string; route: string | null } {
  const t = (title || '').trim()
  const m = t.match(/^(.*?)\s+[—–]\s+(.*)$/)
  if (!m) return { purpose: t || 'Trip', route: null }
  const [, before, after] = m
  if (/\s+to\s+/i.test(before)) return { purpose: after, route: before.replace(/\s+to\s+/gi, ' → ') }
  return { purpose: before, route: after }
}

/**
 * Trip imagery: matched on the title first (route and purpose are the most
 * specific words), then on the notes (see tripImage).
 */
export function tripHero(trip: { id?: string; title?: string | null; notes?: string | null }): RpImage {
  return tripImage(trip)
}

/** Below 640px, wrap a list row's status and actions onto their own line. */
export const ROW_STACK_SM = 'max-sm:flex-wrap max-sm:[&>.rp-row-main]:basis-0 max-sm:[&>.rp-row-end]:max-w-none max-sm:[&>.rp-row-end]:basis-full max-sm:[&>.rp-row-end]:justify-start'
