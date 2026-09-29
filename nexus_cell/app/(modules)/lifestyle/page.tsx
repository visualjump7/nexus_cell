import { redirect } from 'next/navigation'

// Club Life became the Site Map section; its lists live under the Clubhouse tab.
export default function LifestyleRedirect({ searchParams }: { searchParams: { tab?: string } }) {
  redirect(searchParams.tab ? `/site-map?tab=${encodeURIComponent(searchParams.tab)}` : '/site-map')
}
