// Site Map constants: the Roaring Pines site, the master plan overlay and the
// hand-drawn geometry (boundary, circuits, zones) shown on /site-map.
//
// All geometry below is drawn in PLAN UNITS: pixel positions on the master
// plan image scaled to a 2000 × 1333 grid (the JPEG is 2400 × 1600). They are
// projected to lng/lat through MASTERPLAN_CORNERS, so recalibrating the four
// corners moves the overlay, the boundary, the circuits and the zones together.
// The same plan units drive the no-token fallback (an SVG over the plan image).

export const SITE = {
  name: 'Roaring Pines Motor Club',
  address: 'State Road 100 · Palatka–Kay Larkin Airport',
  place: 'Palatka, Putnam County, FL',
  acres: 443,
  center: [-81.701, 29.6468] as [number, number],
  zoom: 15,
  pitch: 45,
}

export const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

// The map can't be panned beyond the site plus Palatka–Kay Larkin Airport.
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-81.742, 29.618], // SW
  [-81.664, 29.676], // NE
]

export const MASTERPLAN_IMAGE = '/demo/plans/masterplan-v5.jpg'
export const PLAN_W = 2000
export const PLAN_H = 1333

// ── Master plan corners ─────────────────────────────────────────────────────
// APPROXIMATE, NOT SURVEYED. Order: top-left, top-right, bottom-right,
// bottom-left, as [lng, lat] (the order Mapbox image sources expect).
//
// Estimated so the plan sits around the site center with the SR 100 frontage,
// the Seminole Electric easement and the airport side to the west, and so the
// project coordinates in the demo data land on the matching plan areas (pit
// straight on the garage row, esses on the east loop, SW entry on the gate).
// The demo coordinates spread wider than 443 acres, so the plan is drawn a
// little larger than true scale. The right-hand ~11% of the sheet is the
// title block. To calibrate: pick two plan features you can see on the
// satellite (the SR 100 entry and the east esses work well) and adjust these
// four values until they line up. Everything in plan units follows.
export const MASTERPLAN_CORNERS: [[number, number], [number, number], [number, number], [number, number]] = [
  [-81.716, 29.6592], // top-left
  [-81.6807, 29.6592], // top-right
  [-81.6807, 29.6352], // bottom-right
  [-81.716, 29.6352], // bottom-left
]

export type PlanPoint = [number, number]

/** Plan units → [lng, lat], bilinear across the four corners (works if the corners are later rotated). */
export function planToLngLat([x, y]: PlanPoint): [number, number] {
  const u = x / PLAN_W
  const v = y / PLAN_H
  const [tl, tr, br, bl] = MASTERPLAN_CORNERS
  const topLng = tl[0] + (tr[0] - tl[0]) * u
  const topLat = tl[1] + (tr[1] - tl[1]) * u
  const botLng = bl[0] + (br[0] - bl[0]) * u
  const botLat = bl[1] + (br[1] - bl[1]) * u
  return [topLng + (botLng - topLng) * v, topLat + (botLat - topLat) * v]
}

/** [lng, lat] → plan units by linear interpolation between the corners (north-up plan). */
export function lngLatToPlan(lng: number, lat: number): PlanPoint {
  const [tl, tr, , bl] = MASTERPLAN_CORNERS
  const u = (lng - tl[0]) / (tr[0] - tl[0])
  const v = (tl[1] - lat) / (tl[1] - bl[1])
  return [u * PLAN_W, v * PLAN_H]
}

// ── Geometry (plan units) ──────────────────────────────────────────────────

// Site boundary. Follows the plan's dashed property line on the west and
// south, and is pushed out on the north-east to take in the boardwalk and the
// eastern lakefront parcels where the project data puts them.
export const SITE_BOUNDARY: PlanPoint[] = [
  [205, 40], [720, 40], [1010, 150], [1540, 195], [1685, 470], [1705, 815],
  [1705, 1180], [740, 1308], [205, 1312],
]

// 2.75-mile road course (closed loop, south half): pit straight along the
// west garage row, east esses and banked turns, back along the south loop.
export const ROAD_COURSE: PlanPoint[] = [
  [420, 835], [760, 830], [1000, 820], [1290, 815], [1400, 828], [1455, 868],
  [1435, 915], [1475, 955], [1480, 1025], [1420, 1080], [1320, 1100], [1200, 1110],
  [1100, 1085], [1030, 1050], [970, 1055], [925, 1105], [830, 1140], [620, 1148],
  [470, 1128], [425, 1065], [410, 955],
]

// 0.76-mile street course inside the west infield, sharing the pit straight.
export const STREET_COURSE: PlanPoint[] = [
  [480, 870], [715, 866], [740, 898], [705, 926], [575, 930], [530, 972],
  [482, 968], [462, 922],
]

export interface ZoneDef {
  id: string
  name: string
  /** Short label for panel headers, e.g. "Road Course". */
  short: string
  /** Exact `projects.location` values that belong to this zone. */
  locations: string[]
  polygon: PlanPoint[]
}

export const ZONES: ZoneDef[] = [
  { id: 'road-south', name: 'Road Course · South Loop', short: 'South Loop', locations: ['Road Course · South Loop'],
    polygon: [[770, 1000], [960, 975], [1130, 1000], [1330, 1050], [1330, 1200], [770, 1215]] },
  { id: 'east-esses', name: 'East Esses & Banked Turns', short: 'East Esses', locations: ['Road Course · East Esses & Banked Turns'],
    polygon: [[1330, 815], [1700, 815], [1700, 1180], [1330, 1200], [1330, 1050], [1290, 960]] },
  { id: 'pit-west', name: 'Pit Straight · Paddock (West)', short: 'Pit Straight', locations: ['Pit Straight · Paddock (West)'],
    polygon: [[390, 760], [770, 755], [770, 850], [390, 855]] },
  { id: 'infield', name: 'Circuit Infield · Training Pads', short: 'Infield', locations: ['Circuit Infield · Training Pads'],
    polygon: [[770, 850], [1290, 835], [1290, 960], [1130, 1000], [960, 975], [770, 990]] },
  { id: 'grandstands', name: 'Grandstands', short: 'Grandstands', locations: ['Grandstands · North Pit & South Straight'],
    polygon: [[575, 925], [770, 915], [770, 990], [575, 1000]] },
  { id: 'clubhouse', name: 'North Lakes · Clubhouse Parcel', short: 'Clubhouse', locations: ['North Lakes · Clubhouse Parcel'],
    polygon: [[770, 195], [1030, 215], [1040, 330], [770, 325]] },
  { id: 'lakes', name: 'Northern & Central Lakes', short: 'Lakes', locations: ['Northern & Central Lakes'],
    polygon: [[570, 330], [1040, 335], [1070, 520], [960, 540], [700, 540], [570, 430]] },
  { id: 'garage-arc', name: 'Central Lake · Garage Arc', short: 'Garage Arc', locations: ['Central Lake · Garage Arc'],
    polygon: [[700, 545], [960, 545], [975, 650], [700, 700]] },
  { id: 'nw-garage', name: 'Northwest Garage Cluster', short: 'NW Garages', locations: ['Northwest Garage Cluster'],
    polygon: [[310, 330], [565, 330], [565, 430], [690, 540], [560, 580], [310, 590]] },
  { id: 'east-lakefront', name: 'Eastern Lakefront Parcels', short: 'Lakefront', locations: ['Eastern Lakefront Parcels'],
    polygon: [[1440, 430], [1650, 430], [1690, 650], [1450, 650]] },
  { id: 'ne-shore', name: 'Northeast Shore · Boardwalk', short: 'Boardwalk', locations: ['Northeast Shore · Boardwalk'],
    polygon: [[1240, 210], [1520, 235], [1560, 380], [1250, 380]] },
  { id: 'sw-entry', name: 'SW Entry · SR 100 Frontage', short: 'SW Entry', locations: ['SW Entry · SR 100 Frontage'],
    polygon: [[210, 1172], [380, 1175], [380, 1300], [210, 1305]] },
  { id: 'service', name: 'Service Compound', short: 'Service', locations: ['Service Compound · Fuel & Vehicle Service'],
    polygon: [[400, 1015], [530, 1010], [535, 1100], [405, 1105]] },
  { id: 'west-parking', name: 'West Event Parking & Seminole Electric Easement', short: 'West Parking', locations: ['West Event Parking & Seminole Electric Easement'],
    polygon: [[210, 600], [305, 600], [305, 1095], [210, 1095]] },
  { id: 'field-office', name: 'Owner Field Office · SW Compound', short: 'Field Office', locations: ['Owner Field Office · SW Compound'],
    polygon: [[265, 1100], [380, 1100], [380, 1172], [265, 1172]] },
]

/** Zone for a project location: exact match first, then a loose prefix match. */
export function zoneForLocation(location: string | null | undefined): ZoneDef | null {
  if (!location) return null
  const exact = ZONES.find(z => z.locations.includes(location))
  if (exact) return exact
  const loc = location.toLowerCase()
  return ZONES.find(z => loc.startsWith(z.name.toLowerCase()) || z.name.toLowerCase().startsWith(loc)) || null
}

// Soft costs and sitewide packages: listed in the panel, never pinned.
export const UNPINNED_LOCATIONS = ['Sitewide', 'Owner Field Office · SW Compound']

export function isPinned(p: { location: string | null; latitude: number | null; longitude: number | null }): boolean {
  if (p.latitude == null || p.longitude == null) return false
  return !UNPINNED_LOCATIONS.includes(p.location || '')
}

// ── Data passed from the server page to the client map ──────────────────────

export type SiteProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'

export interface SiteProject {
  id: string
  name: string
  project_type: string | null
  status: SiteProjectStatus
  location: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  budgeted: number
  actual: number
  /** Alerts with related_type='project' pointing at this project, status open or acknowledged. */
  activeAlerts: number
  /** Open task count. Null: tasks carry no project link in the schema. */
  openTasks: number | null
}

export const STATUS_META: Record<SiteProjectStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#CDA14B' },
  completed: { label: 'Completed', color: '#A4CC5C' },
  on_hold: { label: 'On hold', color: '#3989CB' },
  archived: { label: 'Archived', color: '#6E7578' },
}

export function pctSpent(budgeted: number, actual: number): number {
  return budgeted > 0 ? (actual / budgeted) * 100 : 0
}

/** Compact dollars: $36M, $4.2M, $850K. */
export function formatMoneyShort(n: number): string {
  const a = Math.abs(n)
  if (a >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (a >= 1e6) return `$${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`
  if (a >= 1e3) return `$${Math.round(n / 1e3)}K`
  return `$${Math.round(n)}`
}
