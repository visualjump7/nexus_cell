import { cn } from '@/lib/utils'

export interface RpChipItem { id: string; num?: string; label: string }

export interface RpChipsProps {
  items: RpChipItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
  className?: string
}

/** Entity picker: boxed chips with a number and a name; pressed = gold border, surface fill, gold number.
 *  No hooks — use it from a client component (it takes onChange). */
export function RpChips({ items, value, onChange, ariaLabel, className }: RpChipsProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('rp-chips', className)}>
      {items.map(it => (
        <button
          key={it.id}
          type="button"
          className="rp-chip"
          aria-pressed={it.id === value}
          onClick={() => { if (it.id !== value) onChange(it.id) }}
        >
          {it.num && <span className="rp-chip-num">{it.num}</span>}
          <span className="rp-chip-name">{it.label}</span>
        </button>
      ))}
    </div>
  )
}
