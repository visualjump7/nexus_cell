import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import WidgetCard, { WidgetEmpty } from './WidgetCard'

interface Props {
  orgId: string
  settings?: { limit?: number }
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function BriefingsWidget({ orgId, settings }: Props) {
  const limit = (settings?.limit as number) || 3
  const supabase = createClient()

  // Only briefs the EA has explicitly marked visible to the principal.
  // See sql/008 for principal_visible column.
  const { data } = await supabase
    .from('briefs')
    .select('id, title, brief_date, status, published_at, principal_visible')
    .eq('organization_id', orgId)
    .eq('principal_visible', true)
    .order('brief_date', { ascending: false })
    .limit(limit)

  const briefs = data || []

  return (
    <WidgetCard title="Recent Briefings" subtitle={briefs.length === 0 ? 'No briefs to show' : undefined}>
      {briefs.length === 0 ? (
        <WidgetEmpty message="Your team hasn't shared a briefing yet." />
      ) : (
        <ul className="space-y-2 m-0 p-0 list-none">
          {briefs.map(b => (
            <li key={b.id}>
              <Link
                href={`/brief/${b.id}`}
                className="block py-2 -my-1 hover:bg-white/[0.03] rounded-md transition-colors"
              >
                <p className="text-sm text-white font-medium leading-tight">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtDate(b.brief_date)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
