'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#4ade80', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171']

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
      <div className="lg:col-span-3 bg-card rounded-xl shadow-lg shadow-black/20 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Activity Overview</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v as number / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
              contentStyle={{ background: '#1a1b2e', border: 'none', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#4ade80' }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spending']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#4ade80"
              fill="url(#greenGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Donut Chart — Breakdown */}
      <div className="lg:col-span-2 bg-card rounded-xl shadow-lg shadow-black/20 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Breakdown</h3>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-[240px]">
            <p className="text-gray-600 text-sm">No bill data yet</p>
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
                  contentStyle={{ background: '#1a1b2e', border: 'none', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {categoryData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                  <span className="text-gray-600">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
