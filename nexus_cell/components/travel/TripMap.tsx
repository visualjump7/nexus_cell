'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { TripSegment } from '@/lib/types'
import { segmentColors } from '@/lib/travel-constants'

interface Props {
  segments: TripSegment[]
  selectedSegmentId?: string | null
  onSegmentSelect?: (id: string | null) => void
}

function getArcPoints(from: [number, number], to: [number, number], numPoints = 50): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    points.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t])
  }
  return points
}

export default function TripMap({ segments, selectedSegmentId, onSegmentSelect }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement; color: string }[]>>(new Map())
  const [loaded, setLoaded] = useState(false)

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
      routes.push({ from: [seg.from_lng, seg.from_lat], to: [seg.to_lng, seg.to_lat], type: seg.segment_type, isDashed: seg.sort_order > 2, segmentId: seg.id })
    }
  }

  const uniquePoints = points.filter((p, i) =>
    points.findIndex(q => Math.abs(q.lat - p.lat) < 0.01 && Math.abs(q.lng - p.lng) < 0.01) === i
  )

  const hasCoords = uniquePoints.length > 0

  // ── Map initialization (runs once) ──
  useEffect(() => {
    if (!mapContainer.current || !hasCoords || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [uniquePoints[0].lng, uniquePoints[0].lat],
      zoom: 4,
      attributionControl: false,
      interactive: true,
    })

    mapRef.current = map

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

        // Glow layer for flights and ground segments
        if (route.type === 'flight' || route.type === 'car' || route.type === 'ground_transport') {
          map.addLayer({
            id: `route-glow-${i}`, type: 'line', source: `route-${i}`,
            paint: { 'line-color': segmentColors[route.type] || '#94a3b8', 'line-width': 6, 'line-opacity': 0.08 },
          })
        }

        const isGround = route.type === 'car' || route.type === 'ground_transport'
        map.addLayer({
          id: `route-line-${i}`, type: 'line', source: `route-${i}`,
          paint: {
            'line-color': segmentColors[route.type] || '#94a3b8',
            'line-width': isGround ? 2.5 : (route.type === 'flight' ? 2 : 1.5),
            'line-opacity': route.isDashed ? 0.3 : 0.6,
            'line-dasharray': route.isDashed ? [4, 4] : [1],
          },
        })
      }

      // Add markers and store refs
      markersRef.current.clear()
      uniquePoints.forEach((point) => {
        const color = segmentColors[point.type] || '#94a3b8'
        const el = document.createElement('div')
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #08090f;box-shadow:0 0 8px ${color}60;transition:all 0.3s ease;`

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map)

        if (point.label) {
          const popup = new mapboxgl.Popup({ offset: 12, closeButton: false, closeOnClick: false, className: 'nexus-popup' })
            .setHTML(`<div style="font-size:11px;color:#e2e8f0;font-family:sans-serif;padding:2px 4px">${point.label}</div>`)
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
  }, [hasCoords])

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
        map.setPaintProperty(lineId, 'line-opacity', 0.1)
        map.setPaintProperty(lineId, 'line-width', 1)
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.02)
        }
      } else if (selectedSegmentId && route.segmentId === selectedSegmentId) {
        // Highlight selected
        map.setPaintProperty(lineId, 'line-opacity', 1.0)
        map.setPaintProperty(lineId, 'line-width', route.type === 'flight' ? 3.5 : 3)
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.35)
          map.setPaintProperty(glowId, 'line-width', 12)
        }
      } else {
        // No selection — restore defaults
        map.setPaintProperty(lineId, 'line-opacity', route.isDashed ? 0.3 : 0.6)
        map.setPaintProperty(lineId, 'line-width', route.type === 'flight' ? 2 : 1.5)
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, 'line-opacity', 0.1)
          map.setPaintProperty(glowId, 'line-width', 6)
        }
      }
    })

    // 2. Update marker styling
    markersRef.current.forEach((entries, segId) => {
      entries.forEach(({ element, color }) => {
        if (selectedSegmentId && segId !== selectedSegmentId) {
          element.style.opacity = '0.3'
          element.style.transform = 'scale(0.8)'
          element.style.boxShadow = 'none'
          element.style.animation = 'none'
        } else if (selectedSegmentId && segId === selectedSegmentId) {
          element.style.opacity = '1'
          element.style.transform = 'scale(1.5)'
          element.style.boxShadow = `0 0 16px ${color}, 0 0 32px ${color}60`
          element.style.animation = 'marker-pulse 1.5s ease-in-out infinite'
        } else {
          element.style.opacity = '1'
          element.style.transform = 'scale(1)'
          element.style.boxShadow = `0 0 8px ${color}60`
          element.style.animation = 'none'
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

  if (!hasCoords) {
    return (
      <div className="w-full h-[300px] bg-[#0f1117] rounded-xl flex items-center justify-center mb-6">
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-xs text-gray-600">No coordinates available for map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-6">
      <div ref={mapContainer} className="w-full h-[350px] md:h-[400px]" />

      {!loaded && (
        <div className="absolute inset-0 bg-[#0f1117] flex items-center justify-center rounded-xl pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#5eead4] rounded-full animate-pulse" />
            <p className="text-xs text-gray-500">Loading map...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-[#08090f]/80 backdrop-blur-sm rounded-lg px-3 py-2 flex gap-3 pointer-events-none">
        {[
          { color: '#5eead4', label: 'Flight' },
          { color: '#a78bfa', label: 'Hotel' },
          { color: '#fb923c', label: 'Ground' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .mapboxgl-popup-content {
          background: #141520 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: #141520 !important;
        }
        @keyframes marker-pulse {
          0%, 100% { transform: scale(1.5); }
          50% { transform: scale(1.8); }
        }
      `}</style>
    </div>
  )
}
