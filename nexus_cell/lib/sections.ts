// Landing/Command Panel section config.
//
// Source of truth for the right-column section list. Adding, removing, or
// reordering rows here is the only change needed — CommandLanding renders
// directly from this array, and the (home)/@modal slot intercepts each href
// as an overlay.
//
// To add a new section:
//   1. Add a row here with id, label, href, dotColor, defaultHint
//   2. Create app/(modules)/<section>/page.tsx (the standalone full page)
//   3. Create app/(home)/@modal/(.)<section>/page.tsx (the overlay version,
//      typically the same data fetch wrapped in <SectionOverlay>)
//
// Hints/badges can be live data — pass a `metrics[id]` map to CommandLanding
// from the home page server component.

export interface SectionDef {
  id: string
  label: string
  href: string
  dotColor: string
  defaultHint?: string
}

export interface SectionMetrics {
  // hint overrides defaultHint when present
  hint?: string
  // numeric badge — falsy/zero = no badge
  badge?: number
}

export const SECTIONS: SectionDef[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', dotColor: '#2dbfa3', defaultHint: 'Overview' },
  { id: 'projects',  label: 'Projects',  href: '/projects',  dotColor: '#f59e0b', defaultHint: '—' },
  { id: 'financial', label: 'Financial', href: '/financial', dotColor: '#3b82f6', defaultHint: 'CFO sync' },
  { id: 'travel',    label: 'Travel',    href: '/travel',    dotColor: '#a855f7', defaultHint: 'Itinerary' },
  { id: 'calendar',  label: 'Calendar',  href: '/calendar',  dotColor: '#6366f1', defaultHint: 'Today' },
  { id: 'tasks',     label: 'Tasks',     href: '/tasks',     dotColor: '#22d3ee', defaultHint: 'Pipeline' },
  { id: 'alerts',    label: 'Alerts',    href: '/alerts',    dotColor: '#eab308', defaultHint: 'Action req.' },
  { id: 'lifestyle', label: 'Lifestyle', href: '/lifestyle', dotColor: '#ec4899', defaultHint: 'Personal' },
  { id: 'comms',     label: 'Comms',     href: '/comms',     dotColor: '#84cc16', defaultHint: 'Coming soon' },
]
