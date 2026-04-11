'use client'

import Link from 'next/link'
import NexusOrb from './NexusOrb'

export default function NexusCorner() {
  return (
    <Link
      href="/"
      className="fixed top-5 left-5 z-40 hover:scale-110 transition-transform"
      title="Back to Home"
    >
      <NexusOrb size="small" />
    </Link>
  )
}
