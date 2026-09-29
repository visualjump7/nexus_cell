'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Gift, Subscription, Membership, UserRole } from '@/lib/types'
import GiftsList from '@/app/(app)/gifts/GiftsList'
import SubscriptionsList from '@/app/(app)/subscriptions/SubscriptionsList'
import MembershipsList from '@/app/(app)/memberships/MembershipsList'
import { Suspense } from 'react'
import { BRAND } from '@/lib/brand'

const tabOptions = [
  { key: 'gifts', label: 'Gifts' },
  { key: 'subscriptions', label: 'Software & services' },
  { key: 'memberships', label: 'Memberships' },
  { key: 'passwords', label: 'Passwords' },
]

interface Props {
  gifts: Gift[]
  subscriptions: Subscription[]
  memberships: Membership[]
  role: UserRole
  // Rendered inside the Site Map "Clubhouse" tab, which supplies its own header.
  embedded?: boolean
}

function LifestyleTabsInner({ gifts, subscriptions, memberships, role, embedded }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = searchParams.get('tab') || 'gifts'

  function setTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`)
  }

  return (
    <div>
      {!embedded && (
        <header className="rp-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--head" />
          <span className="rp-eyebrow">Members &amp; partners</span>
          <h1 className="rp-title">Clubhouse</h1>
        </header>
      )}

      {/* Tabs */}
      <div className="rp-tabs mb-6" role="tablist">
        {tabOptions.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            className="rp-tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'gifts' && <GiftsList gifts={gifts} role={role} />}
      {activeTab === 'subscriptions' && <SubscriptionsList subscriptions={subscriptions} role={role} />}
      {activeTab === 'memberships' && <MembershipsList memberships={memberships} role={role} />}
      {activeTab === 'passwords' && <PasswordsPlaceholder />}
    </div>
  )
}

// Temporary placeholder — wired up so the tab is reachable. Replace with the
// real password vault UI when that feature is built.
function PasswordsPlaceholder() {
  return (
    <div className="rp-panel p-12 text-center">
      <div className="w-12 h-12 mx-auto mb-4 border border-[#26292C] flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="rp-eyebrow mb-2">Passwords</h2>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">
        Secure password vault is coming soon. Store and share credentials with the team here.
      </p>
    </div>
  )
}

export default function LifestyleTabs(props: Props) {
  return (
    <Suspense>
      <LifestyleTabsInner {...props} />
    </Suspense>
  )
}
