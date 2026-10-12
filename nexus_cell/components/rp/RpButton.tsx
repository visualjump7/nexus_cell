import { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type RpButtonVariant = 'solid' | 'ghost' | 'text' | 'back' | 'danger' | 'icon'

const VARIANT: Record<RpButtonVariant, string> = {
  solid: 'rp-btn-solid',
  ghost: 'rp-btn-ghost',
  text: 'rp-btn-text',
  back: 'rp-btn-back',
  danger: 'rp-btn-danger',
  icon: 'rp-btn-icon',
}

export interface RpButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** solid (white → gold), ghost (outlined), text (→ links), back (← muted), danger (alert outline), icon (38px square; needs aria-label). */
  variant?: RpButtonVariant
  size?: 'md' | 'sm'
  /** Renders a next/link instead of a button. */
  href?: string
  /** Leading icon (16px lucide, strokeWidth 1.5). */
  icon?: React.ReactNode
  /** Appends ' →'. */
  arrow?: boolean
  /** Link target (with href). */
  target?: string
  rel?: string
}

/** Kit button. Server-safe (no hooks); onClick needs a client caller. */
export const RpButton = forwardRef<HTMLButtonElement, RpButtonProps>(function RpButton(
  { variant = 'solid', size = 'md', href, icon, arrow, className, children, type, target, rel, ...rest },
  ref,
) {
  const cls = cn(VARIANT[variant], size === 'sm' && 'rp-btn--sm', className)
  const content = (
    <>
      {variant === 'back' && <span aria-hidden>←</span>}
      {icon}
      {children}
      {arrow && <span aria-hidden>→</span>}
    </>
  )
  if (href) {
    const { 'aria-label': ariaLabel, title, id, onClick } = rest
    return (
      <Link
        href={href}
        className={cls}
        aria-label={ariaLabel}
        title={title}
        id={id}
        target={target}
        rel={rel}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {content}
      </Link>
    )
  }
  return (
    <button ref={ref} type={type ?? 'button'} className={cls} {...rest}>
      {content}
    </button>
  )
})
