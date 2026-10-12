'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Gift, Subscription, Membership, UserRole } from '@/lib/types'
import type { SiteProject } from '@/lib/site-map'
import {
  RpPage,
  RpPageHeader,
  RpTabs,
  RpGallery,
  RpSource,
  RpNote,
  RpFigure,
  RpGroupHead,
  RpKV,
  dot,
  type RpImage,
} from '@/components/rp'
import { toRpImage, SECTION_HERO } from '@/lib/project-imagery'
import { sectionEyebrow } from '@/lib/sections'
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

// Keep "2.75-mi" together when the line wraps (non-breaking hyphen).
const nb = (s: string) => s.replace(/-/g, '\u2011')

type View = 'map' | 'plans' | 'images' | 'models' | 'clubhouse'

const VIEWS: { id: View; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'plans', label: 'Plans' },
  { id: 'images', label: 'Images' },
  { id: 'models', label: 'Models' },
  { id: 'clubhouse', label: 'Clubhouse' },
]

// Plans: the two master plan sheets, full width on the white mat (as in the concept).
const PLANS: RpImage[] = [
  toRpImage('/demo/plans/masterplan-v5.jpg'),
  toRpImage('/demo/plans/masterplan-v5-unit-mix.jpg'),
]

// Images: the ten aerials in the concept's order — the whole club as the lead,
// pairs, and the southern circuit full width to close.
const AERIALS: RpImage[] = [
  'aerial-01-full-site',
  'aerial-02-north-pit-grandstand',
  'aerial-03-south-grandstand-entry',
  'aerial-10-garage-campus-pit-lane',
  'aerial-06-central-lake-garage-arc',
  'aerial-05-clubhouse-pools-courts',
  'aerial-09-northern-lakes',
  'aerial-12-eastern-lakefront',
  'aerial-04-northeast-boardwalk',
  'aerial-08-southern-circuit',
].map(f => toRpImage(`/demo/site/${f}.jpg`))

// Models: the six site-model renders, the whole property first.
const MODELS: RpImage[] = [
  'site-full-hero',
  'site-central-lake-garage-arc',
  'site-northern-lakes',
  'site-clubhouse-pools-courts',
  'site-eastern-lakefront',
  'site-southern-circuit',
].map((f, i) => {
  const img = toRpImage(`/demo/site/${f}.jpg`)
  return i === 0
    ? { ...img, caption: `${img.caption}, from the High-End site model`, qualifier: 'Palatka, Florida · building heights and landscape illustrative' }
    : img
})

function SiteMapTabsInner({ projects, gifts, subscriptions, memberships, role }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ?view= picks the tab. The Clubhouse lists keep their own ?tab= param
  // (gifts / subscriptions / memberships), so a ?tab= alone means Clubhouse.
  // plans / images / models are client-only views of the same route.
  const raw = searchParams.get('view') || (searchParams.get('tab') ? 'clubhouse' : 'map')
  const view: View = VIEWS.some(v => v.id === raw) ? (raw as View) : 'map'

  function setView(v: string) {
    router.push(v === 'map' ? pathname : `${pathname}?view=${v}`, { scroll: false })
  }

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('site-map')}
        title="The property, zone by zone"
        line={dot(`${BRAND.site.acres} acres beside Palatka–Kay Larkin Airport`, nb(BRAND.site.road), nb(BRAND.site.street))}
        actions={<RpTabs ariaLabel="Site map view" items={VIEWS} value={view} onChange={setView} />}
      />

      {view === 'map' && <SiteMap projects={projects} />}

      {view === 'plans' && (
        <>
          <RpSource tag="As issued">
            CUBE 3 Studio · Sheet A-80a · Roaring Pines Master Plan, Palatka FL · Draft, not for construction
          </RpSource>
          <RpGallery images={PLANS} layout="lead-pairs" aspect="masterplan" />
          <RpNote>Drawings reproduced from the issued sheets without alteration. Select either sheet to read it at full size.</RpNote>
        </>
      )}

      {view === 'images' && (
        <>
          <RpSource tag="Aerial render">Photoreal renders of the finished club · State Road 100, Palatka, Florida</RpSource>
          <RpGallery images={AERIALS} layout="lead-pairs" aspect="aerial" />
        </>
      )}

      {view === 'models' && (
        <>
          <RpSource tag="Site model">The High-End site model · building heights and landscape illustrative</RpSource>
          <RpGallery images={MODELS} layout="lead-pairs" aspect="site" />
        </>
      )}

      {view === 'clubhouse' && (
        <>
          <div className="grid items-end gap-8 lg:grid-cols-2">
            <RpFigure {...SECTION_HERO.clubhouse} num={1} />
            <div className="flex min-w-0 flex-col gap-5">
              <RpGroupHead
                as="h2"
                title="Clubhouse"
                line="Member services run from the north-lake clubhouse: memberships, software and the club’s gifts."
              />
              <RpKV
                items={[
                  { label: 'Memberships', value: memberships.length, num: true },
                  { label: 'Software & services', value: subscriptions.length, num: true },
                  { label: 'Gifts', value: gifts.length, num: true },
                ]}
              />
            </div>
          </div>
          <LifestyleTabs gifts={gifts} subscriptions={subscriptions} memberships={memberships} role={role} embedded />
        </>
      )}
    </RpPage>
  )
}

export default function SiteMapTabs(props: Props) {
  return (
    <Suspense>
      <SiteMapTabsInner {...props} />
    </Suspense>
  )
}
