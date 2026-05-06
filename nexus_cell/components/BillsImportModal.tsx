'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import { parseBillsFile, exportTemplate, type ParsedBill, type InvalidRow } from '@/lib/billsExcel'
import type { Bill } from '@/lib/types'

type Phase = 'picking' | 'parsing' | 'preview' | 'overwrite' | 'importing' | 'done'

interface Props {
  onClose: () => void
  onComplete?: (count: number) => void
  existingBills: Bill[]
}

interface DuplicatePair {
  existing: Bill
  incoming: ParsedBill
}

// Normalize vendor for matching (case-insensitive, trimmed)
function normalizeVendor(v: string): string {
  return v.trim().toLowerCase()
}

function detectDuplicates(
  incoming: ParsedBill[],
  existing: Bill[],
): { newBills: ParsedBill[]; duplicates: DuplicatePair[] } {
  const newBills: ParsedBill[] = []
  const duplicates: DuplicatePair[] = []

  for (const row of incoming) {
    const match = existing.find(b =>
      normalizeVendor(b.vendor) === normalizeVendor(row.vendor) &&
      (b.due_date || null) === (row.due_date || null)
    )
    if (match) duplicates.push({ existing: match, incoming: row })
    else newBills.push(row)
  }

  return { newBills, duplicates }
}

export default function BillsImportModal({ onClose, onComplete, existingBills }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('picking')
  const [fileName, setFileName] = useState<string>('')
  const [valid, setValid] = useState<ParsedBill[]>([])
  const [invalid, setInvalid] = useState<InvalidRow[]>([])
  const [newBills, setNewBills] = useState<ParsedBill[]>([])
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
  const [overwriteMode, setOverwriteMode] = useState<'overwrite' | 'skip'>('overwrite')
  const [showErrors, setShowErrors] = useState(false)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setPhase('parsing')
    setFileName(file.name)
    try {
      const result = await parseBillsFile(file)
      setValid(result.valid)
      setInvalid(result.invalid)

      const { newBills: nb, duplicates: dup } = detectDuplicates(result.valid, existingBills)
      setNewBills(nb)
      setDuplicates(dup)

      setPhase('preview')
    } catch {
      toast('Failed to read file', 'error')
      setPhase('picking')
    }
  }

  async function runImport() {
    setPhase('importing')
    setImportError('')
    try {
      // 1. Insert new bills
      let insertedCount = 0
      if (newBills.length > 0) {
        const res = await fetch('/api/bills/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bills: newBills }),
        })
        const data = await res.json()
        if (!res.ok) {
          setImportError(data.error || 'Import failed')
          setPhase(duplicates.length > 0 ? 'overwrite' : 'preview')
          return
        }
        insertedCount = (data.inserted || []).length
      }

      // 2. Update duplicates if user chose to overwrite
      let updatedCount = 0
      if (overwriteMode === 'overwrite' && duplicates.length > 0) {
        for (const pair of duplicates) {
          const res = await fetch(`/api/bills/${pair.existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendor: pair.incoming.vendor,
              amount: pair.incoming.amount,
              currency: pair.incoming.currency,
              category: pair.incoming.category,
              due_date: pair.incoming.due_date,
              status: pair.incoming.status,
              description: pair.incoming.description,
              payment_method: pair.incoming.payment_method,
              notes: pair.incoming.notes,
              paid_date: pair.incoming.paid_date,
            }),
          })
          if (res.ok) updatedCount++
        }
      }

      // Toast summary
      const skippedCount = overwriteMode === 'skip' ? duplicates.length : 0
      const invalidSkipped = invalid.length

      const parts: string[] = []
      if (insertedCount) parts.push(`${insertedCount} new`)
      if (updatedCount) parts.push(`${updatedCount} overwritten`)
      if (skippedCount) parts.push(`${skippedCount} duplicates skipped`)
      if (invalidSkipped) parts.push(`${invalidSkipped} invalid skipped`)
      const msg = parts.length ? `Imported ${parts.join(', ')}` : 'No bills imported'
      toast(msg, insertedCount + updatedCount > 0 ? 'success' : 'error')

      router.refresh()
      onComplete?.(insertedCount + updatedCount)
      onClose()
    } catch {
      setImportError('Network error — please try again')
      setPhase(duplicates.length > 0 ? 'overwrite' : 'preview')
    }
  }

  function handleConfirmPreview() {
    // If there are duplicates, show the overwrite review screen
    if (duplicates.length > 0) {
      setPhase('overwrite')
    } else {
      runImport()
    }
  }

  const totalInFile = valid.length + invalid.length
  const fmtCurrency = (amt: number, cur: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amt)
  const fmtDate = (d: string | null) => d ? new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">
            {phase === 'overwrite' ? 'Overwrite existing bills?' : 'Import Bills'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {/* ── Picking ── */}
          {phase === 'picking' && (
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-xl py-10 text-center hover:border-white/20 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-white font-medium">Click to choose a file</p>
                <p className="text-xs text-gray-500 mt-1">Supports .xlsx and .csv</p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Need the format?{' '}
                  <button onClick={exportTemplate} className="text-emerald-400 hover:text-emerald-300 underline">
                    Download template
                  </button>
                </p>
              </div>

              <div className="mt-4 bg-white/[0.03] rounded-lg p-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Columns</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-white">Vendor*</span>, <span className="text-white">Amount*</span>, Currency, Category, Due Date, Status, Description, Payment Method, Paid Date, Notes
                </p>
                <p className="text-[11px] text-gray-600 mt-2">Duplicates are detected by matching Vendor + Due Date.</p>
              </div>
            </div>
          )}

          {/* ── Parsing ── */}
          {phase === 'parsing' && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Reading {fileName}...
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {phase === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div>
                  <p className="text-sm text-white">{fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{totalInFile} row{totalInFile !== 1 ? 's' : ''} parsed</p>
                </div>
                <button onClick={() => { setPhase('picking'); setValid([]); setInvalid([]); setNewBills([]); setDuplicates([]) }} className="text-xs text-gray-500 hover:text-white">
                  Choose different file
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider">New</p>
                  <p className="text-xl font-bold text-white mt-0.5">{newBills.length}</p>
                </div>
                <div className={`rounded-lg px-3 py-2.5 border ${duplicates.length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                  <p className={`text-[10px] uppercase tracking-wider ${duplicates.length > 0 ? 'text-amber-400' : 'text-gray-500'}`}>Duplicates</p>
                  <p className="text-xl font-bold text-white mt-0.5">{duplicates.length}</p>
                </div>
                <div className={`rounded-lg px-3 py-2.5 border ${invalid.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                  <p className={`text-[10px] uppercase tracking-wider ${invalid.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>Invalid</p>
                  <p className="text-xl font-bold text-white mt-0.5">{invalid.length}</p>
                </div>
              </div>

              {duplicates.length > 0 && (
                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-amber-200 leading-relaxed">
                    <span className="font-medium">{duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} detected.</span>{' '}
                    These match existing bills by vendor + due date. You&apos;ll review what gets overwritten in the next step.
                  </p>
                </div>
              )}

              {/* New preview */}
              {newBills.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">New bills (first 5)</p>
                  <div className="bg-card rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 text-left">
                          <th className="px-3 py-2 font-medium">Vendor</th>
                          <th className="px-3 py-2 font-medium text-right">Amount</th>
                          <th className="px-3 py-2 font-medium">Due</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newBills.slice(0, 5).map((b, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-2 text-white">{b.vendor}</td>
                            <td className="px-3 py-2 text-right text-white font-mono">{fmtCurrency(b.amount, b.currency)}</td>
                            <td className="px-3 py-2 text-gray-400">{b.due_date || '—'}</td>
                            <td className="px-3 py-2 text-gray-400">{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {invalid.length > 0 && (
                <div className="mb-4">
                  <button onClick={() => setShowErrors(!showErrors)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    {showErrors ? '▾' : '▸'} {invalid.length} row{invalid.length !== 1 ? 's' : ''} with errors (will be skipped)
                  </button>
                  {showErrors && (
                    <div className="mt-2 bg-white/[0.03] rounded-lg px-3 py-2 max-h-40 overflow-y-auto space-y-1">
                      {invalid.map(r => (
                        <div key={r.row} className="text-xs">
                          <span className="text-gray-500">Row {r.row}:</span>{' '}
                          <span className="text-red-400">{r.errors.join('; ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {importError && <p className="text-red-400 text-sm mb-3">{importError}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
                <button
                  onClick={handleConfirmPreview}
                  disabled={newBills.length === 0 && duplicates.length === 0}
                  className="flex-1 py-2 px-4 bg-emerald-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-all"
                >
                  {duplicates.length > 0 ? 'Continue' : `Import ${newBills.length} bill${newBills.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* ── Overwrite review ── */}
          {phase === 'overwrite' && (
            <div>
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-amber-200 leading-relaxed">
                  <span className="font-medium">{duplicates.length} bill{duplicates.length !== 1 ? 's' : ''} already exist</span> with the same vendor and due date. Review what will change below.
                </p>
              </div>

              <div className="mb-4 max-h-[320px] overflow-y-auto space-y-2">
                {duplicates.map((pair, i) => {
                  const changes: string[] = []
                  if (pair.existing.amount !== pair.incoming.amount) changes.push('amount')
                  if (pair.existing.status !== pair.incoming.status) changes.push('status')
                  if ((pair.existing.category || '') !== (pair.incoming.category || '')) changes.push('category')
                  if ((pair.existing.description || '') !== (pair.incoming.description || '')) changes.push('description')
                  if ((pair.existing.notes || '') !== (pair.incoming.notes || '')) changes.push('notes')
                  if ((pair.existing.paid_date || '') !== (pair.incoming.paid_date || '')) changes.push('paid date')

                  return (
                    <div key={i} className="bg-card rounded-lg p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{pair.incoming.vendor}</p>
                        <p className="text-xs text-gray-500">{fmtDate(pair.incoming.due_date)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/[0.03] rounded px-2.5 py-2">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current</p>
                          <p className="text-gray-300 font-mono">{fmtCurrency(pair.existing.amount, pair.existing.currency)}</p>
                          <p className="text-gray-500 capitalize mt-0.5">{pair.existing.status}</p>
                          {pair.existing.category && <p className="text-gray-500 truncate">{pair.existing.category}</p>}
                        </div>
                        <div className="bg-emerald-500/[0.08] rounded px-2.5 py-2 border border-emerald-500/15">
                          <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Will become</p>
                          <p className={`font-mono ${pair.existing.amount !== pair.incoming.amount ? 'text-emerald-400' : 'text-gray-300'}`}>
                            {fmtCurrency(pair.incoming.amount, pair.incoming.currency)}
                          </p>
                          <p className={`capitalize mt-0.5 ${pair.existing.status !== pair.incoming.status ? 'text-emerald-400' : 'text-gray-500'}`}>{pair.incoming.status}</p>
                          {pair.incoming.category && <p className={`truncate ${(pair.existing.category || '') !== pair.incoming.category ? 'text-emerald-400' : 'text-gray-500'}`}>{pair.incoming.category}</p>}
                        </div>
                      </div>
                      {changes.length > 0 && (
                        <p className="text-[10px] text-amber-400 mt-2">
                          Changes: {changes.join(', ')}
                        </p>
                      )}
                      {changes.length === 0 && (
                        <p className="text-[10px] text-gray-600 mt-2">No changes — identical to existing</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setOverwriteMode('overwrite')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${overwriteMode === 'overwrite' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'}`}
                >
                  Overwrite all duplicates
                </button>
                <button
                  onClick={() => setOverwriteMode('skip')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${overwriteMode === 'skip' ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'}`}
                >
                  Skip duplicates, import new only
                </button>
              </div>

              {importError && <p className="text-red-400 text-sm mb-3">{importError}</p>}

              <div className="flex gap-3">
                <button onClick={() => setPhase('preview')} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Back</button>
                <button
                  onClick={runImport}
                  className="flex-1 py-2 px-4 bg-emerald-500 hover:brightness-110 text-white font-medium rounded-lg text-sm transition-all"
                >
                  {overwriteMode === 'overwrite'
                    ? `Import ${newBills.length} new, overwrite ${duplicates.length}`
                    : `Import ${newBills.length} new, skip ${duplicates.length}`}
                </button>
              </div>
            </div>
          )}

          {/* ── Importing ── */}
          {phase === 'importing' && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Importing...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
