'use client'

import { ChevronDown } from 'lucide-react'
import { RpCheck } from '@/components/rp'
import { STATUS_META, type SiteProjectStatus } from '@/lib/site-map'
import { LAYER_LABELS, zoneColor, type LayerKey } from './utils'

interface Props {
  open: boolean
  onToggleOpen: () => void
  layers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
  planOpacity: number
  onPlanOpacity: (v: number) => void
}

// Pins are true circles on the map, so their swatch stays round; everything else is square.
const SWATCH: Record<LayerKey, React.ReactNode> = {
  plan: <span className="h-3 w-3 border border-rp-line3 bg-[linear-gradient(135deg,#6f8a55,#4d86b8)]" />,
  boundary: <span className="h-3 w-3 border border-dashed border-rp-gold" />,
  track: <span className="h-[3px] w-3 bg-rp-gold" />,
  zones: <span className="h-3 w-3" style={{ background: zoneColor(55) }} />,
  pins: <span className="h-2.5 w-2.5 rounded-full bg-rp-gold" />,
}

const LEGEND_LABEL = 'font-display text-[10px] uppercase tracking-[.16em] text-rp-muted'

export default function LayersPanel({ open, onToggleOpen, layers, onToggleLayer, planOpacity, onPlanOpacity }: Props) {
  return (
    <div className="absolute left-3 top-3 z-10 w-[232px] max-w-[calc(100%-24px)] border border-rp-line2 bg-rp-bg/90">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex min-h-[40px] w-full items-center justify-between px-3 py-2 text-rp-muted transition-colors duration-200 hover:text-rp-text"
      >
        <span className="font-display text-[11px] uppercase tracking-[.18em] text-rp-gold">Layers</span>
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-rp-line px-3 pb-3">
          <ul className="m-0 list-none p-0 pt-2">
            {(Object.keys(LAYER_LABELS) as LayerKey[]).map(k => (
              <li key={k}>
                <RpCheck
                  checked={layers[k]}
                  onChange={() => onToggleLayer(k)}
                  className="w-full"
                  label={
                    <span className="flex items-center gap-2.5">
                      <span className="flex w-4 items-center justify-center">{SWATCH[k]}</span>
                      <span className={`text-[13px] ${layers[k] ? 'text-rp-text' : 'text-rp-dim'}`}>{LAYER_LABELS[k]}</span>
                    </span>
                  }
                />
                {k === 'plan' && layers.plan && (
                  <div className="flex items-center gap-2 pb-1.5 pl-[26px] pr-1">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={planOpacity}
                      onChange={e => onPlanOpacity(Number(e.target.value))}
                      className="h-1 flex-1 accent-rp-gold"
                      aria-label="Master plan opacity"
                    />
                    <span className="w-8 text-right font-display text-[11px] tabular-nums text-rp-muted">{Math.round(planOpacity * 100)}%</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-rp-line pt-3">
            <div className={`${LEGEND_LABEL} mb-2`}>Zone · % of budget spent</div>
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${[0, 10, 25, 50, 75, 100].map(p => zoneColor(p)).join(',')})` }} />
            <div className="mt-1 flex justify-between font-display text-[10px] tabular-nums tracking-[.08em] text-rp-dim"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-rp-line pt-3">
            {(Object.keys(STATUS_META) as SiteProjectStatus[]).map(s => (
              <div key={s} className="flex items-center gap-2">
                <i aria-hidden className="block h-1.5 w-1.5 shrink-0" style={{ background: STATUS_META[s].color }} />
                <span className="text-[12px] text-rp-muted">{STATUS_META[s].label}</span>
              </div>
            ))}
            <div className="col-span-2 mt-1 text-[12px] text-rp-dim">Pin size follows budget</div>
          </div>
        </div>
      )}
    </div>
  )
}
