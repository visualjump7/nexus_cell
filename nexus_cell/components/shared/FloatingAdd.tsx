'use client'

import { useState } from 'react'
import UniversalInput from '@/components/input/UniversalInput'

export default function FloatingAdd() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add"
        title="Add"
        className="fixed bottom-6 right-6 z-40 w-[52px] h-[52px] rounded-none bg-[#F5F5F5] text-[#0A0B0C] hover:bg-[#CDA14B] shadow-lg shadow-black/30 flex items-center justify-center active:scale-95 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      {open && <UniversalInput onClose={() => setOpen(false)} />}
    </>
  )
}
