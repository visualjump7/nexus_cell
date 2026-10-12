'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import UniversalInput from '@/components/input/UniversalInput'

/**
 * 52px square solid button (white → gold) that opens UniversalInput. Below
 * 1024px only: at ≥1024 the sidebar footer carries "+ Create" instead, so the
 * button never sits over right-aligned figures and row actions.
 */
export default function FloatingAdd() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create"
        title="Create"
        className="fixed bottom-6 right-6 z-40 flex h-[52px] w-[52px] items-center justify-center bg-rp-text text-rp-bg transition-colors duration-200 hover:bg-rp-gold lg:hidden"
      >
        <Plus size={20} strokeWidth={1.5} aria-hidden />
      </button>
      {open && <UniversalInput onClose={() => setOpen(false)} />}
    </>
  )
}
