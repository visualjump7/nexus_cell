'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RpImage } from './types'
import { pad2 } from './format'
import { pushEscapeLayer } from './escape'

export interface RpLightboxProps {
  image: RpImage | null
  onClose: () => void
  /** 0-based index for the counter. */
  index?: number
  count?: number
  /** Enables ← → buttons and arrow keys. */
  onStep?: (d: -1 | 1) => void
}

/** Lightbox caption: '{provenance} · {caption}'. */
export function lightboxCaption(img: RpImage): string {
  return [img.provenance, img.caption].filter(Boolean).join(' · ')
}

/**
 * Full-screen viewer: scrim .96, caption top-left, counter / Prev / Next /
 * Close top-right, image contained. Click anywhere or Esc closes; ← → step.
 * Focus moves to Close and returns on close. Portal to body, z 70.
 */
export function RpLightbox({ image, onClose, index, count, onStep }: RpLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const open = !!image

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
    }
  }, [open])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    if (!open) return
    return pushEscapeLayer(() => onCloseRef.current())
  }, [open])

  useEffect(() => {
    if (!open || !onStep) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onStep!(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onStep!(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onStep])

  if (!mounted || !image) return null
  const caption = lightboxCaption(image)
  const src = image.full || image.src
  const showCounter = index != null && count != null && count > 1

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption || 'Image'}
      className="rp-lightbox"
      onClick={onClose}
    >
      <div className="rp-lightbox-bar">
        <p className="rp-lightbox-caption">{caption}</p>
        <div className="flex shrink-0 items-center gap-4" onClick={e => e.stopPropagation()}>
          {showCounter && <span className="rp-counter">{pad2(index! + 1)} / {pad2(count!)}</span>}
          {onStep && count != null && count > 1 && (
            <>
              <button type="button" className="rp-btn-back" onClick={() => onStep(-1)}><span aria-hidden>←</span> Prev</button>
              <button type="button" className="rp-btn-text" onClick={() => onStep(1)}>Next <span aria-hidden>→</span></button>
            </>
          )}
          <button ref={closeRef} type="button" className="rp-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="rp-lightbox-body">
        {src ? (
          <img src={src} alt={image.alt ?? image.caption ?? ''} />
        ) : (
          <span className="rp-pending rp-pending--static">
            <span className="rp-pending-label">Asset pending</span>
            {image.caption && <span className="rp-pending-name">{image.caption}</span>}
          </span>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * One lightbox for a set of images, with stepping.
 *   const lb = useRpLightbox(images)
 *   <button onClick={() => lb.open(2)}>…</button>
 *   {lb.node}
 */
export function useRpLightbox(images: RpImage[]): { open: (i: number) => void; close: () => void; node: React.ReactNode } {
  const [index, setIndex] = useState<number | null>(null)
  const count = images.length
  const open = useCallback((i: number) => setIndex(Math.max(0, Math.min(i, count - 1))), [count])
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback((d: -1 | 1) => {
    setIndex(i => (i == null || count === 0 ? i : (i + d + count) % count))
  }, [count])
  const image = index != null ? images[index] ?? null : null
  const node = useMemo(() => (
    <RpLightbox image={image} onClose={close} index={index ?? undefined} count={count} onStep={count > 1 ? step : undefined} />
  ), [image, close, index, count, step])
  return { open, close, node }
}
