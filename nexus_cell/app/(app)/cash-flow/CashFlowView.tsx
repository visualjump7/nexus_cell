'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill, UserRole, QuickBooksConnection } from '@/lib/types'
import BillForm from '@/components/BillForm'
import DeleteConfirm from '@/components/DeleteConfirm'
import BillsImportModal from '@/components/BillsImportModal'
import QuickBooksBanner from '@/components/QuickBooksBanner'
import { exportBillsToXlsx } from '@/lib/billsExcel'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  paid: 'bg-blue-500/15 text-blue-400',
  rejected: 'bg-red-500/15 text-red-400',
  overdue: 'bg-orange-500/15 text-orange-400',
}

const tabs = [
  { key: 'all', label: 'All Bills' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]

interface Props {
  bills: Bill[]
  role: UserRole
  stats: { totalOutstanding: number; paidThisMonth: number; overdue: number }
  qbConnection?: QuickBooksConnection | null
  qbConfigured?: boolean
}

export default function CashFlowView({ bills, role, stats, qbConnection = null, qbConfigured = false }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null)
  const [showImport, setShowImport] = useState(false)

  const filtered = activeTab === 'all' ? bills : bills.filter(b => b.status === activeTab)

  function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  }

  async function handleDelete() {
    if (!deletingBill) return
    await fetch(`/api/bills/${deletingBill.id}`, { method: 'DELETE' })
    setDeletingBill(null)
    router.refresh()
  }

  return (
    <div className="max-w-6xl">
      <header className="rp-head">
        <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2.5">
          <span className="rp-eyebrow">Draws &amp; payables</span>
          <h1 className="rp-title">Cash Flow</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBillsToXlsx(bills)}
            disabled={bills.length === 0}
            className="rp-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed gap-1.5"
            title="Export bills to Excel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
          {canWrite && (
            <button
              onClick={() => setShowImport(true)}
              className="rp-btn-ghost gap-1.5"
              title="Import bills from Excel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import
            </button>
          )}
          {canWrite && (
            <button onClick={() => { setEditingBill(null); setShowForm(true) }} className="rp-btn-solid">
              New bill
            </button>
          )}
        </div>
        </div>
      </header>

      {/* QuickBooks Banner */}
      <QuickBooksBanner connection={qbConnection} canWrite={canWrite} isConfigured={qbConfigured} />

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rp-panel p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-[#CDA14B]" />
            <p className="rp-eyebrow--muted">Outstanding</p>
          </div>
          <p className="rp-stat-value">{fmt(stats.totalOutstanding)}</p>
        </div>
        <div className="rp-panel p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-[#A4CC5C]" />
            <p className="rp-eyebrow--muted">Paid This Month</p>
          </div>
          <p className="rp-stat-value">{stats.paidThisMonth}</p>
        </div>
        <div className="rp-panel p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-red-400" />
            <p className="rp-eyebrow--muted">Overdue</p>
          </div>
          <p className="rp-stat-value">{stats.overdue}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rp-tabs mb-6" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            className="rp-tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rp-panel p-12 text-center">
          <p className="text-gray-500">No bills found.</p>
        </div>
      ) : (
        <div className="rp-panel overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1F1F1F] text-left rp-eyebrow--muted">
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canWrite && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(bill => (
                <tr key={bill.id} className="border-b border-[#1F1F1F] hover:bg-[#141618] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{bill.vendor}</p>
                    {bill.description && <p className="text-gray-500 text-xs mt-0.5">{bill.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-white font-mono">{formatCurrency(bill.amount, bill.currency)}</td>
                  <td className="px-5 py-3 text-gray-400">{bill.category || '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{formatDate(bill.due_date)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusColors[bill.status] || ''}`}>
                      {bill.status}
                    </span>
                  </td>
                  {canWrite && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { setEditingBill(bill); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeletingBill(bill)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <BillForm bill={editingBill} onClose={() => { setShowForm(false); setEditingBill(null) }} />}
      {deletingBill && <DeleteConfirm itemName={deletingBill.vendor} onConfirm={handleDelete} onCancel={() => setDeletingBill(null)} />}
      {showImport && <BillsImportModal onClose={() => setShowImport(false)} existingBills={bills} />}
    </div>
  )
}
