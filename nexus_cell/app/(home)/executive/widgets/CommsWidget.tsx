import WidgetCard from './WidgetCard'
import { RpEmpty } from '@/components/rp'

// Placeholder while the Comms feature is built out. Renders the widget chrome
// so the EA can already include it in a principal view, but states clearly
// that messaging isn't live yet.
export default function CommsWidget() {
  return (
    <WidgetCard title="Comms" subtitle="Direct messages with your team">
      <RpEmpty
        compact
        pines={false}
        title="Messaging is on the way."
        line="For now, your owner's rep can reach you through Alerts."
        className="min-h-0 border-0 bg-transparent p-0"
      />
    </WidgetCard>
  )
}
