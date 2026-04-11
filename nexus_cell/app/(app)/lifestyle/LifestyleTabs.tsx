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
