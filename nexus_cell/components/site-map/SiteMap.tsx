'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { SITE, pctSpent, isPinned, type SiteProject, type SiteProjectStatus } from '@/lib/site-map'
import { RpStatStrip, RpStat, RpNote, RpCapNum, fmtMoney, dot } from '@/components/rp'
import { BRAND } from '@/lib/brand'
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

  // Narrow screens: flat map. The open layers panel covers about a third of
  // the plan until the map column is ~900px wide (a 1600px window beside the
  // sidebar and the package list), so below that it starts collapsed.
  useEffect(() => {
    if (window.innerWidth < 768) setIs3D(false)
    if (window.innerWidth < 1600) setLayersOpen(false)
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
    const pinned = projects.filter(isPinned).length
    return { budgeted, actual, pct: pctSpent(budgeted, actual), count: projects.length, pinned }
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

  const remaining = totals.budgeted - totals.actual

  return (
    <>
      {/* Program strip */}
      <RpStatStrip cols={5}>
        <RpStat label="Program budget" value={fmtMoney(totals.budgeted, { compact: true })} sub={`${totals.count} packages`} />
        <RpStat
          label="Spent to date"
          value={fmtMoney(totals.actual, { compact: true })}
          sub={`${totals.pct.toFixed(1)}% of budget`}
          meter={{ value: totals.budgeted > 0 ? totals.actual / totals.budgeted : 0 }}
        />
        <RpStat
          label={remaining < 0 ? 'Over budget' : 'Remaining'}
          value={fmtMoney(Math.abs(remaining), { compact: true })}
          tone={remaining < 0 ? 'alert' : 'default'}
          sub="to complete the build"
        />
        <RpStat label="On the map" value={totals.pinned} sub={dot(`of ${totals.count} packages`, 'soft costs listed')} />
        <RpStat label="Acreage" value={`${SITE.acres} ac`} sub={dot('2.75-mi road', '0.76-mi street')} />
      </RpStatStrip>

      {/* Map frame + side panel (bottom sheet below lg) */}
      <figure className="rp-figure rp-sitemap">
        <div className="relative overflow-hidden border border-rp-line bg-rp-panel h-[74vh] min-h-[540px] lg:h-[680px] lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
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
                reason={hasToken ? 'satellite unavailable' : 'master plan'}
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
              <div className="absolute right-[10px] top-[118px] z-10 flex flex-col border border-rp-line2 bg-rp-bg/90" role="group" aria-label="Map view">
                {[{ k: false, l: '2D' }, { k: true, l: '3D' }].map(o => (
                  <button
                    key={o.l}
                    type="button"
                    onClick={() => setIs3D(o.k)}
                    aria-pressed={is3D === o.k}
                    className={`h-[29px] w-[29px] font-display text-[11px] tracking-[0.08em] transition-colors duration-200 ${
                      is3D === o.k
                        ? 'bg-rp-gold/[.14] text-rp-text outline outline-1 -outline-offset-1 outline-rp-gold'
                        : 'text-rp-muted hover:text-rp-text'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside
            aria-label="Packages on the site"
            className={`absolute inset-x-0 bottom-0 z-20 flex flex-col border-t border-rp-line2 bg-rp-bg transition-[height] duration-300 motion-reduce:transition-none lg:static lg:h-full lg:border-l lg:border-t-0 lg:border-rp-line ${sheetOpen ? 'h-[72%]' : 'h-[150px]'}`}
          >
            <button
              type="button"
              onClick={() => setSheetOpen(o => !o)}
              className="flex shrink-0 flex-col items-center gap-1.5 pb-2 pt-2.5 lg:hidden"
              aria-expanded={sheetOpen}
              aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
            >
              <span className="h-[3px] w-10 bg-rp-line3" />
              <span className="font-display text-[10px] uppercase tracking-[.18em] text-rp-muted">
                {visible.length} package{visible.length !== 1 ? 's' : ''}
              </span>
            </button>
            <div className="min-h-0 flex-1">
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
        <figcaption className="rp-figcap">
          <span className="rp-figcap-text">
            <RpCapNum n={1} />
            <span>{useFallback ? 'Plan view · the master plan with pins, circuits and zones' : 'Satellite · the master plan overlaid, zones shaded by spend'}</span>
          </span>
          <span className="rp-figcap-qual">{BRAND.site.address}</span>
        </figcaption>
      </figure>

      <RpNote>
        Master plan overlay, boundary, circuits and zones are approximate and not survey-grade. Pin size follows budget; soft costs and sitewide packages are listed, not pinned.
      </RpNote>

      <style jsx global>{`
        .rp-sm-popup .mapboxgl-popup-content {
          background: #0A0B0C;
          border: 1px solid #26292C;
          border-radius: 0;
          padding: 10px 12px;
          box-shadow: none;
          font-family: var(--font-body), sans-serif;
        }
        .rp-sm-popup .mapboxgl-popup-tip { border-top-color: #26292C; border-bottom-color: #26292C; }
        .rp-sm-pop__name { font-size: 13px; color: #F5F5F5; line-height: 1.35; margin-bottom: 4px; }
        .rp-sm-pop__row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: #9AA0A4; font-variant-numeric: tabular-nums; }
        .rp-sm-pop__status { display: flex; align-items: center; gap: 6px; font-family: var(--font-display), sans-serif; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; margin-top: 6px; }
        .rp-sm-pop__sq { display: inline-block; width: 6px; height: 6px; }
        .rp-sitemap .mapboxgl-ctrl-group {
          border-radius: 0;
          background: rgba(10, 11, 12, .9);
          border: 1px solid #26292C;
          box-shadow: none;
        }
        .rp-sitemap .mapboxgl-ctrl-group button + button { border-top-color: #1F1F1F; }
        .rp-sitemap .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon { filter: invert(1) brightness(.8); }
        .rp-sitemap .mapboxgl-ctrl-group button:focus-visible { box-shadow: 0 0 0 2px #3989CB; }
        .rp-sitemap .mapboxgl-ctrl-attrib,
        .rp-sitemap .mapboxgl-ctrl-attrib.mapboxgl-compact { background: rgba(10, 11, 12, .7); border-radius: 0; }
        .rp-sitemap .mapboxgl-ctrl-attrib a { color: #9AA0A4; }
      `}</style>
    </>
  )
}
