// Executive Command Center widget catalog.
//
// Source of truth for what an EA can put on a principal's view. Each entry is
// pure metadata (id, label, description, default settings) — the actual React
// components are looked up server-side by `widget_id` in
// app/(home)/executive/widgets/registry.ts.
//
// To add a new widget:
//   1. Add a row here with a stable `id` and metadata.
//   2. Add a settings schema below if the widget takes settings.
//   3. Implement the component in app/(home)/executive/widgets/<id>.tsx.
//   4. Register the component in app/(home)/executive/widgets/registry.ts.

export type WidgetId =
  | 'approvals'
  | 'todays_schedule'
  | 'next_trip'
  | 'bills_due'
  | 'glance'
  | 'briefings'
  | 'comms'
  | 'ai_ask'

export interface WidgetCatalogEntry {
  id: WidgetId
  label: string
  description: string
  // Whether the widget is interactive for the principal (approve/reject, chat).
  // Read-only widgets show data but render no action buttons.
  interactive: boolean
  // If true, the widget cannot be removed from any principal view. Used for
  // ai_ask (always-on chat) — EA can reorder but not disable.
  pinned?: boolean
  defaultSettings?: Record<string, unknown>
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    id: 'approvals',
    label: 'Pending Approvals',
    description: 'Items waiting for principal sign-off. Approve or reject in one tap.',
    interactive: true,
  },
  {
    id: 'todays_schedule',
    label: "Today's Schedule",
    description: 'Trip segments and key events scheduled for today.',
    interactive: false,
  },
  {
    id: 'next_trip',
    label: 'Next Trip',
    description: 'Upcoming trip with countdown, key segments, and travel docs.',
    interactive: false,
  },
  {
    id: 'bills_due',
    label: 'Bills Due',
    description: 'Bills coming due in the configured window.',
    interactive: false,
    defaultSettings: { window: '7d' }, // 'today' | '7d' | '30d'
  },
  {
    id: 'glance',
    label: 'Quick Glance',
    description: 'High-level totals: outstanding spend, open alerts, active trips.',
    interactive: false,
  },
  {
    id: 'briefings',
    label: 'Recent Briefings',
    description: 'Briefs the EA has marked visible to the principal.',
    interactive: false,
    defaultSettings: { limit: 3 },
  },
  {
    id: 'comms',
    label: 'Comms',
    description: 'Direct messages between EA / CFO / principal. (Coming soon — placeholder for now.)',
    interactive: false,
  },
  {
    id: 'ai_ask',
    label: 'Ask Nexus',
    description: 'Always-on AI chat — the principal\'s primary way to ask questions and request actions.',
    interactive: true,
    pinned: true,
  },
]

// Lookup helper
export function getWidgetEntry(id: string): WidgetCatalogEntry | undefined {
  return WIDGET_CATALOG.find(w => w.id === id)
}

// Default config used when a principal has no executive_views row yet.
// Calm, focused, useful — a strong first impression even before the EA
// curates anything.
export const DEFAULT_PRINCIPAL_WIDGETS: Array<{ widget_id: WidgetId; settings?: Record<string, unknown> }> = [
  { widget_id: 'ai_ask' },
  { widget_id: 'approvals' },
  { widget_id: 'todays_schedule' },
]
