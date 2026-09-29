'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'

interface Props {
  // Section title shown in the overlay header (e.g. "Travel")
  title: string
  // Standalone route the "Open full page" button navigates to
  fullPageHref: string
  children: React.ReactNode
}

// SectionOverlay is the chrome around any section's content when rendered as
// an intercepted modal on top of the command landing.
//
// Closing strategies:
//   - ESC, click outside, or click the X → router.back() to fall off the
//     intercepting route and return to "/"
//   - "Open full page" → router.push(fullPageHref) to leave overlay context
//     and load the standalone page with full chrome
export default function SectionOverlay({ title, fullPageHref, children }: Props) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    router.back()
  }, [router])

  // ESC + scroll lock
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [close])

  // Focus the panel on mount so keyboard users land inside the overlay
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  function openFullPage() {
    router.push(fullPageHref)
  }

  // Render to <body> so the overlay isn't trapped inside the landing's grid layout
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={close}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(8,9,10,.92)] backdrop-blur-sm animate-overlay-fade-in"
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:w-[min(92vw,1100px)] sm:max-w-[1100px] sm:rounded-sm bg-nexus shadow-2xl shadow-black/40 border border-[#26292C] flex flex-col h-full sm:max-h-[90vh] animate-overlay-pop-in focus:outline-none"
        style={{ background: 'var(--rp-panel, #0E0F11)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#1F1F1F] shrink-0">
          <h2 className="rp-eyebrow">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={openFullPage}
              className="rp-btn-ghost !min-h-[30px] !px-3 !py-1 !text-[10px]"
              title="Open full page"
            >
              Open full page
            </button>
            <button
              onClick={close}
              aria-label="Close"
              className="text-[#9AA0A4] hover:text-white w-8 h-8 rounded-sm hover:bg-[#141618] transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — section content scrolls inside the panel */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
