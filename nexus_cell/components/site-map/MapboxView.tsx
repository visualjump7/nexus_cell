'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  SITE,
  MAP_STYLE,
  MAX_BOUNDS,
  MASTERPLAN_IMAGE,
  MASTERPLAN_CORNERS,
  SITE_BOUNDARY,
  ROAD_COURSE,
  STREET_COURSE,
  STATUS_META,
  planToLngLat,
  pctSpent,
  formatMoneyShort,
  type PlanPoint,
  type SiteProject,
} from '@/lib/site-map'
import { zoneColor, escapeHtml, type LayerKey, type PinSpec, type ZoneStat } from './utils'

interface Props {
  zones: ZoneStat[]
  pins: PinSpec[]
  visibleIds: Set<string>
  layers: Record<LayerKey, boolean>
  planOpacity: number
  is3D: boolean
  selectedProjectId: string | null
  selectedZoneId: string | null
  onSelectProject: (id: string | null) => void
  onSelectZone: (id: string | null) => void
  onFail: () => void
}

const GOLD = '#CDA14B'

const ring = (pts: PlanPoint[]) => {
  const c = pts.map(planToLngLat)
  return [...c, c[0]]
}

// Which Mapbox layer ids belong to each toggle.
const LAYER_IDS: Record<Exclude<LayerKey, 'pins'>, string[]> = {
  plan: ['rp-plan'],
  boundary: ['rp-boundary-fill', 'rp-boundary-line'],
  track: ['rp-track-glow', 'rp-track-line'],
  zones: ['rp-zones-fill', 'rp-zones-line', 'rp-zones-selected', 'rp-zones-label'],
}

export function projectPopupHtml(p: SiteProject): string {
  const meta = STATUS_META[p.status]
  const pct = pctSpent(p.budgeted, p.actual)
  return `<div class="rp-sm-pop">
    <div class="rp-sm-pop__name">${escapeHtml(p.name)}</div>
    <div class="rp-sm-pop__row"><span>${formatMoneyShort(p.budgeted)} budget</span><span>${pct.toFixed(0)}% spent</span></div>
    <div class="rp-sm-pop__status" style="color:${meta.color}">● ${meta.label}</div>
  </div>`
}

export default function MapboxView({
  zones, pins, visibleIds, layers, planOpacity, is3D,
  selectedProjectId, selectedZoneId, onSelectProject, onSelectZone, onFail,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: HTMLDivElement; dot: HTMLDivElement; color: string }>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const lastMarkerClick = useRef(0)
  const [loaded, setLoaded] = useState(false)

  // Latest callbacks for handlers bound once at load.
  const cb = useRef({ onSelectProject, onSelectZone, onFail })
  cb.current = { onSelectProject, onSelectZone, onFail }

  // ── Init (once) ──
  useEffect(() => {
    if (!container.current || mapRef.current) return
    const markers = markersRef.current
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    const narrow = typeof window !== 'undefined' && window.innerWidth < 768
    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: container.current,
        style: MAP_STYLE,
        center: SITE.center,
        zoom: narrow ? SITE.zoom - 0.6 : SITE.zoom,
        pitch: narrow ? 0 : SITE.pitch,
        bearing: 0,
        maxBounds: MAX_BOUNDS,
        attributionControl: false,
      })
    } catch {
      cb.current.onFail()
      return
    }
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    let didLoad = false
    const timeout = window.setTimeout(() => { if (!didLoad) cb.current.onFail() }, 15000)
    map.on('error', () => { if (!didLoad) cb.current.onFail() })

    map.on('load', () => {
      didLoad = true
      window.clearTimeout(timeout)

      // Dark tint: dim and desaturate every raster (satellite) layer.
      for (const l of map.getStyle().layers || []) {
        if (l.type === 'raster') {
          map.setPaintProperty(l.id, 'raster-brightness-max', 0.5)
          map.setPaintProperty(l.id, 'raster-saturation', -0.45)
          map.setPaintProperty(l.id, 'raster-contrast', 0.05)
        }
      }

      // a. Master plan overlay
      map.addSource('rp-plan', { type: 'image', url: MASTERPLAN_IMAGE, coordinates: MASTERPLAN_CORNERS })
      map.addLayer({ id: 'rp-plan', type: 'raster', source: 'rp-plan', paint: { 'raster-opacity': planOpacity, 'raster-fade-duration': 0 } })

      // d. Zones
      map.addSource('rp-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: zones.map(z => ({
            type: 'Feature',
            properties: { id: z.zone.id, label: z.zone.short, color: zoneColor(z.pct, z.projects.length > 0) },
            geometry: { type: 'Polygon', coordinates: [ring(z.zone.polygon)] },
          })),
        },
      })
      map.addSource('rp-zone-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: zones.map(z => {
            const n = z.zone.polygon.length
            const cx = z.zone.polygon.reduce((s, p) => s + p[0], 0) / n
            const cy = z.zone.polygon.reduce((s, p) => s + p[1], 0) / n
            return { type: 'Feature', properties: { label: z.zone.short.toUpperCase() }, geometry: { type: 'Point', coordinates: planToLngLat([cx, cy]) } }
          }),
        },
      })
      map.addLayer({ id: 'rp-zones-fill', type: 'fill', source: 'rp-zones', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.45 } })

      // b. Site boundary
      map.addSource('rp-boundary', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring(SITE_BOUNDARY)] } },
      })
      map.addLayer({ id: 'rp-boundary-fill', type: 'fill', source: 'rp-boundary', paint: { 'fill-color': GOLD, 'fill-opacity': 0.04 } })
      map.addLayer({ id: 'rp-boundary-line', type: 'line', source: 'rp-boundary', paint: { 'line-color': GOLD, 'line-width': 2, 'line-opacity': 0.9, 'line-dasharray': [3, 2] } })

      map.addLayer({ id: 'rp-zones-line', type: 'line', source: 'rp-zones', paint: { 'line-color': '#E0BF7B', 'line-width': 0.8, 'line-opacity': 0.45 } })
      map.addLayer({ id: 'rp-zones-selected', type: 'line', source: 'rp-zones', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': '#F5F5F5', 'line-width': 2.5 } })

      // c. Road course (2.75 mi) + street course (0.76 mi)
      map.addSource('rp-track', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { kind: 'road' }, geometry: { type: 'LineString', coordinates: ring(ROAD_COURSE) } },
            { type: 'Feature', properties: { kind: 'street' }, geometry: { type: 'LineString', coordinates: ring(STREET_COURSE) } },
          ],
        },
      })
      map.addLayer({ id: 'rp-track-glow', type: 'line', source: 'rp-track', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': GOLD, 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 4 } })
      map.addLayer({
        id: 'rp-track-line', type: 'line', source: 'rp-track', layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['match', ['get', 'kind'], 'street', '#E0BF7B', GOLD],
          'line-width': ['match', ['get', 'kind'], 'street', 2, 3.5],
          'line-dasharray': ['match', ['get', 'kind'], 'street', ['literal', [2, 1.5]], ['literal', [1, 0]]],
        },
      })

      map.addLayer({
        id: 'rp-zones-label', type: 'symbol', source: 'rp-zone-points', minzoom: 14.6,
        layout: { 'text-field': ['get', 'label'], 'text-size': 10, 'text-letter-spacing': 0.18, 'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'], 'text-allow-overlap': false },
        paint: { 'text-color': '#F5F5F5', 'text-opacity': 0.75, 'text-halo-color': '#0A0B0C', 'text-halo-width': 1.2 },
      })

      map.on('click', 'rp-zones-fill', e => {
        if (Date.now() - lastMarkerClick.current < 250) return
        const id = e.features?.[0]?.properties?.id as string | undefined
        if (id) cb.current.onSelectZone(id)
      })
      map.on('mouseenter', 'rp-zones-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'rp-zones-fill', () => { map.getCanvas().style.cursor = '' })

      // e. Project pins (HTML markers)
      popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: false, closeOnClick: false, className: 'rp-sm-popup', maxWidth: '260px' })
      markers.clear()
      for (const pin of pins) {
        const root = document.createElement('div')
        root.style.cssText = `width:${pin.size}px;height:${pin.size}px;cursor:pointer;`
        const dot = document.createElement('div')
        const archived = pin.project.status === 'archived'
        dot.style.cssText = `width:100%;height:100%;border-radius:50%;background:${pin.color};opacity:${archived ? 0.7 : 1};border:2px solid #0A0B0C;box-shadow:0 0 0 1px ${pin.color}80,0 0 10px ${pin.color}66;transition:transform .2s ease,box-shadow .2s ease,opacity .2s ease;`
        root.appendChild(dot)
        root.setAttribute('role', 'button')
        root.setAttribute('aria-label', pin.project.name)
        const marker = new mapboxgl.Marker({ element: root, offset: pin.offset }).setLngLat([pin.lng, pin.lat]).addTo(map)
        root.addEventListener('mouseenter', () => {
          popupRef.current?.setLngLat([pin.lng, pin.lat]).setOffset([pin.offset[0], pin.offset[1] - pin.size / 2 - 4] as [number, number]).setHTML(projectPopupHtml(pin.project)).addTo(map)
        })
        root.addEventListener('mouseleave', () => { popupRef.current?.remove() })
        root.addEventListener('click', ev => {
          ev.stopPropagation()
          lastMarkerClick.current = Date.now()
          cb.current.onSelectProject(pin.project.id)
        })
        markers.set(pin.project.id, { marker, root, dot, color: pin.color })
      }

      setLoaded(true)
    })

    return () => {
      window.clearTimeout(timeout)
      popupRef.current?.remove()
      markers.forEach(m => m.marker.remove())
      markers.clear()
      map.remove()
      mapRef.current = null
    }
  // Geometry and pins are fixed for the life of the page; init once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    for (const key of Object.keys(LAYER_IDS) as (keyof typeof LAYER_IDS)[]) {
      for (const id of LAYER_IDS[key]) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', layers[key] ? 'visible' : 'none')
      }
    }
  }, [layers, loaded])

  // Plan opacity
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !map.getLayer('rp-plan')) return
    map.setPaintProperty('rp-plan', 'raster-opacity', planOpacity)
  }, [planOpacity, loaded])

  // 2D / 3D
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    map.easeTo({ pitch: is3D ? SITE.pitch : 0, bearing: is3D ? -12 : 0, duration: 800 })
  }, [is3D, loaded])

  // Selected zone outline
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !map.getLayer('rp-zones-selected')) return
    map.setFilter('rp-zones-selected', ['==', ['get', 'id'], selectedZoneId || ''])
  }, [selectedZoneId, loaded])

  // Pin visibility + selection styling
  useEffect(() => {
    if (!loaded) return
    markersRef.current.forEach(({ root, dot, color }, id) => {
      const visible = layers.pins && visibleIds.has(id)
      root.style.display = visible ? '' : 'none'
      const sel = id === selectedProjectId
      dot.style.transform = sel ? 'scale(1.45)' : 'scale(1)'
      dot.style.boxShadow = sel
        ? `0 0 0 2px #F5F5F5, 0 0 18px ${color}`
        : `0 0 0 1px ${color}80, 0 0 10px ${color}66`
      root.style.zIndex = sel ? '5' : ''
    })
  }, [visibleIds, layers.pins, selectedProjectId, loaded])

  // Fly to selected project
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !selectedProjectId) return
    const pin = pins.find(p => p.project.id === selectedProjectId)
    if (pin) map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 16), duration: 900 })
  }, [selectedProjectId, loaded, pins])

  return (
    <div className="absolute inset-0">
      <div ref={container} className="absolute inset-0" />
      {!loaded && (
        <div className="absolute inset-0 bg-[#0E0F11] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#CDA14B] rounded-full animate-pulse" />
            <p className="rp-eyebrow--muted">Loading site map…</p>
          </div>
        </div>
      )}
    </div>
  )
}
