'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface RpFieldProps {
  label: string
  /** id of the control (links the label). */
  htmlFor?: string
  /** 12px dim help text. */
  hint?: React.ReactNode
  /** 13px gold error text (pair with `invalid` on the control). */
  error?: React.ReactNode
  required?: boolean
  children: React.ReactNode
  className?: string
}

/** Label (Oswald 11 uppercase muted) + control + hint/error. */
export function RpField({ label, htmlFor, hint, error, required, children, className }: RpFieldProps) {
  return (
    <div className={cn('rp-field', className)}>
      <label htmlFor={htmlFor} className="rp-label">
        {label}
        {required && <span aria-hidden className="ml-1 text-rp-dim">*</span>}
      </label>
      {children}
      {error ? <p className="rp-error" role="alert">{error}</p> : hint ? <p className="rp-hint">{hint}</p> : null}
    </div>
  )
}

export interface RpInputProps extends React.InputHTMLAttributes<HTMLInputElement> { invalid?: boolean }

/** 44px square input on the panel ground; blue focus border; gold when invalid. */
export const RpInput = forwardRef<HTMLInputElement, RpInputProps>(function RpInput({ invalid, className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={cn('rp-input', className)} aria-invalid={invalid ? true : rest['aria-invalid']} />
})

export interface RpSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { invalid?: boolean }

/** Square select with a stroke chevron. */
export const RpSelect = forwardRef<HTMLSelectElement, RpSelectProps>(function RpSelect({ invalid, className, ...rest }, ref) {
  return <select ref={ref} {...rest} className={cn('rp-select', className)} aria-invalid={invalid ? true : rest['aria-invalid']} />
})

export interface RpTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean }

/** Square textarea, min 112px, vertical resize. */
export const RpTextarea = forwardRef<HTMLTextAreaElement, RpTextareaProps>(function RpTextarea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={cn('rp-textarea', className)} aria-invalid={invalid ? true : rest['aria-invalid']} />
})

export interface RpCheckProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  disabled?: boolean
  id?: string
  className?: string
}

/** 16px square checkbox (gold when checked) with a label. */
export function RpCheck({ checked, onChange, label, disabled, id, className }: RpCheckProps) {
  return (
    <label className={cn('rp-check-row', disabled && 'rp-check-row--disabled', className)}>
      <input
        id={id}
        type="checkbox"
        className="rp-check"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

/** Field grid: one column, two from 640px. Use className="sm:col-span-2" on a full-width child. */
export function RpFormGrid({ children, cols = 2, className }: { children: React.ReactNode; cols?: 1 | 2; className?: string }) {
  return <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', className)}>{children}</div>
}
