'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill, UserRole } from '@/lib/types'
import BillForm from '@/components/BillForm'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paid: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  overdue: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

interface BillsListProps {
  bills: Bill[]
  role: UserRole
}

export default function BillsList({ bills, role }: BillsListProps) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null)

  const categories = Array.from(new Set(bills.map(b => b.category).filter(Boolean)))

  const filtered = bills.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false
    return true
  })

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  }

  function formatDate(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleDelete() {
    if (!deletingBill) return
    await fetch(`/api/bills/${deletingBill.id}`, { method: 'DELETE' })
    setDeletingBill(null)
    router.refresh()
  }

  function handleEdit(bill: Bill) {
    setEditingBill(bill)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingBill(null)
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <header className="rp-head">
        <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2.5">
          <span className="rp-eyebrow">Payables</span>
          <h1 className="rp-title">Bills</h1>
          <p className="rp-caption">
            {filtered.length} bill{filtered.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` · ${statusFilter}`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setEditingBill(null); setShowForm(true) }}
            className="rp-btn-solid"
          >
            New bill
          </button>
        )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="overdue">Overdue</option>
        </select>

        <select className={selectClass} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rp-panel p-12 text-center">
          <p className="text-gray-500">No bills found.</p>
        </div>
      ) : (
        <div className="rp-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F1F] text-left rp-eyebrow--muted">
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(bill => (
                  <tr key={bill.id} className="border-b border-[#1F1F1F] hover:bg-[#141618] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{bill.vendor}</p>
                        {bill.description && <p className="text-gray-500 text-xs mt-0.5">{bill.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white font-mono">{formatCurrency(bill.amount, bill.currency)}</td>
                    <td className="px-4 py-3 text-gray-400">{bill.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(bill.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[bill.status] || ''}`}>
                        {bill.status}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEdit(bill)} className="text-gray-500 hover:text-white text-xs mr-3 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setDeletingBill(bill)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && <BillForm bill={editingBill} onClose={handleCloseForm} />}
      {deletingBill && <DeleteConfirm itemName={deletingBill.vendor} onConfirm={handleDelete} onCancel={() => setDeletingBill(null)} />}
    </div>
  )
}
