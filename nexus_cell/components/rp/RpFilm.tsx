/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RpCapNum } from './RpText'

export interface RpFilmProps {
  src: string
  alt?: string
  /** Big Oswald line on the image: '443 acres in the pines'. */
  line: React.ReactNode
  /** 13px tracked uppercase meta under the line. */
  meta?: React.ReactNode
  /** Default 'film' (21/9). Below 640px every film frame becomes 16/10. */
  aspect?: 'film' | 'banner' | 'wide' | 'aerial'
  objectPosition?: string
  /** Frame becomes a link. */
  href?: string
  badge?: string
  /** Optional numbered caption under the frame. */
  caption?: React.ReactNode
  num?: number | string
  className?: string
}

/** Image frame with a bottom-up dark overlay and a big Oswald line. Server-safe. */
export function RpFilm({ src, alt, line, meta, aspect = 'film', objectPosition, href, badge, caption, num, className }: RpFilmProps) {
  const inner = (
    <>
      {badge && <span className="rp-frame-badge">{badge}</span>}
      <img src={src} alt={alt ?? ''} style={objectPosition ? { objectPosition } : undefined} />
      <span className="rp-film-overlay">
        <span className="rp-film-copy">
          <span className="rp-film-line">{line}</span>
          {meta != null && <span className="rp-film-meta">{meta}</span>}
        </span>
      </span>
    </>
  )
  const cls = cn('rp-frame', `rp-frame--${aspect}`, 'rp-film', !href && 'rp-frame--static')
  return (
    <figure className={cn('rp-figure', className)}>
      {href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}
      {(caption != null || num != null) && (
        <figcaption className="rp-figcap">
          <span className="rp-figcap-text">
            {num != null && <RpCapNum n={num} />}
            {caption != null && <span>{caption}</span>}
          </span>
        </figcaption>
      )}
    </figure>
  )
}
