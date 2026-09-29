'use client'

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

const SWATCH: Record<LayerKey, React.ReactNode> = {
  plan: <span className="w-3 h-3 border border-[#3A3E42] bg-[linear-gradient(135deg,#6f8a55,#4d86b8)]" />,
  boundary: <span className="w-3 h-3 border border-dashed border-[#CDA14B]" />,
  track: <span className="w-3 h-[3px] bg-[#CDA14B]" />,
  zones: <span className="w-3 h-3" style={{ background: zoneColor(55) }} />,
  pins: <span className="w-2.5 h-2.5 rounded-full bg-[#CDA14B]" />,
}

export default function LayersPanel({ open, onToggleOpen, layers, onToggleLayer, planOpacity, onPlanOpacity }: Props) {
  return (
    <div className="absolute top-3 left-3 z-10 w-[220px] max-w-[calc(100%-24px)] bg-[#0A0B0C]/90 border border-[#26292C] backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2"
      >
        <span className="rp-eyebrow !text-[11px]">Layers</span>
        <svg className={`w-3.5 h-3.5 text-[#9AA0A4] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-[#1F1F1F]">
          <ul className="pt-2 space-y-1">
            {(Object.keys(LAYER_LABELS) as LayerKey[]).map(k => (
              <li key={k}>
                <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layers[k]}
                    onChange={() => onToggleLayer(k)}
                    className="w-3.5 h-3.5 accent-[#CDA14B]"
                  />
                  <span className="w-4 flex items-center justify-center">{SWATCH[k]}</span>
                  <span className={`text-[12px] ${layers[k] ? 'text-[#E6E6E6]' : 'text-[#6E7578]'}`}>{LAYER_LABELS[k]}</span>
                </label>
                {k === 'plan' && layers.plan && (
                  <div className="pl-6 pr-1 pb-1 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={planOpacity}
                      onChange={e => onPlanOpacity(Number(e.target.value))}
                      className="flex-1 accent-[#CDA14B] h-1"
                      aria-label="Master plan opacity"
                    />
                    <span className="text-[10px] text-[#9AA0A4] tabular-nums w-7 text-right">{Math.round(planOpacity * 100)}%</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
            <div className="rp-eyebrow--muted !text-[9.5px] mb-1.5">Zone · % of budget spent</div>
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${[0, 10, 25, 50, 75, 100].map(p => zoneColor(p)).join(',')})` }} />
            <div className="flex justify-between text-[10px] text-[#6E7578] mt-1 tabular-nums"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1F1F1F] grid grid-cols-2 gap-x-2 gap-y-1">
            {(Object.keys(STATUS_META) as SiteProjectStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_META[s].color }} />
                <span className="text-[11px] text-[#9AA0A4]">{STATUS_META[s].label}</span>
              </div>
            ))}
            <div className="col-span-2 text-[10px] text-[#6E7578] mt-1">Pin size = budget</div>
          </div>
        </div>
      )}
    </div>
  )
}
