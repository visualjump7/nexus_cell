'use client'

import Link from 'next/link'
import { BRAND } from '@/lib/brand'

// Club mark as the "home" affordance. The AI keeps its own identity (Nexus)
// inside the chat surfaces; navigation uses the Roaring Pines mark.
export default function NexusCorner() {
  return (
    <Link
      href="/"
      className="fixed top-5 left-5 z-40 block hover:opacity-80 transition-opacity"
      title="Home"
      aria-label={`${BRAND.fullName} home`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.mark} alt="" aria-hidden className="w-8 h-8 object-contain" />
    </Link>
  )
}
