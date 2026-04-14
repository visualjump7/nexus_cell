'use client'

import { useState } from 'react'
import UniversalInput from '@/components/input/UniversalInput'

export default function FloatingAdd() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0d9488] text-white shadow-lg shadow-black/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      {open && <UniversalInput onClose={() => setOpen(false)} />}
    </>
  )
}
