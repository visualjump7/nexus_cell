// Tone → colour / class maps shared by tags, meters, stats and rows.
import type { RpTone } from './types'

export const TONE_COLOR: Record<RpTone, string> = {
  neutral: '#9AA0A4',
  gold: '#CDA14B',
  green: '#A4CC5C',
  blue: '#3989CB',
  alert: '#C8553D',
  dim: '#6E7578',
}

/** Text colour utility per tone (Tailwind classes, kept literal for the JIT). */
export const TONE_TEXT: Record<RpTone, string> = {
  neutral: 'text-rp-text',
  gold: 'text-rp-gold',
  green: 'text-rp-green',
  blue: 'text-rp-blue',
  alert: 'text-rp-alert',
  dim: 'text-rp-dim',
}
