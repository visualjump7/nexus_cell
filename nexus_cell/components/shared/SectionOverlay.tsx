'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useId, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { RpButton, pushEscapeLayer } from '@/components/rp'
import { sectionFor } from '@/lib/sections'
import { SECTION_HERO } from '@/lib/project-imagery'

interface Props {
  // Section title shown in the overlay header (e.g. "Travel")
  title: string
  // Standalone route the "Open full page" button navigates to
  fullPageHref: string
  children: React.ReactNode
}

// SectionOverlay is the chrome around any section's content when rendered as
// an intercepted modal on top of the overview ("/").
//
// It reads like a panel of the pitch site: a bar with the gold "NN · Section"
// eyebrow, then (for section overlays) a hero image band from SECTION_HERO
// that the page's own header rises over. Detail overlays (a project, a trip)
// bring their own hero, so they get the bar only, with " · {title}".
//
// Closing strategies:
//   - Esc, click outside, or Close → router.back() to fall off the
//     intercepting route and return to "/"
//   - "Open full page" → router.push(fullPageHref) to leave overlay context
//     and load the standalone page with full chrome
export default function SectionOverlay({ title, fullPageHref, children }: Props) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const close = useCallback(() => {
    router.back()
  }, [router])

  // Esc is layered: a modal opened inside the overlay closes alone first.
  useEffect(() => pushEscapeLayer(close), [close])

  // Scroll lock
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // Focus the panel on mount so keyboard users land inside the overlay
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  function openFullPage() {
    router.push(fullPageHref)
  }

  const section = sectionFor(fullPageHref)
  const isDetail = !section || title.trim().toLowerCase() !== section.label.toLowerCase()
  const hero = section && !isDetail ? SECTION_HERO[section.id] : undefined

  // Render to <body> so the overlay isn't trapped inside the page layout
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-6"
      onClick={close}
      role="presentation"
    >
      {/* Scrim: flat, no blur */}
      <div className="absolute inset-0 bg-[rgba(8,9,10,.92)] animate-overlay-fade-in" aria-hidden />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative flex h-full w-full flex-col border-rp-line2 bg-rp-bg animate-overlay-pop-in focus:outline-none sm:h-auto sm:max-h-[90vh] sm:w-[min(94vw,1200px)] sm:border"
      >
        {/* Bar: NN · Section (· detail title) | Open full page → · Close */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rp-line pl-[clamp(16px,2.4vw,28px)] pr-3 sm:pr-4">
          <h2 id={titleId} className="flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
            <span className="rp-eyebrow shrink-0">{section ? `${section.num} · ${section.label}` : title}</span>
            {section && isDetail && (
              <span className="truncate font-display text-[13px] uppercase tracking-[.2em] text-rp-muted">· {title}</span>
            )}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <RpButton variant="ghost" size="sm" onClick={openFullPage} arrow aria-label="Open full page">
              <span className="max-sm:hidden">Open full page</span>
              <span className="sm:hidden">Full page</span>
            </RpButton>
            <RpButton variant="ghost" size="sm" onClick={close}>
              Close
            </RpButton>
          </div>
        </div>

        {/* Body: the section page scrolls inside the panel. .rp-in-overlay
            compacts its title and hides its eyebrow, head pines and pager. */}
        <div className="rp-in-overlay min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {hero && (
            <div className="relative h-[clamp(150px,19vw,240px)] overflow-hidden bg-rp-surface" aria-hidden>
              <img
                src={hero.src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: hero.objectPosition ?? 'center 45%' }}
              />
              <span className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,11,12,.12)_0%,rgba(10,11,12,.5)_46%,#0A0B0C_100%)]" />
              {hero.provenance && (
                <span className="absolute left-[clamp(20px,3vw,40px)] top-4 max-w-[70%] truncate border border-rp-line2 bg-[rgba(10,11,12,.78)] px-2.5 py-[5px] font-display text-[10px] uppercase tracking-[.16em] text-rp-muted max-sm:hidden">
                  {hero.provenance}{hero.caption ? ` · ${hero.caption}` : ''}
                </span>
              )}
            </div>
          )}
          <div
            className={
              hero
                ? 'relative -mt-[clamp(72px,9vw,120px)] px-[clamp(20px,3vw,40px)] pb-10'
                : 'px-[clamp(20px,3vw,40px)] py-8'
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
