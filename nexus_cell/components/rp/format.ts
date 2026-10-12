// Formatting helpers for the Roaring Pines kit. No directive: safe in server
// and client code. Output is deterministic (no locale-dependent Intl date
// formatting), so server and client render the same strings.

const MINUS = '−'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function isNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function currencySymbol(currency?: string): string {
  const code = (currency || 'USD').toUpperCase()
  if (code === 'USD') return '$'
  try {
    const part = new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find(p => p.type === 'currency')
    return part?.value ?? '$'
  } catch {
    return '$'
  }
}

function groupInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function trimZero(s: string): string {
  return s.replace(/\.0$/, '')
}

/**
 * Money. `compact` → $198.6M · $4.2M · $850K · $1,250.
 * Full form: $1,250,000; cents only below $1,000 and only when present ($845.50).
 * `sign` → +$1.2M / −$184K (U+2212). Negatives always use U+2212.
 * Invalid currency codes fall back to USD. Non-numbers → '—'.
 */
export function fmtMoney(n: number | null | undefined, o: { compact?: boolean; currency?: string; sign?: boolean } = {}): string {
  if (!isNum(n)) return '—'
  const sym = currencySymbol(o.currency)
  const abs = Math.abs(n)
  let body: string
  if (o.compact) {
    if (abs >= 1e9) body = trimZero((abs / 1e9).toFixed(1)) + 'B'
    else if (abs >= 999_500) body = trimZero((abs / 1e6).toFixed(1)) + 'M'
    else if (abs >= 10_000) body = Math.round(abs / 1e3) + 'K'
    else body = groupInt(abs)
  } else {
    body = abs >= 1000 || Number.isInteger(abs) ? groupInt(abs) : abs.toFixed(2)
  }
  const prefix = n < 0 ? MINUS : o.sign && n > 0 ? '+' : ''
  return `${prefix}${sym}${body}`
}

/** $1,250,000 — no cents at or above $1,000; two decimals below when there are cents ($845.50, $850). */
export function fmtMoneyFull(n: number | null | undefined, currency?: string): string {
  return fmtMoney(n, { currency })
}

/** 0.362 → '36%'. Non-finite → '—'. */
export function fmtPct(ratio: number | null | undefined, digits = 0): string {
  if (!isNum(ratio)) return '—'
  return `${(ratio * 100).toFixed(digits)}%`
}

/** 3 → '03'. Values ≥ 100 are left as they are. */
export function pad2(n: number | string): string {
  const v = typeof n === 'number' ? Math.trunc(n) : n
  return String(v).padStart(2, '0')
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

interface Parts { y: number; m: number; d: number; wd: number; h: number; min: number }

function parts(d: string | Date | null | undefined): Parts | null {
  if (!d) return null
  if (typeof d === 'string' && DATE_ONLY.test(d)) {
    const [y, m, day] = d.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, day))
    return { y, m: m - 1, d: day, wd: dt.getUTCDay(), h: 0, min: 0 }
  }
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), wd: dt.getDay(), h: dt.getHours(), min: dt.getMinutes() }
}

/**
 * '12 Oct' (short) · '12 Oct 2026' (medium, default) · '12 October 2026' (long)
 * · 'Monday 12 October' (weekday). 'YYYY-MM-DD' strings are read as calendar
 * dates (no time-zone shift). Invalid → '—'.
 */
export function fmtDate(d: string | Date | null | undefined, style: 'short' | 'medium' | 'long' | 'weekday' = 'medium'): string {
  const p = parts(d)
  if (!p) return '—'
  switch (style) {
    case 'short': return `${p.d} ${MONTHS_SHORT[p.m]}`
    case 'long': return `${p.d} ${MONTHS[p.m]} ${p.y}`
    case 'weekday': return `${WEEKDAYS[p.wd]} ${p.d} ${MONTHS[p.m]}`
    default: return `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}`
  }
}

/** '28 Sep → 30 Sep 2026'; across years '28 Dec 2026 → 3 Jan 2027'; one day → '28 Sep 2026'. */
export function fmtRange(a: string | Date | null | undefined, b?: string | Date | null): string {
  const pa = parts(a)
  const pb = parts(b)
  if (!pa && !pb) return '—'
  if (!pa) return fmtDate(b, 'medium')
  if (!pb) return fmtDate(a, 'medium')
  if (pa.y === pb.y && pa.m === pb.m && pa.d === pb.d) return fmtDate(a, 'medium')
  if (pa.y === pb.y) return `${pa.d} ${MONTHS_SHORT[pa.m]} → ${pb.d} ${MONTHS_SHORT[pb.m]} ${pb.y}`
  return `${fmtDate(a, 'medium')} → ${fmtDate(b, 'medium')}`
}

/** '09:30' (24-hour, local). Date-only strings and invalid input → ''. */
export function fmtTime(iso: string | Date | null | undefined): string {
  if (!iso || (typeof iso === 'string' && DATE_ONLY.test(iso))) return ''
  const p = parts(iso)
  if (!p) return ''
  return `${pad2(p.h)}:${pad2(p.min)}`
}

/** 'just now' · '5m ago' · '3h ago' · '2d ago' · then '12 Oct'. */
export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const t = (iso instanceof Date ? iso : new Date(iso)).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = Date.now() - t
  if (diff < 0) return fmtDate(iso, 'short')
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso, 'short')
}

/** Whole calendar days from today to `date` (negative when past). NaN for invalid input. */
export function daysUntil(date: string | Date | null | undefined): number {
  const p = parts(date)
  if (!p) return NaN
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const target = Date.UTC(p.y, p.m, p.d)
  return Math.round((target - today) / 86400000)
}

/** Joins parts with ' · ', dropping null, undefined, false, NaN and empty strings. */
export function dot(...items: (string | number | null | undefined | false)[]): string {
  return items
    .filter(x => x !== null && x !== undefined && x !== false && x !== '' && !(typeof x === 'number' && Number.isNaN(x)))
    .join(' · ')
}
