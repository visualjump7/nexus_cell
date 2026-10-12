import { RpSubhead, RpList, RpRow, RpTag, RpEmpty, timeAgo, dot } from '@/components/rp'

interface ActivityItem {
  type: 'bill' | 'alert' | 'task'
  title: string
  description: string
  timestamp: string
}

const TYPE_LABEL: Record<ActivityItem['type'], string> = {
  bill: 'Bill',
  alert: 'Alert',
  task: 'Task',
}

const TYPE_HREF: Record<ActivityItem['type'], string> = {
  bill: '/financial',
  alert: '/alerts',
  task: '/tasks',
}

export default function DashboardActivity({ items, num }: { items: ActivityItem[]; num?: number }) {
  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.type] = (acc[it.type] || 0) + 1
    return acc
  }, {})

  return (
    <section className="flex flex-col gap-5">
      <RpSubhead
        num={num}
        title="Recent activity"
        spec={items.length > 0
          ? dot(counts.bill && `${counts.bill} bills`, counts.alert && `${counts.alert} alerts`, counts.task && `${counts.task} tasks`)
          : undefined}
      />
      {items.length === 0 ? (
        <RpEmpty compact title="Nothing logged yet." line="Bills, alerts and tasks show here as they move." />
      ) : (
        <RpList>
          {items.map((item, i) => (
            <RpRow
              key={`${item.type}-${item.timestamp}-${i}`}
              index={i + 1}
              lead={<RpTag className="w-[60px] justify-center">{TYPE_LABEL[item.type]}</RpTag>}
              title={item.title}
              meta={item.description}
              href={TYPE_HREF[item.type]}
              aside={<span className="whitespace-nowrap text-xs text-rp-dim">{timeAgo(item.timestamp)}</span>}
            />
          ))}
        </RpList>
      )}
    </section>
  )
}
