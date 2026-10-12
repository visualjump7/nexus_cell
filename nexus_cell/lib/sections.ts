// Section config: the app's numbered navigation (sidebar, top bar, footer nav,
// hamburger sheet) and the Overview's section index.
//
// SECTIONS (02–11) is what CommandLanding renders and what the (home)/@modal
// slot intercepts as overlays. NAV adds 01 Overview in front for the shell.
//
// To add a new section:
//   1. Add a row here with id, num, label, href, dotColor, defaultHint, line
//   2. Create app/(modules)/<section>/page.tsx (the standalone full page)
//   3. Optionally create app/(home)/@modal/(.)<section>/page.tsx (overlay)
//
// Hints/badges can be live data — pass a `metrics[id]` map to CommandLanding
// from the home page server component.

export type SectionId =
  | 'overview'
  | 'dashboard'
  | 'projects'
  | 'site-map'
  | 'financial'
  | 'brief'
  | 'calendar'
  | 'tasks'
  | 'alerts'
  | 'travel'
  | 'comms'

export interface SectionDef {
  id: SectionId
  /** Two-digit, zero-padded index: '01' … '11'. */
  num: string
  label: string
  href: string
  dotColor: string
  defaultHint?: string
  /** The one declarative line used under titles and on section cards. */
  line: string
  /** Optional flag shown beside the nav label, e.g. 'Soon'. */
  flag?: string
}

export interface SectionMetrics {
  // hint overrides defaultHint when present
  hint?: string
  // numeric badge — falsy/zero = no badge
  badge?: number
}

export const OVERVIEW: SectionDef = {
  id: 'overview',
  num: '01',
  label: 'Overview',
  href: '/',
  dotColor: '#CDA14B',
  defaultHint: 'Today',
  line: 'What needs you today.',
}

export const SECTIONS: SectionDef[] = [
  { id: 'dashboard', num: '02', label: 'Dashboard', href: '/dashboard', dotColor: '#CDA14B', defaultHint: 'Where it stands', line: 'Where the build stands today.' },
  { id: 'projects',  num: '03', label: 'Projects',  href: '/projects',  dotColor: '#CDA14B', defaultHint: 'The build',       line: 'Fifty packages, budget and spend.' },
  { id: 'site-map',  num: '04', label: 'Site map',  href: '/site-map',  dotColor: '#9AA0A4', defaultHint: '443 acres',       line: 'The whole property, zone by zone.' },
  { id: 'financial', num: '05', label: 'Financial', href: '/financial', dotColor: '#3989CB', defaultHint: 'Draws & bills',   line: "Draws, payables and what's due." },
  { id: 'brief',     num: '06', label: 'Briefs',    href: '/brief',     dotColor: '#CDA14B', defaultHint: "Owner's brief",   line: "The weekly owner's brief." },
  { id: 'calendar',  num: '07', label: 'Calendar',  href: '/calendar',  dotColor: '#A4CC5C', defaultHint: 'Today',           line: 'Site meetings, inspections and track days.' },
  { id: 'tasks',     num: '08', label: 'Tasks',     href: '/tasks',     dotColor: '#A4CC5C', defaultHint: 'Punch list',      line: 'The punch list and who owns it.' },
  { id: 'alerts',    num: '09', label: 'Alerts',    href: '/alerts',    dotColor: '#E0BF7B', defaultHint: 'Sign-offs',       line: 'Sign-offs and site issues.' },
  { id: 'travel',    num: '10', label: 'Travel',    href: '/travel',    dotColor: '#3989CB', defaultHint: 'Site visits',     line: 'Site visits and trips to Palatka.' },
  { id: 'comms',     num: '11', label: 'Comms',     href: '/comms',     dotColor: '#6E7578', defaultHint: 'Coming soon',     line: 'Messaging, on the way.', flag: 'Soon' },
]

/** Overview + every section, in nav order (01–11). */
export const NAV: SectionDef[] = [OVERVIEW, ...SECTIONS]

/**
 * The section a pathname belongs to: the longest matching href prefix.
 * '/' only matches exactly, so '/projects/123' resolves to Projects.
 */
export function sectionFor(pathname: string): SectionDef | undefined {
  if (!pathname) return undefined
  const path = pathname.split(/[?#]/)[0] || '/'
  let best: SectionDef | undefined
  for (const s of NAV) {
    const hit = s.href === '/'
      ? path === '/'
      : path === s.href || path.startsWith(s.href + '/')
    if (hit && (!best || s.href.length > best.href.length)) best = s
  }
  return best
}

/** '03 · Projects' or, with a suffix, '03 · Projects · Budget'. */
export function sectionEyebrow(id: SectionId, suffix?: string): string {
  const s = NAV.find(x => x.id === id)
  if (!s) return suffix ?? ''
  return [s.num, s.label, suffix].filter(Boolean).join(' · ')
}
