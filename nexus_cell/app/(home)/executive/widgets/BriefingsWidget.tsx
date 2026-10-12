import { createClient } from '@/utils/supabase/server'
import WidgetCard, { WidgetEmpty } from './WidgetCard'
import { RpList, RpRow, fmtDate } from '@/components/rp'

interface Props {
  orgId: string
  settings?: { limit?: number }
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
    <WidgetCard title="Recent briefings" subtitle={briefs.length === 0 ? 'No briefs to show' : "The owner's brief, newest first"}>
      {briefs.length === 0 ? (
        <WidgetEmpty message="No briefing shared yet." />
      ) : (
        <RpList as="ul">
          {briefs.map((b, i) => (
            <RpRow
              key={b.id}
              as="li"
              index={i + 1}
              href={`/brief/${b.id}`}
              title={b.title}
              meta={fmtDate(b.brief_date, 'medium')}
              className="[&_.rp-row-end]:pointer-events-none"
              aside={<span className="rp-btn-text" aria-hidden>Read →</span>}
            />
          ))}
        </RpList>
      )}
    </WidgetCard>
  )
}
