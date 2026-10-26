'use client'

import { useEffect, useState } from 'react'
import AIDrawer from '@/components/AIDrawer'
import NexusCharacter, { type AttentionTarget } from '@/components/NexusCharacter'
import NexusEnergyOrb from '@/components/NexusEnergyOrb'
import { SECTIONS, sectionEyebrow, type SectionMetrics } from '@/lib/sections'
import { SECTION_HERO } from '@/lib/project-imagery'
import { BRAND } from '@/lib/brand'
import {
  RpPage, RpPageHeader, RpTag, RpButton, RpFilm, RpCard,
  fmtDate, dot, type RpTone,
} from '@/components/rp'
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

// Context strip tones → the kit's status tones (no stock red/amber).
const TONE: Record<ContextItem['tone'], RpTone> = {
  alert: 'alert',
  warn: 'gold',
  good: 'green',
  normal: 'neutral',
}

// Glance the character downward toward the status tags when anything in the
// strip is alert/warn (overdue bills, urgent approvals, imminent travel).
// Otherwise no contextual cue — just idle blink + glance.
function attentionFromContext(items: ContextItem[]): AttentionTarget {
  return items.some(i => i.tone === 'alert' || i.tone === 'warn') ? 'down' : null
}

const HERO = SECTION_HERO.overview

/**
 * "/" for the owner's rep, CFO, admin and viewer: the concept's Introduction
 * panel inside the shell. Eyebrow, the one sentence that matters today, the
 * ask bar into Nexus, the aerial of the whole club, then the section index as
 * a ruled grid of numbered cards carrying their live figures.
 */
export default function CommandLanding({ metrics, heroGreeting, contextStrip, openingMessage, dynamicSuggestions, heroStyle = 'orb' }: Props) {
  const [aiOpen, setAiOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const [askInput, setAskInput] = useState('')
  const [isMac, setIsMac] = useState(true)
  // Rendered after mount so the date is the viewer's local day (no hydration mismatch).
  const [today, setToday] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform))
    }
    setToday(fmtDate(new Date(), 'weekday'))
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
    <RpPage>
      <RpPageHeader
        size="hero"
        eyebrow={sectionEyebrow('overview')}
        tags={today ? <RpTag>{today}</RpTag> : undefined}
        title={heroGreeting.line2}
        line={`${heroGreeting.line1} Here is what needs you.`}
        spec={
          contextStrip.length > 0 ? (
            <span className="flex flex-wrap gap-2 pt-1" aria-label="Status">
              {contextStrip.map((item, i) => (
                <RpTag key={i} tone={TONE[item.tone]} square={item.tone === 'alert'}>
                  {item.label}
                </RpTag>
              ))}
            </span>
          ) : undefined
        }
      />

      {/* Ask the team: the orb (or character) beside a gate-style input */}
      <section aria-label={BRAND.askLabel} className="flex max-w-[780px] flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-center gap-4">
            <HeroMark
              style={heroStyle}
              onOpen={openAsk}
              attention={attentionFromContext(contextStrip)}
            />
            <span className="rp-eyebrow--muted sm:hidden">{BRAND.askLabel}</span>
          </div>
          <form
            className="flex min-w-0 flex-1"
            onSubmit={e => {
              e.preventDefault()
              submitAsk()
            }}
          >
            <div className="relative min-w-0 flex-1">
              <input
                id="nx-ask-input"
                type="text"
                value={askInput}
                onChange={e => setAskInput(e.target.value)}
                placeholder="Ask the team about the build…"
                aria-label={BRAND.askLabel}
                autoComplete="off"
                className="rp-input min-h-12 border-r-0 text-base tracking-[.02em] placeholder:font-display placeholder:text-xs placeholder:uppercase placeholder:tracking-[.16em] sm:pr-20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block">
                <RpTag className="px-2 py-1">{isMac ? '⌘K' : 'Ctrl K'}</RpTag>
              </span>
            </div>
            <RpButton type="submit" className="min-h-12 shrink-0">
              Ask
            </RpButton>
          </form>
        </div>

        {/* Live suggestions from real state (questions in sentence case; Oswald stays for labels) */}
        {dynamicSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:pl-[76px]">
            {dynamicSuggestions.map(s => (
              <RpButton
                key={s}
                variant="ghost"
                size="sm"
                className="font-sans text-[13px] normal-case tracking-normal whitespace-normal text-left"
                onClick={() => { setPendingMessage(s); setAiOpen(true) }}
              >
                {s}
              </RpButton>
            ))}
          </div>
        )}
      </section>

      {/* The whole club, from the air */}
      <RpFilm
        src={HERO.src}
        alt={HERO.alt ?? 'Aerial render of the whole Roaring Pines property'}
        line={`${BRAND.site.acres} acres in the pines`}
        meta={dot('State Road 100', 'Palatka, Florida', 'under construction')}
        href="/site-map"
        objectPosition="center 46%"
        num={1}
        caption="The whole club in the pines · circuit, paddock and lakes"
      />

      {/* Section index: the concept's ruled card grid, two full rows of five at
          desktop; below 640px a two-column numbered grid like the concept's
          mobile nav (the descriptive line drops out, the hint and count stay). */}
      <nav aria-label="Sections">
        <ul
          className={
            'rp-ruled m-0 list-none p-0 grid-cols-2 ' +
            'sm:[grid-template-columns:repeat(auto-fit,minmax(max(min(100%,200px),calc((100%_-_4px)_/_5)),1fr))] ' +
            'max-sm:[&>li:last-child:nth-child(odd)]:col-span-full ' +
            'max-sm:[&_.rp-card]:gap-2 max-sm:[&_.rp-card]:p-4 max-sm:[&_.rp-card-title]:text-base max-sm:[&_.rp-card>p]:hidden'
          }
        >
          {SECTIONS.map(section => {
            const m = metrics[section.id] || {}
            const hint = m.hint ?? section.defaultHint ?? ''
            const badge = m.badge && m.badge > 0 ? m.badge : undefined
            return (
              <li key={section.id} className="flex">
                <RpCard
                  className="w-full"
                  num={section.num}
                  title={section.label}
                  line={section.line}
                  href={section.href}
                  aside={
                    badge !== undefined ? (
                      <span
                        className="font-display text-[15px] leading-none tracking-[.04em] text-rp-gold tabular-nums"
                        aria-label={`${badge} open`}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : section.flag ? (
                      <span className="rp-nav-flag">{section.flag}</span>
                    ) : undefined
                  }
                >
                  {hint && (
                    <span className="mt-auto pt-2 font-display text-xs uppercase leading-tight tracking-[.14em] text-rp-text">
                      {hint}
                    </span>
                  )}
                </RpCard>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* AI conversation overlay */}
      <AIDrawer
        isOpen={aiOpen}
        onClose={() => { setAiOpen(false); setPendingMessage('') }}
        initialMessage={pendingMessage}
        onInitialMessageConsumed={() => setPendingMessage('')}
        openingMessage={openingMessage}
      />
    </RpPage>
  )
}

// The orb / character at 56px, aligned to the input. Both components reserve
// a halo margin (55% of size) around the core; the wrapper pulls that margin
// back so the core sits in a 56px box, and only the core takes clicks so the
// glow never steals clicks from the input beside it.
const MARK = 56
function HeroMark({ style, onOpen, attention }: { style: 'orb' | 'character'; onOpen: () => void; attention: AttentionTarget }) {
  const halo = Math.round(MARK * 0.55)
  const domeTop = halo - Math.round(MARK * 0.05)
  const domeH = Math.round(MARK * 0.55)
  const offset = style === 'character'
    ? { left: -halo, top: Math.round((MARK - domeH) / 2) - domeTop }
    : { left: -halo, top: -halo }
  return (
    <div className="relative h-14 w-14 shrink-0 [&>div>button]:pointer-events-none [&_[data-nx-core]]:pointer-events-auto">
      <div className="absolute" style={offset}>
        {style === 'character' ? (
          <NexusCharacter size={MARK} onClick={onOpen} attentionTarget={attention} />
        ) : (
          <NexusEnergyOrb size={MARK} onClick={onOpen} />
        )}
      </div>
    </div>
  )
}
