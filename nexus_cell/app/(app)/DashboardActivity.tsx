interface ActivityItem {
  type: 'bill' | 'alert' | 'task'
  title: string
  description: string
  timestamp: string
}

const typeDots: Record<string, string> = {
  bill: 'bg-[#CDA14B]',
  alert: 'bg-[#3989CB]',
  task: 'bg-[#A4CC5C]',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function DashboardActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rp-panel p-5">
      <h3 className="rp-eyebrow--muted mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-1.5 h-1.5 mt-2 shrink-0 ${typeDots[item.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <span className="text-[11px] text-gray-600 shrink-0">{timeAgo(item.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
