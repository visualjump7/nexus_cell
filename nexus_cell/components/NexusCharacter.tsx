'use client'

import { useEffect, useRef, useState } from 'react'

// Nexus character — animated half-circle dome with expressive eyes.
// Replaces the static hero orb on the command landing. Idle behaviors
// (blink, glance) run on a randomized timer; context-driven behavior
// (look-down toward overdue items) is opt-in via `attentionTarget`.
//
// Eye system:
//   default      → capsule (rounded rect)
//   blink        → capsule scaled to 1px height for ~100ms
//   happy        → upward smile arc on both eyes
//   wink         → smile arc on left, capsule on right
//   thinking     → eyes drift up-right and back rhythmically
//   excited      → star eyes
//   affectionate → heart eyes (Easter egg — fires on warm AI responses)

export type NexusMood =
  | 'default'
  | 'happy'
  | 'wink'
  | 'thinking'
  | 'excited'
  | 'affectionate'

export type AttentionTarget = 'down' | 'up' | 'left' | 'right' | null

interface Props {
  size?: number
  mood?: NexusMood
  // Set to 'down' (etc.) to make the character periodically glance that way.
  // Used to draw the eye to the status line below when something needs attention.
  attentionTarget?: AttentionTarget
  // Click handler — preserves the existing "click orb to open AI" behavior.
  onClick?: () => void
  // Optional tooltip / aria label
  label?: string
}

const ATTENTION_OFFSETS: Record<Exclude<AttentionTarget, null>, { x: number; y: number }> = {
  down:  { x: 0, y: 4 },
  up:    { x: 0, y: -3 },
  left:  { x: -3, y: 0 },
  right: { x: 3, y: 0 },
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function NexusCharacter({
  size = 120,
  mood = 'default',
  attentionTarget = null,
  onClick,
  label = 'Ask Nexus',
}: Props) {
  // Eye offset — driven by glance + attentionTarget loops
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  // Transient blink state — capsule eyes scale to 1px height
  const [blinking, setBlinking] = useState(false)
  // Effective mood — Easter eggs (e.g. heart eyes from positive AI response)
  // can momentarily override the prop-driven mood
  const [effectiveMood, setEffectiveMood] = useState<NexusMood>(mood)
  // Refs so the cleanup-time-saved timeouts don't leak
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const glanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attentionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const easterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref to the outer button so we can measure its position for cursor proximity.
  const buttonRef = useRef<HTMLButtonElement>(null)
  // Ref mirror of "is the cursor close enough that we're tracking?" — used by
  // the idle/attention loops so they can yield to cursor tracking without
  // re-creating the timers every time proximity flips.
  const trackingRef = useRef(false)

  useEffect(() => { setEffectiveMood(mood) }, [mood])

  // ── Easter egg: listen for "nexus:positive" custom event from AIDrawer ──
  useEffect(() => {
    function onPositive() {
      if (prefersReducedMotion()) return
      setEffectiveMood('affectionate')
      if (easterTimerRef.current) clearTimeout(easterTimerRef.current)
      easterTimerRef.current = setTimeout(() => {
        setEffectiveMood(mood)
      }, 2000)
    }
    window.addEventListener('nexus:positive', onPositive)
    return () => {
      window.removeEventListener('nexus:positive', onPositive)
      if (easterTimerRef.current) clearTimeout(easterTimerRef.current)
    }
  }, [mood])

  // ── Idle blink loop ──
  useEffect(() => {
    if (prefersReducedMotion()) return
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 4000
      blinkTimerRef.current = setTimeout(() => {
        setBlinking(true)
        setTimeout(() => {
          setBlinking(false)
          scheduleBlink()
        }, 110)
      }, delay)
    }
    scheduleBlink()
    return () => { if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current) }
  }, [])

  // ── Idle glance loop ──
  useEffect(() => {
    if (prefersReducedMotion()) return
    const directions = [
      { x: -3, y: -1 }, { x: 3, y: -1 },
      { x: -3, y: 2 },  { x: 3, y: 2 },
      { x: 0, y: -2 },
      { x: -2, y: 0 },  { x: 2, y: 0 },
    ]
    function scheduleGlance() {
      const delay = 12000 + Math.random() * 18000
      glanceTimerRef.current = setTimeout(() => {
        // Yield to cursor tracking — if the user is hovering near the
        // character, don't fight their gaze with random idle glances.
        if (trackingRef.current) {
          scheduleGlance()
          return
        }
        const target = directions[Math.floor(Math.random() * directions.length)]
        setEyeOffset(target)
        setTimeout(() => {
          if (!trackingRef.current) setEyeOffset({ x: 0, y: 0 })
          scheduleGlance()
        }, 700)
      }, delay)
    }
    scheduleGlance()
    return () => { if (glanceTimerRef.current) clearTimeout(glanceTimerRef.current) }
  }, [])

  // ── Context-driven attention (look-down for overdue items, etc.) ──
  useEffect(() => {
    if (!attentionTarget) return
    if (prefersReducedMotion()) return
    const offset = ATTENTION_OFFSETS[attentionTarget]
    function fire() {
      // Cursor tracking takes precedence — skip the cue while user is near.
      if (trackingRef.current) return
      setEyeOffset(offset)
      setTimeout(() => {
        if (!trackingRef.current) setEyeOffset({ x: 0, y: 0 })
      }, 900)
    }
    attentionTimerRef.current = setInterval(fire, 11000)
    // Run once shortly after mount so the cue happens early
    const initial = setTimeout(fire, 2500)
    return () => {
      if (attentionTimerRef.current) clearInterval(attentionTimerRef.current)
      clearTimeout(initial)
    }
  }, [attentionTarget])

  // ── Cursor proximity tracking ──
  // The eyes always point AT the cursor when within range — the gaze
  // direction is the unit vector toward the cursor, scaled by a magnitude
  // that's full inside INNER_RADIUS (the "lock zone" — when the cursor is
  // over or very near the dome) and tapers linearly to zero by OUTER_RADIUS.
  // Throttled with requestAnimationFrame so we don't re-render on every pixel.
  useEffect(() => {
    if (prefersReducedMotion()) return

    const OUTER_RADIUS = 400 // beyond this, idle behavior wins
    const INNER_RADIUS = 100 // within this (cursor over the dome), full lock
    const MAX_EYE_OFFSET = 8 // viewBox units — max gaze travel from neutral

    let rafId: number | null = null
    let pending: { x: number; y: number } | null = null

    function process(x: number, y: number) {
      const el = buttonRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Aim for the eye line of the dome, not the geometric center of the
      // bounding box — feels more natural than the eyes drifting low.
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height * 0.42
      const dx = x - cx
      const dy = y - cy
      const dist = Math.hypot(dx, dy)

      if (dist > OUTER_RADIUS) {
        if (trackingRef.current) {
          trackingRef.current = false
          setEyeOffset({ x: 0, y: 0 })
        }
        return
      }

      trackingRef.current = true

      // Magnitude: full lock within INNER_RADIUS, linear falloff to OUTER_RADIUS.
      const magnitude = dist <= INNER_RADIUS
        ? 1
        : 1 - (dist - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)

      if (dist < 0.5) {
        // Cursor essentially on the eye line — eyes neutral (looking forward).
        setEyeOffset({ x: 0, y: 0 })
      } else {
        // Direction vector to cursor, scaled to MAX_EYE_OFFSET * magnitude.
        // This is what makes the eyes "look at" the cursor instead of just
        // tilting toward it: the offset always lies along the line from the
        // dome's eye line to the cursor.
        const ux = dx / dist
        const uy = dy / dist
        setEyeOffset({
          x: ux * MAX_EYE_OFFSET * magnitude,
          y: uy * MAX_EYE_OFFSET * magnitude,
        })
      }
    }

    function onMove(e: MouseEvent) {
      pending = { x: e.clientX, y: e.clientY }
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (pending) {
          process(pending.x, pending.y)
          pending = null
        }
      })
    }

    function onLeaveDoc() {
      if (trackingRef.current) {
        trackingRef.current = false
        setEyeOffset({ x: 0, y: 0 })
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeaveDoc)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeaveDoc)
      if (rafId !== null) cancelAnimationFrame(rafId)
      trackingRef.current = false
    }
  }, [])

  // ── Thinking — slow rhythmic up-right glance loop ──
  useEffect(() => {
    if (effectiveMood !== 'thinking') return
    if (prefersReducedMotion()) return
    let cancelled = false
    let cycleTimeout: ReturnType<typeof setTimeout>
    function cycle() {
      if (cancelled) return
      setEyeOffset({ x: 2, y: -2 })
      cycleTimeout = setTimeout(() => {
        if (cancelled) return
        setEyeOffset({ x: 0, y: 0 })
        cycleTimeout = setTimeout(cycle, 800)
      }, 800)
    }
    cycle()
    return () => {
      cancelled = true
      clearTimeout(cycleTimeout)
      setEyeOffset({ x: 0, y: 0 })
    }
  }, [effectiveMood])

  // ── Geometry ──
  // Container reserves halo padding above and to the sides so the outer glow
  // can bleed past the dome. Below the dome, since everything is hard-masked
  // at the baseline, the container ends right at the dome bottom + a tiny
  // buffer — no dead space below the visible content.
  const haloPad = Math.round(size * 0.55)
  const totalW = size + haloPad * 2
  const domeOriginX = haloPad
  const domeOriginY = haloPad - Math.round(size * 0.05)
  // Dome is masked at 55% so its visible bottom sits at domeOriginY + size*0.55.
  // Add a 5% buffer for any tiny mask overshoot.
  const totalH = domeOriginY + Math.round(size * 0.55) + Math.round(size * 0.05)
  // SVG eye area positioned in the upper third of the dome
  const eyeAreaTop = domeOriginY + Math.round(size * 0.22)
  const eyeAreaH = Math.round(size * 0.32)

  // Hard cutoff at 55% from the top — clean flat baseline (true half-circle
  // showing slightly more than half so the dome reads as a sitting form, not
  // a bisected one). Matched percentages create a step instead of a ramp.
  // The outer halos sit behind the dome and bleed past this baseline, which
  // is what gives the reference its "glow extends below the line" look.
  const domeMask = 'linear-gradient(to bottom, black 55%, transparent 55%)'

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative cursor-pointer focus:outline-none flex items-end justify-center"
      style={{
        width: totalW,
        height: totalH,
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {/* Outer halo — large teal blur that bleeds beyond the dome.
          Masked at the same baseline as everything else so no soft arc
          appears below — character is strictly top-half. The dome baseline
          sits at (size*0.5 + size*0.55) / (size*2) = 52.5% of this halo's
          height because the halo extends size*0.5 above the dome top. */}
      <span
        aria-hidden
        className="absolute pointer-events-none animate-nx-pulse-slow"
        style={{
          left: domeOriginX - size * 0.5,
          top: domeOriginY - size * 0.5,
          width: size * 2,
          height: size * 2,
          background:
            'radial-gradient(circle at 50% 50%, rgba(94,234,212,0.45) 0%, rgba(45,191,163,0.25) 25%, transparent 55%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
          maskImage: 'linear-gradient(to bottom, black 52.5%, transparent 52.5%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 52.5%, transparent 52.5%)',
        }}
      />

      {/* Secondary inner halo — tighter, brighter rim of light hugging the
          dome. MUST be masked at the same baseline as the dome itself,
          otherwise the bottom arc of this ring shows below the dome and
          visually completes it into a full circle. */}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: domeOriginX - size * 0.18,
          top: domeOriginY - size * 0.18,
          width: size * 1.36,
          height: size * 1.36,
          background:
            'radial-gradient(circle at 50% 50%, transparent 35%, rgba(94,234,212,0.5) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(6px)',
          // Cut at the same vertical line as the dome. The halo extends
          // size * 0.18 above the dome top, so the dome baseline sits at
          // (size*0.18 + size*0.55) / (size*1.36) ≈ 53.7% of the halo height.
          maskImage: 'linear-gradient(to bottom, black 53.7%, transparent 53.7%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 53.7%, transparent 53.7%)',
        }}
      />

      {/* Dome — full circle with a CSS mask that hard-cuts at the equator
          (~55% down) so the bottom is a clean flat baseline. The inset rim
          shadow follows the mask, so the rim only renders on the visible
          upper portion — no rectangular boundary, no soft fade. */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: domeOriginX,
          top: domeOriginY,
          width: size,
          height: size,
          background: [
            // Subtle mint highlight on upper-left for dimensionality
            'radial-gradient(circle at 35% 25%, rgba(167,243,208,0.14) 0%, transparent 30%)',
            // Darker interior with teal only at the rim — most of the dome
            // is near-black so the bright teal ring reads strongly. Stops
            // are pushed outward (90% before the rim) compared to before.
            'radial-gradient(circle at 50% 55%, #010403 0%, #02100c 55%, #062a22 82%, #0d4438 92%, #2dbfa3 100%)',
          ].join(', '),
          boxShadow: [
            // Inset rim glow — narrow bright ring
            'inset 0 0 12px rgba(167,243,208,0.7)',
            'inset 0 0 30px rgba(94,234,212,0.55)',
            // Immediate outer rim
            '0 0 16px rgba(94,234,212,0.65)',
            '0 0 40px rgba(45,191,163,0.55)',
            '0 0 80px rgba(45,191,163,0.35)',
          ].join(', '),
          maskImage: domeMask,
          WebkitMaskImage: domeMask,
        }}
      />

      {/* Eyes layer — overlaid on top of the dome */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: domeOriginX,
          top: eyeAreaTop,
          width: size,
          height: eyeAreaH,
        }}
        viewBox="0 0 100 30"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="nx-eye-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.8" result="softGlow" />
            <feFlood floodColor="#a7f3d0" floodOpacity="0.95" result="glowColor" />
            <feComposite in="glowColor" in2="softGlow" operator="in" result="coloredGlow" />
            <feMerge>
              <feMergeNode in="coloredGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Eye
          cx={42}
          cy={15}
          offset={eyeOffset}
          blinking={blinking}
          mood={effectiveMood}
          side="left"
        />
        <Eye
          cx={58}
          cy={15}
          offset={eyeOffset}
          blinking={blinking}
          mood={effectiveMood}
          side="right"
        />
      </svg>
    </button>
  )
}

// ── Eye renderer ─────────────────────────────────────────────────────────
// All eye shapes share the same color / glow + eased transitions so morphing
// between expressions reads smoothly.

interface EyeProps {
  cx: number
  cy: number
  offset: { x: number; y: number }
  blinking: boolean
  mood: NexusMood
  side: 'left' | 'right'
}

function Eye({ cx, cy, offset, blinking, mood, side }: EyeProps) {
  const tx = cx + offset.x
  const ty = cy + offset.y
  const transition = 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)'

  // Wink: left smiles, right stays default
  const isSmiling =
    mood === 'happy' || (mood === 'wink' && side === 'left')

  if (mood === 'affectionate') {
    return <Heart tx={tx} ty={ty} transition={transition} />
  }

  if (mood === 'excited') {
    return <Star tx={tx} ty={ty} transition={transition} />
  }

  if (isSmiling) {
    return <SmileArc tx={tx} ty={ty} transition={transition} />
  }

  // Default capsule (used for default + thinking + non-winking eye).
  // Sized to match the reference: bigger and more prominent than the
  // earlier dot-style eyes.
  const eyeWidth = 8
  const eyeHeight = blinking ? 1 : 18
  return (
    <rect
      x={tx - eyeWidth / 2}
      y={ty - eyeHeight / 2}
      width={eyeWidth}
      height={eyeHeight}
      rx={eyeWidth / 2}
      ry={eyeWidth / 2}
      fill="white"
      filter="url(#nx-eye-glow)"
      style={{ transition }}
    />
  )
}

function SmileArc({ tx, ty, transition }: { tx: number; ty: number; transition: string }) {
  const r = 4
  return (
    <path
      d={`M ${tx - r} ${ty + 1} Q ${tx} ${ty - 4} ${tx + r} ${ty + 1}`}
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      filter="url(#nx-eye-glow)"
      style={{ transition }}
    />
  )
}

function Heart({ tx, ty, transition }: { tx: number; ty: number; transition: string }) {
  // Compact heart path centered on (tx, ty)
  const s = 3
  const d = `
    M ${tx} ${ty + s}
    C ${tx - s * 1.5} ${ty - s * 0.4}, ${tx - s * 1.6} ${ty - s * 1.6}, ${tx} ${ty - s * 0.6}
    C ${tx + s * 1.6} ${ty - s * 1.6}, ${tx + s * 1.5} ${ty - s * 0.4}, ${tx} ${ty + s} Z
  `.trim()
  return (
    <path
      d={d}
      fill="white"
      filter="url(#nx-eye-glow)"
      style={{ transition }}
    />
  )
}

function Star({ tx, ty, transition }: { tx: number; ty: number; transition: string }) {
  // 5-point star centered on (tx, ty)
  const r1 = 4
  const r2 = 1.6
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? r1 : r2
    const x = tx + r * Math.cos(angle)
    const y = ty + r * Math.sin(angle)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return (
    <polygon
      points={points.join(' ')}
      fill="white"
      filter="url(#nx-eye-glow)"
      style={{ transition }}
    />
  )
}
