'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Roaring Pines categorical order: gold, blue, green, light gold, light blue, steel.
const COLORS = ['#CDA14B', '#3989CB', '#A4CC5C', '#E0BF7B', '#7FB3DE', '#9AA0A4']

const monthlyData = [
  { month: 'Jan', amount: 42000 },
  { month: 'Feb', amount: 38500 },
  { month: 'Mar', amount: 51200 },
  { month: 'Apr', amount: 46800 },
  { month: 'May', amount: 55100 },
  { month: 'Jun', amount: 48900 },
  { month: 'Jul', amount: 62300 },
  { month: 'Aug', amount: 44700 },
  { month: 'Sep', amount: 53600 },
  { month: 'Oct', amount: 47200 },
  { month: 'Nov', amount: 58400 },
  { month: 'Dec', amount: 51800 },
]

interface CategoryItem {
  name: string
  value: number
}

interface Props {
  categoryData: CategoryItem[]
}

export default function DashboardCharts({ categoryData }: Props) {
  const total = categoryData.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Area Chart — Activity Overview */}
      <div className="lg:col-span-3 rp-panel p-5">
        <h3 className="rp-eyebrow--muted mb-4">Monthly spend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CDA14B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#CDA14B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fill: '#6E7578', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6E7578', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v as number / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
contentStyle={{ background: '#141618', border: '1px solid #26292C', borderRadius: 2, boxShadow: 'none' }}
              labelStyle={{ color: '#9AA0A4' }}
              itemStyle={{ color: '#F5F5F5' }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#CDA14B"
              fill="url(#goldGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Donut Chart — Breakdown */}
      <div className="lg:col-span-2 rp-panel p-5">
        <h3 className="rp-eyebrow--muted mb-4">Spend by category</h3>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-[240px]">
            <p className="text-gray-600 text-sm">No bills recorded yet</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  stroke="none"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#141618', border: '1px solid #26292C', borderRadius: 2, boxShadow: 'none' }}
                  labelStyle={{ color: '#9AA0A4' }}
                  itemStyle={{ color: '#F5F5F5' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {categoryData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-2 h-2 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                  <span className="text-[#6E7578]">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
