'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Gift, Subscription, Membership, UserRole } from '@/lib/types'
import GiftsList from '@/app/(app)/gifts/GiftsList'
import SubscriptionsList from '@/app/(app)/subscriptions/SubscriptionsList'
import MembershipsList from '@/app/(app)/memberships/MembershipsList'
import { Suspense } from 'react'

const tabOptions = [
  { key: 'gifts', label: 'Gifts' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'memberships', label: 'Memberships' },
  { key: 'passwords', label: 'Passwords' },
]

interface Props {
  gifts: Gift[]
  subscriptions: Subscription[]
  memberships: Membership[]
  role: UserRole
}

function LifestyleTabsInner({ gifts, subscriptions, memberships, role }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = searchParams.get('tab') || 'gifts'

  function setTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lifestyle</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit">
        {tabOptions.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
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
    <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">Passwords</h2>
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
