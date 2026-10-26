'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RpUrlTabs } from './RpTabs'
import { RpCapNum } from './RpText'

export interface RpLoopItem {
  id: string
  /** Index in the tab and the caption: '01'. */
  num?: string
  /** Short tab label: 'Draws by month'. */
  label: string
  /** One sentence: the video's aria-label and the caption under the frame. */
  line: string
  /** MP4 (H.264, faststart). Muted, looped, no controls. */
  src: string
  /** Still shown before playback, under reduced motion and if the video fails. */
  poster: string
}

export interface RpLoopPlayerProps {
  items: RpLoopItem[]
  /** Search param that holds the active id. Default 'loop'. */
  param?: string
  /** Id used when the param is absent. Default: the first item. */
  defaultId?: string
  /** Names the tab row. */
  ariaLabel?: string
  className?: string
}

/** Fired by RpLoopLink so the player restarts a loop that is already selected but paused. */
const PLAY_EVENT = 'rp-loop-play'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Plays muted. If autoplay is refused (power saving, policy) or interrupted,
 *  the toggle falls back to Play and the frame rests where it is. */
function startVideo(v: HTMLVideoElement, ref: React.RefObject<HTMLVideoElement>, setPlaying: (p: boolean) => void) {
  v.muted = true
  v.play()?.catch(() => { if (ref.current === v) setPlaying(false) })
}

interface ViewProps extends Required<Omit<RpLoopPlayerProps, 'className'>> {
  active: RpLoopItem
  className?: string
}

function LoopView({ items, active, param, defaultId, ariaLabel, className }: ViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // null until mounted: the server cannot know the viewer's motion preference,
  // so nothing autoplays from the server HTML.
  const [reduced, setReduced] = useState<boolean | null>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const { src } = active
  const broken = failed === src

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION)
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // A newly selected loop plays from the start, unless the viewer prefers
  // reduced motion: then it rests on its poster until they press Play.
  useEffect(() => {
    const v = videoRef.current
    if (!v || reduced === null) return
    // A load error can land before hydration, when React is not yet listening.
    // (Check `error` only: networkState reads NO_SOURCE for a moment on every new src.)
    if (v.error) {
      setFailed(src)
      setPlaying(false)
      return
    }
    if (reduced) {
      v.pause()
      setPlaying(false)
    } else {
      startVideo(v, videoRef, setPlaying)
    }
  }, [src, reduced])

  // "Watch" on the loop that is already selected restarts it if it was paused.
  useEffect(() => {
    const onRequest = (e: Event) => {
      const v = videoRef.current
      if (!v || reduced !== false || !v.paused || (e as CustomEvent<string>).detail !== active.id) return
      startVideo(v, videoRef, setPlaying)
    }
    window.addEventListener(PLAY_EVENT, onRequest)
    return () => window.removeEventListener(PLAY_EVENT, onRequest)
  }, [active.id, reduced])

  function toggle() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) startVideo(v, videoRef, setPlaying)
    else v.pause()
  }

  const tabs = items.map(({ id, num, label }) => ({ id, num, label }))

  return (
    <div className={cn('rp-loop', className)} tabIndex={-1} data-rp-loop>
      <RpUrlTabs items={tabs} param={param} defaultId={defaultId} mode="replace" shallow scroll ariaLabel={ariaLabel} />
      <figure className="rp-figure">
        <div className="rp-frame rp-frame--wide rp-frame--static rp-loop-frame">
          {broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.poster} alt={active.line} />
          ) : (
            <video
              key={src}
              ref={videoRef}
              src={src}
              poster={active.poster}
              autoPlay={reduced === false}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={active.line}
              onPlay={e => { if (e.currentTarget === videoRef.current) setPlaying(true) }}
              onPause={e => { if (e.currentTarget === videoRef.current) setPlaying(false) }}
              onError={e => {
                if (e.currentTarget !== videoRef.current) return
                setFailed(src)
                setPlaying(false)
              }}
            />
          )}
        </div>
        <figcaption className="rp-figcap rp-loop-cap">
          <span className="rp-figcap-text">
            {active.num && <RpCapNum n={active.num} />}
            {/* Every line is laid out in one cell so the row keeps the height of
                the longest: switching loops never moves the page below. */}
            <span className="rp-loop-lines">
              {items.map(it => (
                <span key={it.id} className={it.id === active.id ? undefined : 'invisible'}>{it.line}</span>
              ))}
            </span>
          </span>
          <button
            type="button"
            className={cn('rp-btn-ghost rp-btn--sm rp-loop-toggle', broken && 'invisible')}
            onClick={toggle}
            disabled={broken}
          >
            <span aria-hidden className={cn('rp-loop-glyph', playing && 'rp-loop-glyph--pause')} />
            {playing ? 'Pause' : 'Play'}
          </button>
        </figcaption>
      </figure>
    </div>
  )
}

function LoopFromUrl(props: Omit<ViewProps, 'active'>) {
  const params = useSearchParams()
  const id = params?.get(props.param)
  const active = props.items.find(i => i.id === id) ?? props.items.find(i => i.id === props.defaultId) ?? props.items[0]
  return <LoopView {...props} active={active} />
}

/**
 * 16:9 loop player: numbered tabs bound to ?param= (shallow, so switching never
 * refetches the page), a muted looping video and a Pause/Play toggle. Respects
 * prefers-reduced-motion (no autoplay: the poster rests with Play). If a video
 * fails, its poster stays in the frame. Wraps itself in Suspense (static
 * fallback shows the default loop).
 */
export function RpLoopPlayer({ items, param = 'loop', defaultId, ariaLabel = 'Choose a loop', className }: RpLoopPlayerProps) {
  if (items.length === 0) return null
  const fallbackId = defaultId && items.some(i => i.id === defaultId) ? defaultId : items[0].id
  const props = { items, param, defaultId: fallbackId, ariaLabel, className }
  const fallbackActive = items.find(i => i.id === fallbackId) ?? items[0]
  return (
    <Suspense fallback={<LoopView {...props} active={fallbackActive} />}>
      <LoopFromUrl {...props} />
    </Suspense>
  )
}

export interface RpLoopLinkProps {
  /** Loop to select. */
  id: string
  /** Loop name for assistive tech: 'Watch loop: Draws by month'. */
  label?: string
  /** Must match the player's param. Default 'loop'. */
  param?: string
  /** Id of the element that holds the player. Default 'showcase'. */
  anchor?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Quiet text link ("Watch") that selects a loop in RpLoopPlayer and scrolls to
 * it without a server round trip. A real link (?param=id#anchor) underneath, so
 * a new tab or no-JS still lands on the right loop.
 */
export function RpLoopLink({ id, label, param = 'loop', anchor = 'showcase', children = 'Watch', className }: RpLoopLinkProps) {
  const href = `?${param}=${encodeURIComponent(id)}#${anchor}`

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const target = document.getElementById(anchor)
    if (!target) return
    e.preventDefault()
    const url = new URL(window.location.href)
    url.searchParams.set(param, id)
    url.hash = anchor
    // Next (14.1+) syncs useSearchParams with the native History API.
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: id }))
    const focusTarget = target.querySelector<HTMLElement>('[data-rp-loop]') ?? target
    focusTarget.focus({ preventScroll: true })
    const smooth = !window.matchMedia(REDUCED_MOTION).matches
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  return (
    <a
      href={href}
      className={cn('rp-btn-text rp-btn--sm rp-loop-link', className)}
      aria-label={label ? `Watch loop: ${label}` : undefined}
      onClick={onClick}
    >
      <span aria-hidden className="rp-loop-glyph" />
      {children}
    </a>
  )
}
