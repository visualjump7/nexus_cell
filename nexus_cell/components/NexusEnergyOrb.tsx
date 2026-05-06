'use client'

import { useMemo } from 'react'

// Nexus Energy Orb — the original sphere look, but more alive. A subtle
// breathing scale, a few staggered ripple rings emanating from the rim, and
// a layer of slow-drifting particles floating around the orb. Click to
// open the AI drawer (matches NexusCharacter's interface).
//
// All animations are CSS keyframes — no JS animation loop, no canvas — so
// the orb costs almost nothing to run. prefers-reduced-motion disables them
// at the global stylesheet level.

interface Props {
  size?: number
  onClick?: () => void
  label?: string
}

interface Particle {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  duration: number
  delay: number
  opacity: number
  size: number
}

const PARTICLE_COUNT = 10

// Deterministic pseudo-random so the same orb size produces the same
// particle field across renders (avoids flicker on re-render).
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function makeParticles(size: number, count: number): Particle[] {
  const rand = seededRandom(size * 7 + 13)
  const particles: Particle[] = []
  // Particles roam within roughly 1.4× the orb diameter — they orbit the orb
  // rather than just sitting inside it. Radii are picked per-particle below.
  for (let i = 0; i < count; i++) {
    const angleStart = rand() * Math.PI * 2
    const angleEnd = angleStart + (rand() - 0.5) * Math.PI // 90° drift on average
    const radiusStart = size * (0.35 + rand() * 0.55)
    const radiusEnd = size * (0.35 + rand() * 0.55)
    particles.push({
      id: i,
      fromX: Math.cos(angleStart) * radiusStart,
      fromY: Math.sin(angleStart) * radiusStart,
      toX: Math.cos(angleEnd) * radiusEnd,
      toY: Math.sin(angleEnd) * radiusEnd,
      duration: 8 + rand() * 6, // 8–14s
      delay: rand() * -10,       // negative = start mid-cycle so particles aren't all in sync
      opacity: 0.25 + rand() * 0.3,
      size: 2 + rand() * 2.5,    // 2–4.5px
    })
  }
  return particles
}

export default function NexusEnergyOrb({
  size = 200,
  onClick,
  label = 'Ask Nexus',
}: Props) {
  // Particles + ripples derived from size so the orb scales cleanly.
  const particles = useMemo(() => makeParticles(size, PARTICLE_COUNT), [size])
  const ripples = useMemo(() => [0, 2, 4], []) // staggered start delays in seconds

  // Container reserves the full halo padding above and to the sides so the
  // outer glow + drifting particles have room to bleed past the orb. Below
  // the orb we trim padding heavily — the bottom halo is mostly transparent
  // against pure black anyway, so the saved vertical space lets the headline
  // sit closer.
  const haloPad = Math.round(size * 0.55)
  const bottomPad = Math.round(size * 0.3)
  const totalW = size + haloPad * 2
  const totalH = haloPad + size + bottomPad
  // Orb center: horizontal center of the container, vertically just below
  // the top halo padding (not the geometric middle of totalH).
  const cx = totalW / 2
  const cy = haloPad + size / 2

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative cursor-pointer focus:outline-none flex items-center justify-center"
      style={{
        width: totalW,
        height: totalH,
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {/* Outer halo — wide diffuse teal glow. Pulses on its own slow rhythm. */}
      <span
        aria-hidden
        className="absolute pointer-events-none animate-nx-pulse-slow"
        style={{
          left: cx - size,
          top: cy - size,
          width: size * 2,
          height: size * 2,
          background:
            'radial-gradient(circle at 50% 50%, rgba(94,234,212,0.4) 0%, rgba(45,191,163,0.2) 25%, transparent 55%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
        }}
      />

      {/* Particle layer — small mint dots drifting around the orb */}
      {particles.map(p => (
        <span
          key={p.id}
          aria-hidden
          className="absolute rounded-full animate-nx-orb-particle pointer-events-none"
          style={{
            left: cx - p.size / 2,
            top: cy - p.size / 2,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, #a7f3d0 0%, #5eead4 60%, transparent 100%)',
            filter: 'blur(0.6px)',
            // CSS variables consumed by the @keyframes
            ['--nx-px-from-x' as string]: `${p.fromX}px`,
            ['--nx-px-from-y' as string]: `${p.fromY}px`,
            ['--nx-px-to-x' as string]: `${p.toX}px`,
            ['--nx-px-to-y' as string]: `${p.toY}px`,
            ['--nx-px-duration' as string]: `${p.duration}s`,
            ['--nx-px-delay' as string]: `${p.delay}s`,
            ['--nx-px-opacity' as string]: p.opacity.toString(),
          }}
        />
      ))}

      {/* Ripple rings — concentric outlines that scale outward + fade.
          Three rings staggered so one is always emanating somewhere. */}
      {ripples.map(delay => (
        <span
          key={`ripple-${delay}`}
          aria-hidden
          className="absolute rounded-full animate-nx-orb-ripple pointer-events-none"
          style={{
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            border: '1.5px solid rgba(94,234,212,0.5)',
            animationDelay: `${delay}s`,
          }}
        />
      ))}

      {/* The orb itself — full sphere with the existing teal gradient.
          Wrapped in a breath layer so the scale animation doesn't fight
          with anything else. */}
      <span
        className="absolute rounded-full animate-nx-orb-breath"
        style={{
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          background:
            'radial-gradient(circle at 35% 30%, #5fe8c8 0%, var(--nx-teal, #2dbfa3) 35%, var(--nx-teal-dim, #1a8470) 75%, #0d4438 100%)',
          boxShadow: [
            '0 0 60px rgba(45,191,163,0.45)',
            '0 0 100px rgba(45,191,163,0.25)',
            'inset -10px -20px 40px rgba(0,0,0,0.4)',
            'inset 10px 15px 30px rgba(255,255,255,0.15)',
          ].join(', '),
        }}
        aria-hidden
      />
    </button>
  )
}
