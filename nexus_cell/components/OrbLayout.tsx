'use client'

import type { ReactNode } from 'react'
import NexusOrb from './NexusOrb'
import ModuleOrb from './ModuleOrb'

interface ModuleConfig {
  href: string
  icon: ReactNode
  label: string
  color: string
  badge?: number
}

interface OrbLayoutProps {
  modules: ModuleConfig[]
  onCenterClick: () => void
}

const RADIUS = 180
const ORB_SIZE = 52

export default function OrbLayout({ modules, onCenterClick }: OrbLayoutProps) {
  // Calculate positions for circular layout
  const positions = modules.map((_, i) => {
    const angle = (i / modules.length) * 2 * Math.PI - Math.PI / 2
    return {
      x: RADIUS * Math.cos(angle),
      y: RADIUS * Math.sin(angle),
    }
  })

  return (
    <>
      {/* Desktop: circular layout */}
      <div className="hidden md:flex items-center justify-center" style={{ minHeight: '520px' }}>
        <div className="relative" style={{ width: RADIUS * 2 + ORB_SIZE + 40, height: RADIUS * 2 + ORB_SIZE + 40 }}>
          {/* Connection lines SVG */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ overflow: 'visible' }}
          >
            {positions.map((pos, i) => (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${pos.x}px)`}
                y2={`calc(50% + ${pos.y}px)`}
                stroke="rgba(94, 234, 212, 0.08)"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Center orb */}
          <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <NexusOrb size="large" onClick={onCenterClick} />
          </div>

          {/* Module orbs */}
          {modules.map((mod, i) => (
            <div
              key={mod.href}
              className="absolute"
              style={{
                left: `calc(50% + ${positions[i].x}px - ${ORB_SIZE / 2}px)`,
                top: `calc(50% + ${positions[i].y}px - ${ORB_SIZE / 2}px)`,
              }}
            >
              <ModuleOrb
                href={mod.href}
                icon={mod.icon}
                label={mod.label}
                color={mod.color}
                badge={mod.badge}
                delay={300 + i * 80}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: grid layout */}
      <div className="flex md:hidden flex-col items-center pt-8 px-6">
        <div className="mb-10">
          <NexusOrb size="large" onClick={onCenterClick} />
        </div>
        <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
          {modules.map((mod, i) => (
            <div key={mod.href} className="flex justify-center">
              <ModuleOrb
                href={mod.href}
                icon={mod.icon}
                label={mod.label}
                color={mod.color}
                badge={mod.badge}
                delay={300 + i * 80}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
