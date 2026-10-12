'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill, UserRole, QuickBooksConnection } from '@/lib/types'
import BillForm from '@/components/BillForm'
import DeleteConfirm from '@/components/DeleteConfirm'
import BillsImportModal from '@/components/BillsImportModal'
import QuickBooksBanner from '@/components/QuickBooksBanner'
import { exportBillsToXlsx } from '@/lib/billsExcel'
import {
  RpPage, RpPageHeader, RpStatStrip, RpStat, RpFilterBar, RpTabs, RpInput, RpTable, RpStatus,
  RpButton, RpEmpty, RpCounter, Download, Upload, Plus, Search, RP_ICON,
  fmtMoney, fmtDate, dot,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
]

const PAGE_SIZE = 50
const UNPAID: Bill['status'][] = ['pending', 'approved', 'overdue']

interface Props {
  bills: Bill[]
  role: UserRole
  stats: { totalOutstanding: number; paidThisMonth: number; overdue: number }
  qbConnection?: QuickBooksConnection | null
  qbConfigured?: boolean
}

/** YYYY-MM-DD in UTC, so the server render and the browser agree. */
function utcKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function CashFlowView({ bills, role, stats, qbConnection = null, qbConfigured = false }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null)
  const [showImport, setShowImport] = useState(false)

  // Figures derived client-side from the same rows (no new fetches).
  const derived = useMemo(() => {
    const now = new Date()
    const today = utcKey(now)
    const in7 = utcKey(new Date(now.getTime() + 7 * 86400000))
    const monthStart = `${today.slice(0, 7)}-01`
    let overdueSum = 0
    let paidMonthSum = 0
    let due7Count = 0
    let due7Sum = 0
    let outstandingCount = 0
    for (const b of bills) {
      const amt = Number(b.amount) || 0
      if (b.status === 'overdue') overdueSum += amt
      if (b.status === 'paid' && b.paid_date && b.paid_date >= monthStart) paidMonthSum += amt
      if (UNPAID.includes(b.status)) {
        outstandingCount++
        if (b.due_date && b.due_date >= today && b.due_date <= in7) {
          due7Count++
          due7Sum += amt
        }
      }
    }
    return { overdueSum, paidMonthSum, due7Count, due7Sum, outstandingCount }
  }, [bills])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bills.length, pending: 0, paid: 0, overdue: 0 }
    for (const b of bills) if (b.status in c) c[b.status]++
    return c
  }, [bills])

  const filtered = useMemo(() => {
    const byTab = activeTab === 'all' ? bills : bills.filter(b => b.status === activeTab)
    const q = query.trim().toLowerCase()
    return q ? byTab.filter(b => b.vendor.toLowerCase().includes(q)) : byTab
  }, [bills, activeTab, query])

  const rows = filtered.slice(0, visible)
  const thisYear = new Date().getUTCFullYear()

  function selectTab(id: string) {
    setActiveTab(id)
    setVisible(PAGE_SIZE)
  }

  function dueLabel(d: string | null) {
    if (!d) return '—'
    return fmtDate(d, Number(d.slice(0, 4)) === thisYear ? 'short' : 'medium')
  }

  async function handleDelete() {
    if (!deletingBill) return
    await fetch(`/api/bills/${deletingBill.id}`, { method: 'DELETE' })
    setDeletingBill(null)
    router.refresh()
  }

  const icon = { size: RP_ICON.size, strokeWidth: RP_ICON.strokeWidth, 'aria-hidden': true } as const

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('financial')}
        title="Draws and payables"
        line={dot(
          `${bills.length} ${bills.length === 1 ? 'bill' : 'bills'}`,
          `${fmtMoney(stats.totalOutstanding, { compact: true })} outstanding`,
          `${stats.overdue} overdue`,
        )}
        actions={
          <>
            <RpButton
              variant="ghost"
              icon={<Download {...icon} />}
              onClick={() => exportBillsToXlsx(bills)}
              disabled={bills.length === 0}
              title="Export bills to Excel"
            >
              Export
            </RpButton>
            {canWrite && (
              <RpButton variant="ghost" icon={<Upload {...icon} />} onClick={() => setShowImport(true)} title="Import bills from Excel">
                Import
              </RpButton>
            )}
            {canWrite && (
              <RpButton icon={<Plus {...icon} />} onClick={() => { setEditingBill(null); setShowForm(true) }}>
                New bill
              </RpButton>
            )}
          </>
        }
      />

      <QuickBooksBanner connection={qbConnection} canWrite={canWrite} isConfigured={qbConfigured} />

      <RpStatStrip cols={4}>
        <RpStat
          index={1}
          label="Outstanding"
          value={fmtMoney(stats.totalOutstanding, { compact: true })}
          sub={dot(`${derived.outstandingCount} bills`, 'pending, approved, overdue')}
        />
        <RpStat
          index={2}
          label="Overdue"
          value={stats.overdue}
          tone={stats.overdue > 0 ? 'alert' : 'default'}
          sub={stats.overdue > 0 ? `${fmtMoney(derived.overdueSum, { compact: true })} past due` : 'Nothing past due'}
        />
        <RpStat
          index={3}
          label="Paid this month"
          value={stats.paidThisMonth}
          sub={`${fmtMoney(derived.paidMonthSum, { compact: true })} drawn`}
        />
        <RpStat
          index={4}
          label="Due in 7 days"
          value={derived.due7Count}
          sub={derived.due7Count > 0 ? `${fmtMoney(derived.due7Sum, { compact: true })} to pay` : 'Nothing due this week'}
        />
      </RpStatStrip>

      <section className="flex flex-col gap-5">
        <RpFilterBar count={`${filtered.length} ${filtered.length === 1 ? 'bill' : 'bills'}`}>
          <RpTabs
            ariaLabel="Bill status"
            value={activeTab}
            onChange={selectTab}
            items={TABS.map(t => ({ ...t, count: counts[t.id] }))}
          />
          <div className="relative w-full max-w-[280px]">
            <Search
              size={RP_ICON.size}
              strokeWidth={RP_ICON.strokeWidth}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rp-dim"
            />
            <RpInput
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setVisible(PAGE_SIZE) }}
              placeholder="Search vendor"
              aria-label="Search vendor"
              className="h-10 !min-h-[40px] pl-9"
            />
          </div>
        </RpFilterBar>

        {filtered.length === 0 ? (
          <RpEmpty
            title="No bills here."
            line={query.trim() ? 'No vendor matches that search.' : 'Nothing in this status yet.'}
            action={canWrite && !query.trim() ? (
              <RpButton variant="ghost" size="sm" icon={<Plus {...icon} />} onClick={() => { setEditingBill(null); setShowForm(true) }}>
                New bill
              </RpButton>
            ) : undefined}
          />
        ) : (
          <>
            {/* Below 640px: Vendor (due date under it) · Amount (status under it) · actions stacked. */}
            <RpTable minWidth={820} caption="Bills" className="max-sm:[&_table]:!min-w-0">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th className="hidden sm:table-cell">Category</th>
                  <th className="hidden sm:table-cell">Due</th>
                  <th className="num">Amount</th>
                  <th className="hidden sm:table-cell">Status</th>
                  {canWrite && <th className="text-right" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {rows.map(bill => (
                  <tr key={bill.id}>
                    <td className="max-w-[360px]">
                      <span className="font-medium">{bill.vendor}</span>
                      {bill.description && <span className="sub">{bill.description}</span>}
                      {bill.due_date && (
                        <span className={`sub tabular-nums sm:!hidden ${bill.status === 'overdue' ? '!text-rp-alert' : ''}`}>
                          Due {dueLabel(bill.due_date)}
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap text-rp-muted sm:table-cell">{bill.category || '—'}</td>
                    <td className={`hidden whitespace-nowrap tabular-nums sm:table-cell ${bill.status === 'overdue' ? 'text-rp-alert' : 'text-rp-muted'}`}>
                      {dueLabel(bill.due_date)}
                    </td>
                    <td className="num">
                      {fmtMoney(bill.amount, { currency: bill.currency })}
                      <span className="mt-2 block sm:hidden"><RpStatus kind="bill" value={bill.status} /></span>
                    </td>
                    <td className="hidden sm:table-cell"><RpStatus kind="bill" value={bill.status} /></td>
                    {canWrite && (
                      <td className="whitespace-nowrap text-right">
                        <div className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                          <RpButton variant="text" size="sm" onClick={() => { setEditingBill(bill); setShowForm(true) }}>Edit</RpButton>
                          <RpButton variant="text" size="sm" onClick={() => setDeletingBill(bill)}>Delete</RpButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </RpTable>

            <div className="flex flex-wrap items-center gap-4">
              <RpCounter current={rows.length} total={filtered.length} />
              {rows.length < filtered.length && (
                <RpButton variant="ghost" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, filtered.length - rows.length)} more
                </RpButton>
              )}
            </div>
          </>
        )}
      </section>

      {showForm && <BillForm bill={editingBill} onClose={() => { setShowForm(false); setEditingBill(null) }} />}
      {deletingBill && <DeleteConfirm itemName={deletingBill.vendor} onConfirm={handleDelete} onCancel={() => setDeletingBill(null)} />}
      {showImport && <BillsImportModal onClose={() => setShowImport(false)} existingBills={bills} />}
    </RpPage>
  )
}
