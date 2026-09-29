'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import AIDrawer from '@/components/AIDrawer'
import NexusCharacter, { type AttentionTarget } from '@/components/NexusCharacter'
import NexusEnergyOrb from '@/components/NexusEnergyOrb'
import { SECTIONS, type SectionMetrics } from '@/lib/sections'
import type { ContextItem } from '@/lib/ai-context'

interface Props {
  // Per-section live data, keyed by SectionDef.id. Missing keys fall back to
  // the section's defaultHint. Pass {} to render the static design.
  metrics: Record<string, SectionMetrics>
  // Jarvis-mode personalization, all server-derived from real data.
  heroGreeting: { line1: string; line2: string }
  contextStrip: ContextItem[]
  openingMessage: string
  dynamicSuggestions: string[]
  // Hero element style — user's preference from /settings → Appearance.
  // 'orb' = animated energy orb, 'character' = half-dome with eyes.
  heroStyle?: 'orb' | 'character'
}

const TONE_CLASS: Record<ContextItem['tone'], string> = {
  alert:  'text-red-400 border-red-500/40',
  warn:   'text-amber-400 border-amber-500/40',
  good:   'text-[#A4CC5C] border-[#A4CC5C]/40',
  normal: 'text-[#9AA0A4] border-[#26292C]',
}

// Glance the character downward toward the status pills when anything in the
// strip is alert/warn (overdue bills, urgent approvals, imminent travel).
// Otherwise no contextual cue — just idle blink + glance.
function attentionFromContext(items: ContextItem[]): AttentionTarget {
  return items.some(i => i.tone === 'alert' || i.tone === 'warn') ? 'down' : null
}

export default function CommandLanding({ metrics, heroGreeting, contextStrip, openingMessage, dynamicSuggestions, heroStyle = 'orb' }: Props) {
  const [aiOpen, setAiOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const [askInput, setAskInput] = useState('')
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform))
    }
  }, [])

  // ⌘K / Ctrl+K opens the AI conversation overlay from anywhere on the page
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAiOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMac])

  function openAsk() {
    setAiOpen(true)
  }

  function submitAsk() {
    const text = askInput.trim()
    if (!text) {
      openAsk()
      return
    }
    setPendingMessage(text)
    setAskInput('')
    setAiOpen(true)
  }

  return (
    <main
      className="relative w-full min-h-screen overflow-hidden"
      style={{ background: 'var(--nx-bg)', color: 'var(--nx-text)', fontFamily: 'var(--font-body), system-ui, sans-serif', isolation: 'isolate' }}
    >
      {/* Quiet pine silhouettes along the bottom edge */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--hero" />

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between" style={{ padding: '20px 32px' }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.badge} alt={BRAND.fullName} className="h-[38px] w-auto" />
          <span className="flex flex-col" style={{ lineHeight: 1.15 }}>
            <span
              className="uppercase font-display"
              style={{ fontSize: 15, letterSpacing: '0.12em', color: 'var(--rp-text)' }}
            >
              Roaring Pines
            </span>
            <span
              className="uppercase"
              style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--rp-muted)' }}
            >
              Motor Club
            </span>
          </span>
        </div>
      </header>

      {/* Stage */}
      <div className="nx-stage absolute inset-0 grid">
        {/* LEFT — AI hero */}
        <section className="flex flex-col justify-center" style={{ gap: 20 }} aria-label="Ask Nexus">
          {heroStyle === 'character' ? (
            <NexusCharacter
              size={150}
              onClick={openAsk}
              // Glance toward the status line below when something needs attention.
              // Drives the eye-down behavior the user spec'd ("if there's a late
              // bill, eyes go down and look below him at the title").
              attentionTarget={attentionFromContext(contextStrip)}
            />
          ) : (
            <NexusEnergyOrb size={150} onClick={openAsk} />
          )}

          <div>
            <span className="rp-eyebrow--muted block mb-3">{heroGreeting.line1}</span>
            <h1 className="rp-title rp-title--hero m-0" style={{ color: '#F5F5F5' }}>
              {heroGreeting.line2}
            </h1>

            {/* Live context strip — at-a-glance status tags derived from real data */}
            <div className="flex flex-wrap gap-1.5 mt-4" aria-label="Status">
              {contextStrip.map((item, i) => (
                <span
                  key={i}
                  className={`rp-tag inline-flex items-center ${TONE_CLASS[item.tone]}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Ask input chip */}
          <div
            className="nx-ask flex items-center"
            style={{
              gap: 10,
              padding: '14px 18px',
              borderRadius: 2,
              background: '#0E0F11',
              border: '1px solid #26292C',
              maxWidth: 380,
              cursor: 'text',
              transition: 'border-color .2s',
            }}
            onClick={() => {
              const el = document.getElementById('nx-ask-input') as HTMLInputElement | null
              el?.focus()
            }}
          >
            <span
              className="animate-nx-pulse-fast flex-shrink-0"
              style={{ width: 6, height: 6, background: 'var(--rp-accent)' }}
              aria-hidden
            />
            <input
              id="nx-ask-input"
              type="text"
              value={askInput}
              onChange={e => setAskInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitAsk()
                }
              }}
              placeholder="Ask Nexus about the build…"
              className="flex-1 bg-transparent outline-none placeholder-[#6E7578]"
              style={{ fontSize: 14, color: 'var(--nx-text)' }}
              aria-label="Ask Nexus"
            />
            <kbd
              className="font-inherit"
              style={{
                fontSize: 11,
                color: 'var(--nx-text-faint)',
                padding: '3px 7px',
                border: '1px solid var(--nx-border)',
                borderRadius: 0,
              }}
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </div>

          {/* Dynamic suggestion chips — sourced from real state */}
          {dynamicSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ maxWidth: 380 }}>
              {dynamicSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setPendingMessage(s); setAiOpen(true) }}
                  className="rp-btn-ghost"
                  style={{ fontSize: 10, minHeight: 30, padding: '6px 11px' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Construction progress strip — desktop only */}
          <figure className="hidden lg:block m-0" style={{ maxWidth: 380 }}>
            <div className="rp-frame" style={{ aspectRatio: '16 / 7' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/site/site-full-hero.jpg" alt="Aerial view of the Roaring Pines property" className="w-full h-full object-cover" />
            </div>
            <figcaption className="rp-caption mt-2">
              <span className="rp-num">01</span> The whole property, aerial
            </figcaption>
          </figure>
        </section>

        {/* RIGHT — typographic section list */}
        <nav className="flex flex-col justify-center" aria-label="Sections">
          <div className="rp-eyebrow" style={{ marginBottom: 24 }}>
            Sections
          </div>

          <ul className="list-none m-0 p-0">
            {SECTIONS.map((section, i) => {
              const m = metrics[section.id] || {}
              const hint = m.hint ?? section.defaultHint ?? ''
              const badge = m.badge && m.badge > 0 ? m.badge : undefined
              const num = String(i + 1).padStart(2, '0')
              const isFirst = i === 0

              return (
                <li key={section.id} className="m-0 p-0">
                  <Link
                    href={section.href}
                    className="nx-section-row flex items-baseline relative"
                    style={{
                      gap: 18,
                      padding: '14px 0 14px 14px',
                      borderBottom: '1px solid var(--nx-border)',
                      borderTop: isFirst ? '1px solid var(--nx-border)' : undefined,
                      borderLeft: '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'background .2s, border-color .2s',
                      textDecoration: 'none',
                    }}
                  >
                    <span className="rp-num nx-section-num" style={{ width: 24, transition: 'color .2s' }}>
                      {num}
                    </span>
                    <span
                      className="nx-section-label flex-1 font-display uppercase"
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        color: 'var(--nx-text)',
                        transition: 'color .2s',
                      }}
                    >
                      {section.label}
                    </span>
                    {hint && (
                      <span style={{ fontSize: 12, color: 'var(--nx-text-faint)' }}>{hint}</span>
                    )}
                    {badge !== undefined && (
                      <span
                        className="text-white text-center"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#dc2626',
                          padding: '2px 8px',
                          borderRadius: 2,
                          minWidth: 22,
                        }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Layout + hover styles (scoped) */}
      <style jsx>{`
        :global(.nx-stage) {
          padding: 120px 100px 80px;
          grid-template-columns: 1fr 1.1fr;
          gap: 80px;
        }
        @media (max-width: 1023px) {
          :global(.nx-stage) {
            padding: 80px 32px 60px;
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }
        :global(.nx-ask:focus-within) {
          border-color: #CDA14B !important;
        }
        :global(.nx-section-row:hover) {
          background: #0E0F11;
          border-left-color: #CDA14B !important;
        }
        :global(.nx-section-row:hover .nx-section-num) {
          color: #CDA14B !important;
        }
      `}</style>

      {/* AI conversation overlay (existing) */}
      <AIDrawer
        isOpen={aiOpen}
        onClose={() => { setAiOpen(false); setPendingMessage('') }}
        initialMessage={pendingMessage}
        onInitialMessageConsumed={() => setPendingMessage('')}
        openingMessage={openingMessage}
      />
    </main>
  )
}
