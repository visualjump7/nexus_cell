'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { SITE, pctSpent, formatMoneyShort, type SiteProject, type SiteProjectStatus } from '@/lib/site-map'
import { buildPins, zoneStats, type LayerKey } from './utils'
import LayersPanel from './LayersPanel'
import SidePanel from './SidePanel'
import FallbackView from './FallbackView'

// Mapbox touches window/WebGL; load it on the client only.
const MapboxView = dynamic(() => import('./MapboxView'), { ssr: false })

interface Props {
  projects: SiteProject[]
}

const ALL_STATUSES: SiteProjectStatus[] = ['active', 'completed', 'on_hold', 'archived']

export default function SiteMap({ projects }: Props) {
  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const [mapFailed, setMapFailed] = useState(false)
  const useFallback = !hasToken || mapFailed

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ plan: true, boundary: true, track: true, zones: true, pins: true })
  const [planOpacity, setPlanOpacity] = useState(0.55)
  const [layersOpen, setLayersOpen] = useState(true)
  const [is3D, setIs3D] = useState(true)
  const [statusFilter, setStatusFilter] = useState<Set<SiteProjectStatus>>(() => new Set(ALL_STATUSES))
  const [search, setSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Narrow screens: flat map, collapsed layers panel.
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIs3D(false)
      setLayersOpen(false)
    }
  }, [])

  const zones = useMemo(() => zoneStats(projects), [projects])
  const pins = useMemo(() => buildPins(projects), [projects])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter(p => statusFilter.has(p.status) && (!q || p.name.toLowerCase().includes(q)))
  }, [projects, statusFilter, search])
  const visibleIds = useMemo(() => new Set(visible.map(p => p.id)), [visible])

  const totals = useMemo(() => {
    const budgeted = projects.reduce((s, p) => s + p.budgeted, 0)
    const actual = projects.reduce((s, p) => s + p.actual, 0)
    return { budgeted, actual, pct: pctSpent(budgeted, actual), count: projects.length }
  }, [projects])

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null
  const selectedZone = zones.find(z => z.zone.id === selectedZoneId) || null

  const selectProject = useCallback((id: string | null) => {
    setSelectedProjectId(id)
    if (id) setSheetOpen(true)
  }, [])
  const selectZone = useCallback((id: string | null) => {
    setSelectedProjectId(null)
    setSelectedZoneId(id)
    if (id) setSheetOpen(true)
  }, [])
  const clear = useCallback(() => {
    if (selectedProjectId) setSelectedProjectId(null)
    else setSelectedZoneId(null)
  }, [selectedProjectId])
  const onFail = useCallback(() => setMapFailed(true), [])

  function toggleStatus(s: SiteProjectStatus) {
    setStatusFilter(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const stats = [
    { label: 'Total budget', value: formatMoneyShort(totals.budgeted) },
    { label: 'Spent to date', value: formatMoneyShort(totals.actual) },
    { label: '% spent', value: `${totals.pct.toFixed(1)}%` },
    { label: 'Projects', value: String(totals.count) },
    { label: 'Acreage', value: `${SITE.acres} ac` },
  ]

  return (
    <div className="rp-fade">
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[#1F1F1F] border border-[#1F1F1F] mb-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`bg-[#0E0F11] px-4 py-3.5 ${i === stats.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="rp-eyebrow--muted !text-[10px] mb-1.5">{s.label}</div>
            <div className="rp-stat-value !text-[24px] lg:!text-[28px]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Map + side panel (bottom sheet below lg) */}
      <div className="relative rp-panel overflow-hidden h-[74vh] min-h-[540px] lg:h-[680px] lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-full min-w-0">
          {useFallback ? (
            <FallbackView
              zones={zones}
              pins={pins}
              visibleIds={visibleIds}
              layers={layers}
              planOpacity={planOpacity}
              selectedProjectId={selectedProjectId}
              selectedZoneId={selectedZoneId}
              onSelectProject={selectProject}
              onSelectZone={selectZone}
              reason={hasToken ? 'map unavailable' : 'no map token'}
            />
          ) : (
            <MapboxView
              zones={zones}
              pins={pins}
              visibleIds={visibleIds}
              layers={layers}
              planOpacity={planOpacity}
              is3D={is3D}
              selectedProjectId={selectedProjectId}
              selectedZoneId={selectedZoneId}
              onSelectProject={selectProject}
              onSelectZone={selectZone}
              onFail={onFail}
            />
          )}

          <LayersPanel
            open={layersOpen}
            onToggleOpen={() => setLayersOpen(o => !o)}
            layers={layers}
            onToggleLayer={k => setLayers(l => ({ ...l, [k]: !l[k] }))}
            planOpacity={planOpacity}
            onPlanOpacity={setPlanOpacity}
          />

          {!useFallback && (
            <div className="absolute z-10 right-[10px] top-[118px] flex flex-col border border-[#26292C] bg-[#0A0B0C]/90" role="group" aria-label="Map view">
              {[{ k: false, l: '2D' }, { k: true, l: '3D' }].map(o => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => setIs3D(o.k)}
                  aria-pressed={is3D === o.k}
                  className={`w-[29px] h-[29px] font-display text-[11px] tracking-[0.08em] transition-colors ${is3D === o.k ? 'text-[#0A0B0C] bg-[#CDA14B]' : 'text-[#9AA0A4] hover:text-[#F5F5F5]'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-[#0E0F11] border-t border-[#26292C] shadow-[0_-12px_30px_rgba(0,0,0,.45)] transition-[height] duration-300 lg:static lg:h-full lg:border-t-0 lg:border-l lg:shadow-none ${sheetOpen ? 'h-[72%]' : 'h-[150px]'}`}
        >
          <button
            type="button"
            onClick={() => setSheetOpen(o => !o)}
            className="lg:hidden shrink-0 flex flex-col items-center gap-1 pt-2 pb-1.5"
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
          >
            <span className="w-10 h-1 bg-[#3A3E42]" />
            <span className="rp-eyebrow--muted !text-[9.5px]">{visible.length} project{visible.length !== 1 ? 's' : ''}</span>
          </button>
          <div className="flex-1 min-h-0">
            <SidePanel
              projects={projects}
              visible={visible}
              zones={zones}
              statusFilter={statusFilter}
              onToggleStatus={toggleStatus}
              search={search}
              onSearch={setSearch}
              selectedProject={selectedProject}
              selectedZone={selectedZone}
              onSelectProject={selectProject}
              onSelectZone={selectZone}
              onClear={clear}
            />
          </div>
        </aside>
      </div>

      <p className="rp-caption mt-3 !text-[12px] !text-[#6E7578]">
        {SITE.address} · {SITE.place}. Master plan overlay, boundary, circuits and zones are approximate and not survey-grade.
      </p>

      <style jsx global>{`
        .rp-sm-popup .mapboxgl-popup-content {
          background: #141618;
          border: 1px solid #26292C;
          border-radius: 2px;
          padding: 8px 10px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, .55);
          font-family: var(--font-body), sans-serif;
        }
        .rp-sm-popup .mapboxgl-popup-tip { border-top-color: #26292C; }
        .rp-sm-pop__name { font-size: 12px; color: #F5F5F5; line-height: 1.35; margin-bottom: 4px; }
        .rp-sm-pop__row { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: #9AA0A4; font-variant-numeric: tabular-nums; }
        .rp-sm-pop__status { font-family: var(--font-display), sans-serif; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; margin-top: 4px; }
      `}</style>
    </div>
  )
}
