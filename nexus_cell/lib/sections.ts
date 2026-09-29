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
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', dotColor: '#CDA14B', defaultHint: 'Overview' },
  { id: 'projects',  label: 'Projects',  href: '/projects',  dotColor: '#CDA14B', defaultHint: 'The build' },
  { id: 'financial', label: 'Financial', href: '/financial', dotColor: '#3989CB', defaultHint: 'Draws & bills' },
  { id: 'travel',    label: 'Travel',    href: '/travel',    dotColor: '#3989CB', defaultHint: 'Site visits' },
  { id: 'calendar',  label: 'Calendar',  href: '/calendar',  dotColor: '#A4CC5C', defaultHint: 'Today' },
  { id: 'tasks',     label: 'Tasks',     href: '/tasks',     dotColor: '#A4CC5C', defaultHint: 'Punch list' },
  { id: 'alerts',    label: 'Alerts',    href: '/alerts',    dotColor: '#E0BF7B', defaultHint: 'Action req.' },
  { id: 'site-map',  label: 'Site Map',  href: '/site-map',  dotColor: '#9AA0A4', defaultHint: '443 acres' },
  { id: 'comms',     label: 'Comms',     href: '/comms',     dotColor: '#6E7578', defaultHint: 'Coming soon' },
]
