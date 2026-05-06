import type { WidgetId } from '@/lib/widgets'
import ApprovalsWidget from './ApprovalsWidget'
import TodaysScheduleWidget from './TodaysScheduleWidget'
import NextTripWidget from './NextTripWidget'
import BillsDueWidget from './BillsDueWidget'
import GlanceWidget from './GlanceWidget'
import BriefingsWidget from './BriefingsWidget'
import CommsWidget from './CommsWidget'
import AiAskWidget from './AiAskWidget'

interface RenderProps {
  orgId: string
  // Principal user id — passed so widgets that respect per-user state
  // (e.g. external calendar visibility prefs in TodaysScheduleWidget) can
  // filter to what this principal has chosen to see.
  principalUserId?: string
  settings?: Record<string, unknown>
  // Jarvis-mode personalization for the AI Ask widget. Other widgets ignore.
  jarvis?: {
    openingMessage: string
    suggestions: string[]
  }
}

// Maps widget_id from the saved executive_views.widgets array to the actual
// React component. Widgets that don't appear here are skipped silently —
// useful when removing a widget from the catalog without breaking saved configs.
export function renderWidget(id: WidgetId, props: RenderProps): React.ReactNode {
  switch (id) {
    case 'approvals':
      return <ApprovalsWidget orgId={props.orgId} />
    case 'todays_schedule':
      return <TodaysScheduleWidget orgId={props.orgId} principalUserId={props.principalUserId} />
    case 'next_trip':
      return <NextTripWidget orgId={props.orgId} />
    case 'bills_due':
      return <BillsDueWidget orgId={props.orgId} settings={props.settings as { window?: 'today' | '7d' | '30d' } | undefined} />
    case 'glance':
      return <GlanceWidget orgId={props.orgId} />
    case 'briefings':
      return <BriefingsWidget orgId={props.orgId} settings={props.settings as { limit?: number } | undefined} />
    case 'comms':
      return <CommsWidget />
    case 'ai_ask':
      return <AiAskWidget openingMessage={props.jarvis?.openingMessage} suggestions={props.jarvis?.suggestions} />
    default:
      return null
  }
}
