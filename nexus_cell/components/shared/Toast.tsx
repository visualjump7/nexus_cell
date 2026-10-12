'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastCtx {
  toast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toasts: bottom-centre, square, a 2px edge in the outcome colour. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="rp-fade pointer-events-auto flex items-baseline gap-3 border border-rp-line2 bg-rp-bg px-4 py-3"
            style={{ boxShadow: `inset 2px 0 0 ${t.type === 'success' ? '#A4CC5C' : '#C8553D'}` }}
          >
            <span
              className={`shrink-0 font-display text-[11px] uppercase tracking-[.16em] ${t.type === 'success' ? 'text-rp-green' : 'text-rp-alert'}`}
            >
              {t.type === 'success' ? 'Saved' : 'Error'}
            </span>
            <span className="min-w-0 text-sm leading-snug text-rp-text">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
