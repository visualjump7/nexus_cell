'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  alert:  'text-red-400 bg-red-500/[0.08] border-red-500/20',
  warn:   'text-amber-400 bg-amber-500/[0.08] border-amber-500/20',
  good:   'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/20',
  normal: 'text-gray-400 bg-white/[0.04] border-white/[0.06]',
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
      style={{ background: 'var(--nx-bg)', color: 'var(--nx-text)', fontFamily: 'var(--font-inter), Inter, sans-serif', fontFeatureSettings: '"ss01", "cv11"' }}
    >
      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between" style={{ padding: '20px 32px' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-[22px] h-[22px] rounded-md"
            style={{
              background: 'radial-gradient(circle at 30% 30%, var(--nx-teal), var(--nx-teal-dim))',
              boxShadow: '0 0 12px var(--nx-teal-glow)',
            }}
            aria-hidden
          />
          <span
            className="uppercase font-medium"
            style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--nx-text-dim)' }}
          >
            Nexus Cell
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
            <h1
              className="m-0 mb-2.5"
              style={{ fontSize: 36, fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              {heroGreeting.line1}<br />
              <span style={{ color: 'var(--nx-teal)' }}>{heroGreeting.line2}</span>
            </h1>

            {/* Live context strip — at-a-glance status pills derived from real data */}
            <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Status">
              {contextStrip.map((item, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-medium ${TONE_CLASS[item.tone]}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Ask input chip */}
          <div
            className="flex items-center"
            style={{
              gap: 10,
              padding: '14px 18px',
              borderRadius: 12,
              background: 'rgba(20,24,33,0.7)',
              border: '1px solid rgba(45,191,163,0.35)',
              boxShadow: '0 0 30px rgba(45,191,163,0.12)',
              maxWidth: 380,
              cursor: 'text',
            }}
            onClick={() => {
              const el = document.getElementById('nx-ask-input') as HTMLInputElement | null
              el?.focus()
            }}
          >
            <span
              className="rounded-full animate-nx-pulse-fast flex-shrink-0"
              style={{ width: 6, height: 6, background: 'var(--nx-teal)', boxShadow: '0 0 8px var(--nx-teal)' }}
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
              placeholder="Type or speak…"
              className="flex-1 bg-transparent outline-none"
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
                borderRadius: 5,
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
                  className="bg-white/[0.04] hover:bg-white/[0.08] rounded-full px-3 py-1.5 text-[12px] text-gray-400 hover:text-white transition-colors border border-white/[0.05]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT — typographic section list */}
        <nav className="flex flex-col justify-center" aria-label="Sections">
          <div
            className="uppercase"
            style={{
              fontSize: 11,
              color: 'var(--nx-text-faint)',
              letterSpacing: '0.2em',
              marginBottom: 24,
            }}
          >
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
                      padding: '14px 0',
                      borderBottom: '1px solid var(--nx-border)',
                      borderTop: isFirst ? '1px solid var(--nx-border)' : undefined,
                      cursor: 'pointer',
                      transition: 'transform .2s, background .2s, border-color .2s',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--nx-text-faint)',
                        fontVariantNumeric: 'tabular-nums',
                        width: 24,
                      }}
                    >
                      {num}
                    </span>
                    <span
                      className="flex-shrink-0 rounded-full"
                      style={{ width: 8, height: 8, background: section.dotColor }}
                      aria-hidden
                    />
                    <span
                      className="nx-section-label flex-1"
                      style={{
                        fontSize: 22,
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
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
                          borderRadius: 99,
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
        :global(.nx-section-row:hover) {
          background: rgba(45, 191, 163, 0.04);
          border-bottom-color: rgba(45, 191, 163, 0.3) !important;
        }
        :global(.nx-section-row:hover .nx-section-label) {
          color: var(--nx-teal) !important;
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
