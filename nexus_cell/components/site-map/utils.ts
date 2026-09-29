import {
  ZONES,
  zoneForLocation,
  isPinned,
  pctSpent,
  STATUS_META,
  type SiteProject,
  type ZoneDef,
} from '@/lib/site-map'

export type LayerKey = 'plan' | 'boundary' | 'track' | 'zones' | 'pins'

export const LAYER_LABELS: Record<LayerKey, string> = {
  plan: 'Master plan',
  boundary: 'Site boundary',
  track: 'Road & street course',
  zones: 'Zones · % spent',
  pins: 'Project pins',
}

export interface ZoneStat {
  zone: ZoneDef
  projects: SiteProject[]
  budgeted: number
  actual: number
  pct: number
}

export interface PinSpec {
  project: SiteProject
  lng: number
  lat: number
  /** Pixel offset for pins that share coordinates. */
  offset: [number, number]
  size: number
  color: string
}

export function zoneStats(projects: SiteProject[]): ZoneStat[] {
  return ZONES.map(zone => {
    const ps = projects.filter(p => zoneForLocation(p.location)?.id === zone.id)
    const budgeted = ps.reduce((s, p) => s + p.budgeted, 0)
    const actual = ps.reduce((s, p) => s + p.actual, 0)
    return { zone, projects: ps, budgeted, actual, pct: pctSpent(budgeted, actual) }
  })
}

// Dim steel → RP gold by share of budget spent. Zones with no projects stay dim.
const DIM = [0x1c, 0x1e, 0x21]
const GOLD = [0xcd, 0xa1, 0x4b]
export function zoneColor(pct: number, hasProjects = true): string {
  if (!hasProjects) return '#1F2225'
  const t = Math.max(0, Math.min(1, pct / 100))
  // slight ease-out so low percentages still read warmer than none
  const k = Math.pow(t, 0.8)
  const c = DIM.map((d, i) => Math.round(d + (GOLD[i] - d) * k))
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export function pinSize(budgeted: number, maxBudget: number): number {
  if (maxBudget <= 0) return 12
  return Math.round(10 + 16 * Math.sqrt(Math.max(0, budgeted) / maxBudget))
}

export function buildPins(projects: SiteProject[]): PinSpec[] {
  const pinned = projects.filter(isPinned)
  const maxBudget = Math.max(0, ...pinned.map(p => p.budgeted))
  const groups = new Map<string, SiteProject[]>()
  for (const p of pinned) {
    const key = `${p.latitude!.toFixed(4)},${p.longitude!.toFixed(4)}`
    const g = groups.get(key) || []
    g.push(p)
    groups.set(key, g)
  }
  const pins: PinSpec[] = []
  groups.forEach(g => {
    g.forEach((p, i) => {
      let offset: [number, number] = [0, 0]
      if (g.length > 1) {
        const r = 9 + g.length * 1.5
        const a = (2 * Math.PI * i) / g.length - Math.PI / 2
        offset = [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)]
      }
      pins.push({
        project: p,
        lng: p.longitude!,
        lat: p.latitude!,
        offset,
        size: pinSize(p.budgeted, maxBudget),
        color: STATUS_META[p.status]?.color || '#9AA0A4',
      })
    })
  })
  // Big pins first so small ones stay clickable on top.
  return pins.sort((a, b) => b.size - a.size)
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
