'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { pushEscapeLayer } from './escape'

export interface RpModalProps {
  open: boolean
  onClose: () => void
  /** Gold eyebrow above the title, e.g. 'New project'. */
  eyebrow?: string
  title?: React.ReactNode
  children: React.ReactNode
  /** Right-aligned button row under a rule. */
  footer?: React.ReactNode
  /** sm 440 · md 560 (default) · lg 720 · xl 960. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Click on the scrim closes (default true). */
  closeOnScrim?: boolean
  /** id of an external title element, when `title` is not used. */
  labelledBy?: string
  className?: string
}

const WIDTH: Record<NonNullable<RpModalProps['size']>, string> = {
  sm: 'max-w-[440px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
}

const FIELDS = 'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"]'
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Square modal: scrim .85 (no blur), #0A0B0C dialog with a #26292C border,
 * header (eyebrow, Oswald title, Close), scrolling body, footer row.
 * Esc closes, body scroll locks, focus goes to the first field in the body
 * (else its first button, else Close) and returns to the opener on close. Portal to body, z 60.
 */
export function RpModal({ open, onClose, eyebrow, title, children, footer, size = 'md', closeOnScrim = true, labelledBy, className }: RpModalProps) {
  const [mounted, setMounted] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const autoId = useId()
  const titleId = labelledBy ?? `${autoId}-title`

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the first field in the body, else Close.
    const t = window.setTimeout(() => {
      const body = bodyRef.current
      const first = body?.querySelector<HTMLElement>(FIELDS) ?? body?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? closeRef.current)?.focus()
    }, 0)
    const pop = pushEscapeLayer(() => onCloseRef.current())
    return () => {
      window.clearTimeout(t)
      pop()
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[rgba(8,9,10,.85)] p-4 animate-overlay-fade-in sm:items-center sm:p-6',
        // Phones: md and larger dialogs (forms) take the whole screen, so the page never shows beneath them.
        size !== 'sm' && 'max-sm:p-0',
      )}
      onMouseDown={e => { if (closeOnScrim && e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title || labelledBy ? titleId : undefined}
        className={cn(
          'flex max-h-[calc(100vh-32px)] w-full flex-col border border-rp-line2 bg-rp-bg text-rp-text animate-overlay-pop-in sm:max-h-[calc(100vh-48px)]',
          size !== 'sm' && 'max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:border-0',
          WIDTH[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-rp-line px-6 pb-4 pt-6">
          <div className="flex min-w-0 flex-col gap-2">
            {eyebrow && <span className="rp-eyebrow">{eyebrow}</span>}
            {title && (
              <h2 id={titleId} className="font-display text-2xl font-medium uppercase leading-[1.05] tracking-[.01em] text-rp-text">
                {title}
              </h2>
            )}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="rp-btn-ghost shrink-0">
            Close
          </button>
        </header>
        <div ref={bodyRef} className="flex flex-col gap-5 overflow-y-auto px-6 py-5 max-sm:flex-1">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-rp-line px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
