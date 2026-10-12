import { cn } from '@/lib/utils'
import type { RpTone } from './types'
import { TONE_COLOR } from './tones'

export interface RpMeterProps {
  /** 0..1. Values above 1 fill the bar and force the alert tone. */
  value: number
  /** Default gold (spend). Blue = scheduled / forecast / upload progress, green = complete / paid. */
  tone?: RpTone
  /** Track height in px. Default 3. */
  size?: 2 | 3 | 4
  /** 0..1 position of a 1px tick, e.g. "expected by schedule". */
  marker?: number
  /** Accessible label. */
  label?: string
  className?: string
}

/** Square-ended progress bar on a #1F1F1F track. Server-safe. */
export function RpMeter({ value, tone = 'gold', size = 3, marker, label, className }: RpMeterProps) {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0
  const over = v > 1
  const fill = Math.min(1, v)
  const color = TONE_COLOR[over ? 'alert' : tone]
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('rp-meter', className)}
      style={{ height: size }}
    >
      <span style={{ width: `${fill * 100}%`, background: color }} />
      {marker != null && Number.isFinite(marker) && (
        <i aria-hidden className="rp-meter-marker" style={{ left: `${Math.min(1, Math.max(0, marker)) * 100}%` }} />
      )}
    </div>
  )
}
