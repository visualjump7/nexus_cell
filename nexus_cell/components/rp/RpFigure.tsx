'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RpAspect } from './types'
import { RpCapNum } from './RpText'
import { RpPending } from './RpPending'
import { RpLightbox } from './RpLightbox'
import { frameClass, isMatAspect } from './frame'

export interface RpFigureProps {
  /** Empty → the striped "Asset pending" plate. */
  src?: string | null
  alt?: string
  /** Subject · detail (13px muted, under the frame). */
  caption?: React.ReactNode
  /** Gold index before the caption. */
  num?: number | string
  /** Right-hand caption text, e.g. 'Representative view'. */
  qualifier?: React.ReactNode
  /** Default 'aerial' (16/10). */
  aspect?: RpAspect
  /** White drawing mat + contain. Automatic for plan | sheet | masterplan. */
  mat?: boolean
  /** Gold frame badge, e.g. 'Phantom concept'. */
  badge?: string
  /** Lightbox prefix ('Aerial render', 'As issued', …). Accepted from an RpImage spread. */
  provenance?: string
  /** Larger lightbox source. Accepted from an RpImage spread. */
  full?: string
  /** Opens its own lightbox on click. Default true when there is no href/onOpen. */
  lightbox?: boolean
  /** Custom click handler (e.g. a shared gallery lightbox). */
  onOpen?: () => void
  /** Frame becomes a link. */
  href?: string
  /** Hover zoom 1.02 over .8s. Default true. */
  zoom?: boolean
  objectPosition?: string
  /** Content over the image (bottom-left, with a dark gradient). */
  overlay?: React.ReactNode
  /** Rich caption (merch/card style): gold num + Oswald 24 name … */
  richTitle?: React.ReactNode
  /** … and a 15px muted line. */
  richLine?: React.ReactNode
  /** Name shown on the pending plate. */
  pendingName?: string
  loading?: 'lazy' | 'eager'
  className?: string
  frameClassName?: string
}

/**
 * Hairline-framed image with a numbered caption below. Accepts an RpImage
 * spread: <RpFigure {...img} num={1} />. The frame is a button (own lightbox
 * or onOpen), a Link (href) or a plain block.
 */
export function RpFigure({
  src, alt, caption, num, qualifier, aspect = 'aerial', mat, badge, provenance, full,
  lightbox, onOpen, href, zoom = true, objectPosition, overlay, richTitle, richLine,
  pendingName, loading = 'lazy', className, frameClassName,
}: RpFigureProps) {
  const [open, setOpen] = useState(false)
  const useMat = mat ?? isMatAspect(aspect)
  // Own lightbox unless the frame is a link, has a custom opener, or lightbox={false}.
  const ownLightbox = lightbox !== false && !href && !onOpen
  const captionText = typeof caption === 'string' ? caption : undefined
  const label = captionText || alt || 'image'

  const inner = (
    <>
      {badge && <span className="rp-frame-badge">{badge}</span>}
      {src ? (
        <img
          src={src}
          alt={alt ?? captionText ?? ''}
          loading={loading}
          style={objectPosition ? { objectPosition } : undefined}
        />
      ) : (
        <RpPending name={pendingName} />
      )}
      {overlay && <span className="rp-frame-overlay">{overlay}</span>}
    </>
  )

  const cls = cn(frameClass(aspect, useMat), !zoom && 'rp-frame--static', frameClassName)

  let frame: React.ReactNode
  if (href) {
    frame = <Link href={href} className={cls} aria-label={typeof richTitle === 'string' ? richTitle : label}>{inner}</Link>
  } else if (onOpen || ownLightbox) {
    frame = (
      <button type="button" className={cls} aria-label={`Enlarge: ${label}`} onClick={onOpen ?? (() => setOpen(true))}>
        {inner}
      </button>
    )
  } else {
    frame = <div className={cls}>{inner}</div>
  }

  const hasPlainCaption = caption != null || num != null || qualifier != null
  const hasRich = richTitle != null || richLine != null

  return (
    <figure className={cn('rp-figure', className)}>
      {frame}
      {hasRich ? (
        <figcaption className="rp-richcap">
          <span className="rp-richcap-row">
            {num != null && <RpCapNum n={num} />}
            {richTitle != null && <span className="rp-richcap-name">{richTitle}</span>}
          </span>
          {richLine != null && <span className="rp-richcap-line">{richLine}</span>}
          {(caption != null || qualifier != null) && (
            <span className="rp-figcap">
              <span className="rp-figcap-text">{caption}</span>
              {qualifier != null && <span className="rp-figcap-qual">{qualifier}</span>}
            </span>
          )}
        </figcaption>
      ) : hasPlainCaption ? (
        <figcaption className="rp-figcap">
          <span className="rp-figcap-text">
            {num != null && <RpCapNum n={num} />}
            {caption != null && <span>{caption}</span>}
          </span>
          {qualifier != null && <span className="rp-figcap-qual">{qualifier}</span>}
        </figcaption>
      ) : null}
      {ownLightbox && (
        <RpLightbox
          image={open ? { src: src || '', full, caption: captionText ?? alt, provenance, alt, badge } : null}
          onClose={() => setOpen(false)}
        />
      )}
    </figure>
  )
}
