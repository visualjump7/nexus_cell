'use client'

import { cn } from '@/lib/utils'
import type { RpAspect, RpImage } from './types'
import { RpFigure } from './RpFigure'
import { useRpLightbox } from './RpLightbox'
import { isMatAspect, pairedAspects } from './frame'

export interface RpGalleryProps {
  images: RpImage[]
  /**
   * lead-pairs (default): first image full width, then 2-up from 640px.
   * grid: auto-fit, min 320. pairs: 2-up at most. wide: min 400, gap 24.
   * strip: up to 4 small 16/10 thumbs in one row.
   */
  layout?: 'lead-pairs' | 'grid' | 'pairs' | 'wide' | 'strip'
  /** Number of the first image (default 1). */
  startAt?: number
  /** Forces one aspect for every frame (otherwise each image's own, default aerial). */
  aspect?: RpAspect
  /** Rendered as a last cell, e.g. an "Add images" plate. */
  after?: React.ReactNode
  className?: string
}

type Layout = NonNullable<RpGalleryProps['layout']>

const GRID: Record<Layout, string> = {
  'lead-pairs': 'grid grid-cols-1 gap-4 min-[640px]:grid-cols-2',
  grid: 'grid gap-4',
  pairs: 'grid gap-4',
  wide: 'grid gap-6',
  strip: 'grid grid-cols-2 gap-3 min-[640px]:grid-cols-4',
}

const GRID_STYLE: Partial<Record<Layout, React.CSSProperties>> = {
  grid: { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' },
  pairs: { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, max(320px, calc(50% - 8px))), 1fr))' },
  wide: { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' },
}

/** Numbered, framed images sharing one lightbox (← → stepping). */
export function RpGallery({ images, layout = 'lead-pairs', startAt = 1, aspect, after, className }: RpGalleryProps) {
  const lb = useRpLightbox(images)
  const list = layout === 'strip' ? images.slice(0, 4) : images
  // lead-pairs: lead spans both columns; an odd trailing image also spans, so
  // the last row never leaves a hole (unless an `after` cell fills it).
  const lastIndex = list.length - 1
  const restCount = list.length - 1 + (after ? 1 : 0)
  // lead-pairs / pairs: both frames of a pair share one aspect (no ragged rows
  // where a plan sheet sits beside a render). A forced `aspect` wins.
  const own = list.map(img => ({ aspect: img.aspect ?? 'aerial', mat: img.mat ?? isMatAspect(img.aspect ?? 'aerial') }))
  const paired = layout === 'lead-pairs' ? pairedAspects(own, 1) : layout === 'pairs' ? pairedAspects(own, 0) : null

  return (
    <div className={cn(GRID[layout], className)} style={GRID_STYLE[layout]}>
      {list.map((img, i) => {
        const span =
          layout === 'lead-pairs' && (i === 0 || (i === lastIndex && restCount % 2 === 1 && !after))
        const frameAspect: RpAspect = layout === 'strip' ? (aspect ?? 'card') : (aspect ?? paired?.[i] ?? img.aspect ?? 'aerial')
        return (
          <RpFigure
            key={`${img.src}-${i}`}
            src={img.src}
            alt={img.alt}
            caption={layout === 'strip' ? undefined : img.caption}
            num={startAt + i}
            qualifier={layout === 'strip' ? undefined : img.qualifier}
            aspect={frameAspect}
            mat={aspect ? img.mat : own[i].mat}
            badge={layout === 'strip' ? undefined : img.badge}
            objectPosition={img.objectPosition}
            onOpen={() => lb.open(i)}
            className={span ? 'min-[640px]:col-span-2' : undefined}
          />
        )
      })}
      {after && <div className="min-w-0">{after}</div>}
      {lb.node}
    </div>
  )
}
