'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bill, UserRole } from '@/lib/types'
import BillForm from '@/components/BillForm'
import DeleteConfirm from '@/components/DeleteConfirm'
import {
  RpPage, RpPageHeader, RpFilterBar, RpSelect, RpTable, RpStatus, RpButton, RpEmpty,
  Plus, RP_ICON, fmtMoney, fmtDate, dot, statusLabel,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

const STATUSES: Bill['status'][] = ['pending', 'approved', 'paid', 'rejected', 'overdue']

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

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('financial', 'Payables')}
        title="Bills"
        line={dot(
          `${filtered.length} ${filtered.length === 1 ? 'bill' : 'bills'}`,
          statusFilter !== 'all' && statusLabel('bill', statusFilter),
          categoryFilter !== 'all' && categoryFilter,
        )}
        actions={canWrite && (
          <RpButton
            icon={<Plus size={RP_ICON.size} strokeWidth={RP_ICON.strokeWidth} aria-hidden />}
            onClick={() => { setEditingBill(null); setShowForm(true) }}
          >
            New bill
          </RpButton>
        )}
      />

      <section className="flex flex-col gap-5">
        <RpFilterBar count={`${filtered.length} ${filtered.length === 1 ? 'bill' : 'bills'}`}>
          <RpSelect aria-label="Status" className="w-[200px] max-w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{statusLabel('bill', s)}</option>)}
          </RpSelect>

          <RpSelect aria-label="Category" className="w-[220px] max-w-full" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c!}>{c}</option>)}
          </RpSelect>
        </RpFilterBar>

        {filtered.length === 0 ? (
          <RpEmpty title="No bills here." line="Nothing matches these filters." />
        ) : (
          <RpTable minWidth={820} caption="Bills">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Due</th>
                <th className="num">Amount</th>
                <th>Status</th>
                {canWrite && <th className="text-right" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map(bill => (
                <tr key={bill.id}>
                  <td className="max-w-[360px]">
                    <span className="font-medium">{bill.vendor}</span>
                    {bill.description && <span className="sub">{bill.description}</span>}
                  </td>
                  <td className="whitespace-nowrap text-rp-muted">{bill.category || '—'}</td>
                  <td className={`whitespace-nowrap tabular-nums ${bill.status === 'overdue' ? 'text-rp-alert' : 'text-rp-muted'}`}>
                    {bill.due_date ? fmtDate(bill.due_date) : '—'}
                  </td>
                  <td className="num">{fmtMoney(bill.amount, { currency: bill.currency })}</td>
                  <td><RpStatus kind="bill" value={bill.status} /></td>
                  {canWrite && (
                    <td className="whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-4">
                        <RpButton variant="text" size="sm" onClick={() => handleEdit(bill)}>Edit</RpButton>
                        <RpButton variant="text" size="sm" onClick={() => setDeletingBill(bill)}>Delete</RpButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </RpTable>
        )}
      </section>

      {/* Modals */}
      {showForm && <BillForm bill={editingBill} onClose={handleCloseForm} />}
      {deletingBill && <DeleteConfirm itemName={deletingBill.vendor} onConfirm={handleDelete} onCancel={() => setDeletingBill(null)} />}
    </RpPage>
  )
}
