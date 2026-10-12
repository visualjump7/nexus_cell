import type { RpNavItem } from './types'

function matches(prefix: string, path: string): boolean {
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : prefix + '/')
}

/** Index of the current nav item: the longest href/match prefix of the path ('/' only exact). -1 when none. */
export function activeNavIndex(items: RpNavItem[], pathname: string | null | undefined): number {
  const path = (pathname || '/').split(/[?#]/)[0] || '/'
  let best = -1
  let bestLen = -1
  items.forEach((it, i) => {
    for (const p of [it.href, ...(it.match ?? [])]) {
      if (matches(p, path) && p.length > bestLen) {
        best = i
        bestLen = p.length
      }
    }
  })
  return best
}
