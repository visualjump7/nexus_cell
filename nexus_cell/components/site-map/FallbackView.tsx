'use client'

import { useState } from 'react'
import {
  MASTERPLAN_IMAGE,
  PLAN_W,
  PLAN_H,
  SITE_BOUNDARY,
  ROAD_COURSE,
  STREET_COURSE,
  STATUS_META,
  lngLatToPlan,
  pctSpent,
  formatMoneyShort,
  type PlanPoint,
} from '@/lib/site-map'
import { zoneColor, type LayerKey, type PinSpec, type ZoneStat } from './utils'

interface Props {
  zones: ZoneStat[]
  pins: PinSpec[]
  visibleIds: Set<string>
  layers: Record<LayerKey, boolean>
  planOpacity: number
  selectedProjectId: string | null
  selectedZoneId: string | null
  onSelectProject: (id: string | null) => void
  onSelectZone: (id: string | null) => void
  reason: string
}

const pts = (p: PlanPoint[]) => p.map(([x, y]) => `${x},${y}`).join(' ')

// No-token / failed-load fallback: the master plan image with the same plan-unit
// geometry drawn as SVG, and pins placed by linear interpolation of lat/lng
// between the overlay corners (lngLatToPlan).
export default function FallbackView({
  zones, pins, visibleIds, layers, planOpacity,
  selectedProjectId, selectedZoneId, onSelectProject, onSelectZone, reason,
}: Props) {
  const [hover, setHover] = useState<PinSpec | null>(null)

  return (
    <div className="absolute inset-0 bg-[#0A0B0C]">
      <div className="absolute inset-0 overflow-auto">
      <div className="relative mx-auto" style={{ aspectRatio: `${PLAN_W} / ${PLAN_H}`, width: 'max(100%, 760px)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MASTERPLAN_IMAGE}
          alt="Roaring Pines master plan"
          className="absolute inset-0 w-full h-full select-none"
          style={{ opacity: layers.plan ? Math.max(planOpacity, 0.25) : 0.08, filter: 'grayscale(.35) brightness(.72)' }}
          draggable={false}
        />
        <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {layers.zones && zones.map(z => (
            <polygon
              key={z.zone.id}
              points={pts(z.zone.polygon)}
              fill={zoneColor(z.pct, z.projects.length > 0)}
              fillOpacity={0.45}
              stroke={selectedZoneId === z.zone.id ? '#F5F5F5' : '#E0BF7B'}
              strokeOpacity={selectedZoneId === z.zone.id ? 1 : 0.5}
              strokeWidth={selectedZoneId === z.zone.id ? 5 : 2}
              className="cursor-pointer"
              onClick={() => onSelectZone(z.zone.id)}
            >
              <title>{`${z.zone.name} · ${z.projects.length} projects · ${pctSpent(z.budgeted, z.actual).toFixed(0)}% spent`}</title>
            </polygon>
          ))}
          {layers.boundary && (
            <polygon points={pts(SITE_BOUNDARY)} fill="#CDA14B" fillOpacity={0.04} stroke="#CDA14B" strokeWidth={4} strokeDasharray="14 9" pointerEvents="none" />
          )}
          {layers.track && (
            <g pointerEvents="none" fill="none" strokeLinejoin="round">
              <polygon points={pts(ROAD_COURSE)} stroke="#CDA14B" strokeOpacity={0.2} strokeWidth={22} />
              <polygon points={pts(ROAD_COURSE)} stroke="#CDA14B" strokeWidth={7} />
              <polygon points={pts(STREET_COURSE)} stroke="#E0BF7B" strokeWidth={4} strokeDasharray="10 7" />
            </g>
          )}
          {layers.zones && zones.map(z => {
            const n = z.zone.polygon.length
            const cx = z.zone.polygon.reduce((s, p) => s + p[0], 0) / n
            const cy = z.zone.polygon.reduce((s, p) => s + p[1], 0) / n
            return (
              <text key={`l-${z.zone.id}`} x={cx} y={cy} textAnchor="middle" fill="#F5F5F5" fillOpacity={0.7} fontSize={20} letterSpacing={3} pointerEvents="none" style={{ fontFamily: 'var(--font-display), sans-serif', textTransform: 'uppercase' }}>
                {z.zone.short.toUpperCase()}
              </text>
            )
          })}
        </svg>

        {layers.pins && pins.filter(p => visibleIds.has(p.project.id)).map(pin => {
          const [x, y] = lngLatToPlan(pin.lng, pin.lat)
          const sel = pin.project.id === selectedProjectId
          return (
            <button
              key={pin.project.id}
              type="button"
              aria-label={pin.project.name}
              onClick={() => onSelectProject(pin.project.id)}
              onMouseEnter={() => setHover(pin)}
              onMouseLeave={() => setHover(h => (h?.project.id === pin.project.id ? null : h))}
              className="absolute rounded-full transition-transform"
              style={{
                left: `${(x / PLAN_W) * 100}%`,
                top: `${(y / PLAN_H) * 100}%`,
                width: pin.size,
                height: pin.size,
                transform: `translate(calc(-50% + ${pin.offset[0]}px), calc(-50% + ${pin.offset[1]}px)) scale(${sel ? 1.45 : 1})`,
                background: pin.color,
                opacity: pin.project.status === 'archived' ? 0.7 : 1,
                border: '2px solid #0A0B0C',
                boxShadow: sel ? `0 0 0 2px #F5F5F5, 0 0 18px ${pin.color}` : `0 0 0 1px ${pin.color}80, 0 0 10px ${pin.color}66`,
                zIndex: sel ? 5 : 1,
              }}
            />
          )
        })}

        {hover && (() => {
          const [x, y] = lngLatToPlan(hover.lng, hover.lat)
          const meta = STATUS_META[hover.project.status]
          return (
            <div
              className="absolute z-10 pointer-events-none bg-[#141618] border border-[#26292C] px-2.5 py-2 shadow-xl shadow-black/50 min-w-[180px] max-w-[240px]"
              style={{ left: `${(x / PLAN_W) * 100}%`, top: `${(y / PLAN_H) * 100}%`, transform: `translate(-50%, calc(-100% - ${hover.size / 2 + 10}px))` }}
            >
              <div className="text-[12px] text-[#F5F5F5] leading-snug mb-1">{hover.project.name}</div>
              <div className="flex justify-between gap-3 text-[11px] text-[#9AA0A4] tabular-nums">
                <span>{formatMoneyShort(hover.project.budgeted)} budget</span>
                <span>{pctSpent(hover.project.budgeted, hover.project.actual).toFixed(0)}% spent</span>
              </div>
              <div className="font-display uppercase tracking-[0.16em] text-[10px] mt-1" style={{ color: meta.color }}>● {meta.label}</div>
            </div>
          )
        })()}
      </div>
      </div>

      <div className="hidden sm:block absolute top-3 right-3 bg-[#0A0B0C]/85 border border-[#26292C] px-2.5 py-1.5 pointer-events-none">
        <span className="rp-eyebrow--muted !text-[10px]">Plan view · {reason}</span>
      </div>
    </div>
  )
}
