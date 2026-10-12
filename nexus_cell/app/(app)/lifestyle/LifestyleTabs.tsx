'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Gift, Subscription, Membership, UserRole } from '@/lib/types'
import GiftsList from '@/app/(app)/gifts/GiftsList'
import SubscriptionsList from '@/app/(app)/subscriptions/SubscriptionsList'
import MembershipsList from '@/app/(app)/memberships/MembershipsList'
import { RpPage, RpPageHeader, RpChips } from '@/components/rp'

type ListId = 'memberships' | 'subscriptions' | 'gifts'

// ?tab= values are unchanged (gifts / subscriptions / memberships).
const LISTS: { id: ListId; num: string; label: string }[] = [
  { id: 'memberships', num: '01', label: 'Memberships' },
  { id: 'subscriptions', num: '02', label: 'Software & services' },
  { id: 'gifts', num: '03', label: 'Gifts' },
]

interface Props {
  gifts: Gift[]
  subscriptions: Subscription[]
  memberships: Membership[]
  role: UserRole
  // Rendered inside the Site Map "Clubhouse" view, which supplies its own header.
  embedded?: boolean
}

function LifestyleTabsInner({ gifts, subscriptions, memberships, role, embedded }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const requested = searchParams.get('tab')
  const activeTab: ListId = LISTS.some(l => l.id === requested) ? (requested as ListId) : 'memberships'

  function setTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`, { scroll: false })
  }

  const content = (
    <>
      <RpChips ariaLabel="Clubhouse list" items={LISTS} value={activeTab} onChange={setTab} />

      {/* The lists always render embedded (group head, no page header). */}
      {activeTab === 'memberships' && <MembershipsList memberships={memberships} role={role} embedded />}
      {activeTab === 'subscriptions' && <SubscriptionsList subscriptions={subscriptions} role={role} embedded />}
      {activeTab === 'gifts' && <GiftsList gifts={gifts} role={role} embedded />}
    </>
  )

  if (embedded) return <div className="flex flex-col gap-7">{content}</div>

  return (
    <RpPage>
      <RpPageHeader
        eyebrow="Clubhouse"
        title="Member services"
        line="Memberships, software and the club’s gifts, run from the north-lake clubhouse."
      />
      {content}
    </RpPage>
  )
}

export default function LifestyleTabs(props: Props) {
  return (
    <Suspense>
      <LifestyleTabsInner {...props} />
    </Suspense>
  )
}
