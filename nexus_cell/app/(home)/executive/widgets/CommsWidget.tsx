import WidgetCard from './WidgetCard'

// Placeholder while the Comms feature is built out. Renders the widget chrome
// so the EA can already include it in a principal view, but states clearly
// that messaging isn't live yet.
export default function CommsWidget() {
  return (
    <WidgetCard title="Comms" subtitle="Direct messages with your team">
      <div className="flex items-start gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-white">Messaging is coming soon.</p>
          <p className="text-xs text-gray-500 mt-0.5">For now, your EA can reach you through Alerts.</p>
        </div>
      </div>
    </WidgetCard>
  )
}
