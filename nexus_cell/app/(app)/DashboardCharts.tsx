'use client'

import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { RP_CHART, RpChartFrame, RpBarList, RpEmpty, RpLoopLink, fmtMoney, dot } from '@/components/rp'
import { watchLoop } from '@/lib/dashboard-loops'

interface MonthPoint {
  /** Axis tick: 'Oct'. */
  m: string
  /** Tooltip label: 'October 2026'. */
  label: string
  /** Σ paid bill amounts with paid_date in that month. */
  v: number
}

interface CategoryItem {
  label: string
  value: number
}

interface Props {
  /** Last 12 months, oldest first (paid bills by paid_date). */
  months: MonthPoint[]
  drawsTotal: number
  /** Top categories by Σ amount over non-rejected bills. */
  categories: CategoryItem[]
  billedTotal: number
}

const compact = (n: number) => fmtMoney(n, { compact: true })

// Gold is an accent, never a large fill: the months are steel and only the
// peak month (named in the sub-line) is picked out in gold.
const BAR_FILL = '#3A3E42'
const PEAK_FILL = RP_CHART.colors[0]

export default function DashboardCharts({ months, drawsTotal, categories, billedTotal }: Props) {
  const labelFor = (m: unknown) => months.find(p => p.m === m)?.label ?? String(m ?? '')
  const busiest = months.reduce<MonthPoint | null>((best, p) => (p.v > (best?.v ?? 0) ? p : best), null)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      <RpChartFrame
        eyebrow="Draws by month"
        aside={<RpLoopLink {...watchLoop('draws')} />}
        value={compact(drawsTotal)}
        sub={dot('Paid bills by payment date', 'last 12 months', busiest && `peak ${busiest.label} ${compact(busiest.v)}`)}
        height={0}
        className={drawsTotal > 0 ? '[&>div:last-child]:min-h-[260px] [&>div:last-child]:flex-1' : undefined}
      >
        {drawsTotal > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={RP_CHART.grid} />
              <XAxis
                dataKey="m"
                tick={RP_CHART.tick}
                axisLine={{ stroke: RP_CHART.axis }}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={v => String(v).toUpperCase()}
              />
              <YAxis
                tick={RP_CHART.tick}
                tickFormatter={v => compact(Number(v))}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                {...RP_CHART.tooltip}
                labelFormatter={labelFor}
                formatter={v => [fmtMoney(Number(v)), 'Paid']}
              />
              <Bar dataKey="v" fill={BAR_FILL} radius={RP_CHART.bar.radius} maxBarSize={RP_CHART.bar.maxBarSize}>
                {months.map(p => (
                  <Cell key={p.m + p.label} fill={busiest && p.m === busiest.m && p.label === busiest.label ? PEAK_FILL : BAR_FILL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <RpEmpty compact pines={false} title="No draws paid yet." line="Paid bills appear here by the month they were paid." />
        )}
      </RpChartFrame>

      <RpChartFrame
        eyebrow="Where the money goes"
        aside={<RpLoopLink {...watchLoop('money')} />}
        value={compact(billedTotal)}
        sub={dot('Bills by category', 'excluding rejected', categories.length > 0 && `top ${categories.length}`)}
        height={0}
      >
        {categories.length > 0 ? (
          <RpBarList items={categories} format={compact} />
        ) : (
          <RpEmpty compact pines={false} title="No bills recorded yet." />
        )}
      </RpChartFrame>
    </div>
  )
}
