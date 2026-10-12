import { redirect } from 'next/navigation'

// Club Life became the Site Map's Clubhouse view; its lists keep their ?tab= values
// (gifts / subscriptions / memberships), and a ?tab= alone opens the Clubhouse view.
export default function LifestyleRedirect({ searchParams }: { searchParams: { tab?: string } }) {
  redirect(searchParams.tab ? `/site-map?tab=${encodeURIComponent(searchParams.tab)}` : '/site-map?view=clubhouse')
}
