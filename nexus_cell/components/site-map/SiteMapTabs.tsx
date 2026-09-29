'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Gift, Subscription, Membership, UserRole } from '@/lib/types'
import type { SiteProject } from '@/lib/site-map'
import { SITE } from '@/lib/site-map'
import { BRAND } from '@/lib/brand'
import LifestyleTabs from '@/app/(app)/lifestyle/LifestyleTabs'
import SiteMap from './SiteMap'

interface Props {
  projects: SiteProject[]
  gifts: Gift[]
  subscriptions: Subscription[]
  memberships: Membership[]
  role: UserRole
}

const TABS = [
  { key: 'map', label: 'Map' },
  { key: 'clubhouse', label: 'Clubhouse' },
] as const

function SiteMapTabsInner({ projects, gifts, subscriptions, memberships, role }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ?view= picks the tab. The Clubhouse lists keep their own ?tab= param
  // (gifts / subscriptions / memberships), so a ?tab= alone means Clubhouse.
  const view = searchParams.get('view') || (searchParams.get('tab') ? 'clubhouse' : 'map')

  function setView(v: string) {
    router.push(v === 'map' ? pathname : `${pathname}?view=${v}`, { scroll: false })
  }

  return (
    <div>
      <header className="rp-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--head" />
        <span className="rp-eyebrow">{SITE.acres} acres · Palatka, FL</span>
        <h1 className="rp-title">Site Map</h1>
      </header>

      <div className="rp-tabs mb-6" role="tablist">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            role="tab"
            aria-selected={view === t.key}
            className="rp-tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'clubhouse' ? (
        <section>
          <h2 className="font-display uppercase tracking-[0.04em] text-[22px] leading-none text-[#F5F5F5] mb-5">
            Clubhouse subscriptions &amp; memberships
          </h2>
          <LifestyleTabs gifts={gifts} subscriptions={subscriptions} memberships={memberships} role={role} embedded />
        </section>
      ) : (
        <SiteMap projects={projects} />
      )}
    </div>
  )
}

export default function SiteMapTabs(props: Props) {
  return (
    <Suspense>
      <SiteMapTabsInner {...props} />
    </Suspense>
  )
}
