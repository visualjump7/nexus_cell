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
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-xl shadow-black/30 border-l-[3px] animate-fade-in-up ${
              t.type === 'success'
                ? 'bg-[#0f1117] border-l-emerald-400'
                : 'bg-[#0f1117] border-l-red-400'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
