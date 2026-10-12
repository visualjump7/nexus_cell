'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { TripSegment } from '@/lib/types'
import { segmentColors } from '@/lib/travel-constants'
import { RpLoading, RpPending } from '@/components/rp'

interface Props {
  segments: TripSegment[]
  selectedSegmentId?: string | null
  onSegmentSelect?: (id: string | null) => void
  /** Rendered instead of the map when there is no Mapbox token, no coordinates, or the map fails to load. */
  fallback?: React.ReactNode
}

// Routes are drawn as a gold thread on the dark style; stops keep their
// segment colour (flight blue, hotel gold, ground green) as square markers.
const GOLD = '#CDA14B'
const GOLD_LIGHT = '#E0BF7B'

function routeColor(type: string) {
  return type === 'flight' || type === 'car' || type === 'ground_transport' ? GOLD : GOLD_LIGHT
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function getArcPoints(from: [number, number], to: [number, number], numPoints = 50): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    points.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t])
  }
  return points
}

export default function TripMap({ segments, selectedSegmentId, onSegmentSelect, fallback }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement; color: string }[]>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  // Build points and routes with segment ID tracking
  const points: { lat: number; lng: number; label: string; type: string; segmentId: string }[] = []
  const routes: { from: [number, number]; to: [number, number]; type: string; isDashed: boolean; segmentId: string }[] = []

  for (const seg of segments) {
    if (seg.from_lat && seg.from_lng) {
      points.push({ lat: seg.from_lat, lng: seg.from_lng, label: seg.from_location || '', type: seg.segment_type, segmentId: seg.id })
    }
    if (seg.to_lat && seg.to_lng) {
      points.push({ lat: seg.to_lat, lng: seg.to_lng, label: seg.to_location || '', type: seg.segment_type === 'flight' ? 'airport' : seg.segment_type, segmentId: seg.id })
    }
    if (seg.from_lat && seg.from_lng && seg.to_lat && seg.to_lng) {
      // Flights draw solid; everything on the ground draws dashed.
      routes.push({ from: [seg.from_lng, seg.from_lat], to: [seg.to_lng, seg.to_lat], type: seg.segment_type, isDashed: seg.segment_type !== 'flight', segmentId: seg.id })
    }
  }

  const uniquePoints = points.filter((p, i) =>
    points.findIndex(q => Math.abs(q.lat - p.lat) < 0.01 && Math.abs(q.lng - p.lng) < 0.01) === i
  )

  const hasCoords = uniquePoints.length > 0
  const canMap = hasCoords && !!token && !failed

  const restOpacity = (r: { isDashed: boolean }) => (r.isDashed ? 0.55 : 0.85)
  const restWidth = (r: { type: string }) => (r.type === 'flight' ? 2 : 1.75)

  // ── Map initialization (runs once) ──
  useEffect(() => {
    if (!mapContainer.current || !hasCoords || !token || mapRef.current) return

    mapboxgl.accessToken = token

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [uniquePoints[0].lng, uniquePoints[0].lat],
        zoom: 4,
        attributionControl: false,
        interactive: true,
      })
    } catch {
      setFailed(true)
      return
    }

    mapRef.current = map

    // Style or token failure before the first load → show the fallback instead of an empty frame.
    map.on('error', () => {
      if (!map.loaded() && !map.isStyleLoaded()) {
        map.remove()
        mapRef.current = null
        setFailed(true)
      }
    })

    map.on('load', async () => {
      // Add route lines — flights as arcs, ground segments as real driving routes
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i]
        let coordinates: [number, number][]

        if (route.type === 'flight') {
          // Great circle arc for flights
          coordinates = getArcPoints(route.from, route.to)
        } else if (route.type === 'car' || route.type === 'ground_transport') {
          // Fetch real driving route from Mapbox Directions API
          try {
            const res = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${route.from[0]},${route.from[1]};${route.to[0]},${route.to[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
            )
            const data = await res.json()
            if (data.routes?.[0]?.geometry?.coordinates) {
              coordinates = data.routes[0].geometry.coordinates
            } else {
              coordinates = [route.from, route.to]
            }
          } catch {
            coordinates = [route.from, route.to]
          }
        } else {
          // Straight line for train/other
          coordinates = [route.from, route.to]
        }

        map.addSource(`route-${i}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
        })

        // Faint gold halo under flights and ground segments
        if (route.type === 'flight' || route.type === 'car' || route.type === 'ground_transport') {
          map.addLayer({
            id: `route-glow-${i}`, type: 'line', source: `route-${i}`,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': GOLD, 'line-width': 6, 'line-opacity': 0.08, 'line-blur': 3 },
          })
        }

        map.addLayer({
          id: `route-line-${i}`, type: 'line', source: `route-${i}`,
          layout: { 'line-join': 'round' },
          paint: {
            'line-color': routeColor(route.type),
            'line-width': restWidth(route),
            'line-opacity': restOpacity(route),
            'line-dasharray': route.isDashed ? [2, 1.5] : [1],
          },
        })
      }

      // Add square stop markers and store refs
      markersRef.current.clear()
      uniquePoints.forEach((point) => {
        const color = segmentColors[point.type] || segmentColors.flight
        const el = document.createElement('div')
        el.style.cssText = `width:10px;height:10px;background:${color};border:2px solid #0A0B0C;outline:1px solid ${color}55;transition:transform .2s ease, opacity .2s ease, outline-color .2s ease;`

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map)

        if (point.label) {
          const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, closeOnClick: false, className: 'rp-map-popup' })
            .setHTML(`<div class="rp-map-popup-label">${escapeHtml(point.label)}</div>`)
          marker.setPopup(popup).togglePopup()
        }

        // Store marker ref keyed by segmentId
        const existing = markersRef.current.get(point.segmentId) || []
        existing.push({ marker, element: el, color })
        markersRef.current.set(point.segmentId, existing)
      })

      // Fit bounds
      if (uniquePoints.length > 1) {
        const bounds = new mapboxgl.LngLatBounds()
        uniquePoints.forEach(p => bounds.extend([p.lng, p.lat]))
        map.fitBounds(bounds, { padding: 60, maxZoom: 8 })
      }

      // Click on empty map area → deselect
      map.on('click', (e) => {
        const routeLayerIds = routes.map((_, i) => `route-line-${i}`)
        const features = map.queryRenderedFeatures(e.point, { layers: routeLayerIds })
        if (features.length === 0) {
          onSegmentSelect?.(null)
        }
      })

      setLoaded(true)
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords, token])

  // ── Highlight effect (reacts to selection changes) ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return

    // 1. Update route line styling
    routes.forEach((route, i) => {
      const lineId = `route-line-${i}`
      const glowId = `route-glow-${i}`
      if (!map.getLayer(lineId)) return

      if (selectedSegmentId && route.segmentId !== selectedSegmentId) {
        // Dim non-selected
        map.setPaintProperty(lineId, 'line-opacity', 0.15)
        map.setPaintProperty(lineId, 'line-width', 1)
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.02)
        }
      } else if (selectedSegmentId && route.segmentId === selectedSegmentId) {
        // Highlight selected
        map.setPaintProperty(lineId, 'line-opacity', 1.0)
        map.setPaintProperty(lineId, 'line-width', route.type === 'flight' ? 3.5 : 3)
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.25)
          map.setPaintProperty(glowId, 'line-width', 10)
        }
      } else {
        // No selection — restore defaults
        map.setPaintProperty(lineId, 'line-opacity', restOpacity(route))
        map.setPaintProperty(lineId, 'line-width', restWidth(route))
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.08)
          map.setPaintProperty(glowId, 'line-width', 6)
        }
      }
    })

    // 2. Update marker styling (no pulse — nothing on the page pulses)
    markersRef.current.forEach((entries, segId) => {
      entries.forEach(({ element, color }) => {
        if (selectedSegmentId && segId !== selectedSegmentId) {
          element.style.opacity = '0.3'
          element.style.transform = 'scale(0.8)'
          element.style.outlineColor = 'transparent'
        } else if (selectedSegmentId && segId === selectedSegmentId) {
          element.style.opacity = '1'
          element.style.transform = 'scale(1.4)'
          element.style.outlineColor = '#F5F5F5'
        } else {
          element.style.opacity = '1'
          element.style.transform = 'scale(1)'
          element.style.outlineColor = `${color}55`
        }
      })
    })

    // 3. Fly/fit to selected segment
    if (selectedSegmentId) {
      const seg = segments.find(s => s.id === selectedSegmentId)
      if (seg) {
        const hasFrom = seg.from_lat != null && seg.from_lng != null
        const hasTo = seg.to_lat != null && seg.to_lng != null

        if (seg.segment_type === 'hotel' && hasFrom) {
          map.flyTo({ center: [seg.from_lng!, seg.from_lat!], zoom: 12, duration: 1200 })
        } else if (hasFrom && hasTo) {
          const bounds = new mapboxgl.LngLatBounds()
          bounds.extend([seg.from_lng!, seg.from_lat!])
          bounds.extend([seg.to_lng!, seg.to_lat!])
          map.fitBounds(bounds, { padding: 80, maxZoom: 10, duration: 1200 })
        } else if (hasFrom) {
          map.flyTo({ center: [seg.from_lng!, seg.from_lat!], zoom: 10, duration: 1200 })
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegmentId, loaded])

  if (!canMap) {
    return (
      <>
        {fallback ?? (
          <RpPending
            standalone
            aspect="wide"
            label="Map unavailable"
            name={hasCoords ? 'Itinerary below' : 'No coordinates on this itinerary'}
          />
        )}
      </>
    )
  }

  const legend = [
    { color: segmentColors.flight, label: 'Flight' },
    { color: segmentColors.hotel, label: 'Hotel' },
    { color: segmentColors.ground_transport, label: 'Ground' },
  ]

  return (
    <div className="rp-frame rp-frame--wide rp-frame--static max-h-[460px] min-h-[280px]">
      <div ref={mapContainer} className="absolute inset-0" />

      {!loaded && (
        <RpLoading label="Loading map" className="pointer-events-none absolute inset-0 h-auto border-0" />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1] flex flex-wrap items-center gap-x-4 gap-y-1.5 border border-rp-line2 bg-rp-bg px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-[2px] w-4" style={{ background: GOLD }} />
          <span className="font-display text-[10px] uppercase tracking-[.16em] text-rp-muted">Route</span>
        </span>
        {legend.map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2" style={{ backgroundColor: item.color }} />
            <span className="font-display text-[10px] uppercase tracking-[.16em] text-rp-muted">{item.label}</span>
          </span>
        ))}
      </div>

      <style jsx global>{`
        .rp-map-popup .mapboxgl-popup-content {
          background: #0A0B0C !important;
          border: 1px solid #26292C !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding: 4px 8px !important;
        }
        .rp-map-popup .mapboxgl-popup-tip {
          border-top-color: #26292C !important;
          border-bottom-color: #26292C !important;
        }
        .rp-map-popup-label {
          font-family: var(--font-display), 'Helvetica Neue', sans-serif;
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #F5F5F5;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
