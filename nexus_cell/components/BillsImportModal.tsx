'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import { parseBillsFile, exportTemplate, type ParsedBill, type InvalidRow } from '@/lib/billsExcel'
import type { Bill } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  RpModal, RpButton, RpTabs, RpTag, RpSource, RpTable, RpStatus, RpStatStrip, RpStat, RpLoading,
  FileSpreadsheet, ChevronDown, ChevronRight, RP_ICON,
  fmtMoney, fmtDate, dot,
} from '@/components/rp'

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

/** The striped ground the dropzone sits on (same idiom as the project uploader). */
const DROPZONE_BG = 'bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(205,161,75,.05)_14px_28px)]'

const STEPS = [
  { id: 'choose', num: '01', label: 'Choose file' },
  { id: 'review', num: '02', label: 'Review' },
  { id: 'duplicates', num: '03', label: 'Duplicates' },
  { id: 'import', num: '04', label: 'Import' },
]

function stepFor(phase: Phase): string {
  if (phase === 'picking') return 'choose'
  if (phase === 'parsing' || phase === 'preview') return 'review'
  if (phase === 'overwrite') return 'duplicates'
  return 'import'
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
  const [dragOver, setDragOver] = useState(false)
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
      setImportError('Network error. Try again.')
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

  function resetToPicking() {
    setPhase('picking')
    setValid([])
    setInvalid([])
    setNewBills([])
    setDuplicates([])
  }

  const totalInFile = valid.length + invalid.length
  const money = (amt: number, cur: string) => fmtMoney(amt, { currency: cur })
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

  let footer: React.ReactNode = null
  if (phase === 'picking') {
    footer = <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
  } else if (phase === 'preview') {
    footer = (
      <>
        <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
        <RpButton onClick={handleConfirmPreview} disabled={newBills.length === 0 && duplicates.length === 0}>
          {duplicates.length > 0 ? 'Continue' : `Import ${plural(newBills.length, 'bill')}`}
        </RpButton>
      </>
    )
  } else if (phase === 'overwrite') {
    footer = (
      <>
        <RpButton variant="ghost" onClick={() => setPhase('preview')}>Back</RpButton>
        <RpButton onClick={runImport}>
          {overwriteMode === 'overwrite'
            ? `Import ${newBills.length} new, overwrite ${duplicates.length}`
            : `Import ${newBills.length} new, skip ${duplicates.length}`}
        </RpButton>
      </>
    )
  }

  return (
    <>
      {/* Lives outside the dialog so the modal's autofocus lands on a real control. */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      <RpModal
        open
        onClose={onClose}
        size="xl"
        eyebrow="Financial · Import"
        title={phase === 'overwrite' ? 'Overwrite existing bills?' : 'Import bills'}
        footer={footer}
      >
        <RpTabs
          size="sm"
          ariaLabel="Import steps"
          value={stepFor(phase)}
          onChange={() => {}}
          items={STEPS.map(s => ({ ...s, disabled: true }))}
          scroll
          className="[&_[aria-pressed=true]]:!opacity-100"
        />

        {/* ── Picking ── */}
        {phase === 'picking' && (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
              className={cn(
                'rp-box relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 px-6 py-10 text-center transition-colors duration-200',
                DROPZONE_BG,
                dragOver ? 'border-rp-gold bg-[rgba(205,161,75,.06)]' : 'hover:border-rp-line3',
              )}
            >
              <FileSpreadsheet size={24} strokeWidth={RP_ICON.strokeWidth} aria-hidden className="text-rp-muted" />
              <RpTag tone="gold">Drop an Excel or CSV file</RpTag>
              <p className="text-[13px] text-rp-muted">XLSX, XLS or CSV · one bill per row</p>
              <RpButton
                variant="ghost"
                size="sm"
                onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
              >
                Choose file
              </RpButton>
            </div>

            <div className="rp-inset flex flex-col gap-3 p-5">
              <span className="rp-eyebrow--muted">Columns</span>
              <p className="text-sm leading-relaxed text-rp-muted">
                <span className="text-rp-text">Vendor</span>, <span className="text-rp-text">Amount</span>, Currency, Category, Due Date, Status, Description, Payment Method, Paid Date, Notes
              </p>
              <p className="text-xs text-rp-dim">Vendor and Amount are required. Duplicates are matched on vendor and due date.</p>
            </div>

            <RpSource tag="Template">
              Need the format?{' '}
              <button type="button" onClick={exportTemplate} className="rp-link text-rp-text underline decoration-rp-line3 underline-offset-4">Download the template</button>
            </RpSource>
          </>
        )}

        {/* ── Parsing ── */}
        {phase === 'parsing' && <RpLoading label={`Reading ${fileName}`} />}

        {/* ── Preview ── */}
        {phase === 'preview' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rp-line pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet size={RP_ICON.size} strokeWidth={RP_ICON.strokeWidth} aria-hidden className="shrink-0 text-rp-muted" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-rp-text">{fileName}</p>
                  <p className="text-[13px] text-rp-muted">{plural(totalInFile, 'row')} parsed</p>
                </div>
              </div>
              <RpButton variant="text" size="sm" onClick={resetToPicking}>Choose another file</RpButton>
            </div>

            <RpStatStrip cols={3}>
              <RpStat label="New" value={newBills.length} sub="Added as new bills" />
              <RpStat label="Duplicates" value={duplicates.length} sub="Match vendor and due date" />
              <RpStat label="Invalid" value={invalid.length} tone={invalid.length > 0 ? 'alert' : 'default'} sub="Skipped on import" />
            </RpStatStrip>

            <div className="flex flex-col gap-2.5">
              {newBills.length > 0 && (
                <RpSource tag={`Ready ${newBills.length}`} tone="green">
                  {plural(newBills.length, 'bill')} will be added
                </RpSource>
              )}
              {duplicates.length > 0 && (
                <RpSource tag={`Check ${duplicates.length}`} tone="gold">
                  {duplicates.length === 1 ? 'Matches an existing bill' : 'Match existing bills'} by vendor and due date · you review what changes next
                </RpSource>
              )}
              {invalid.length > 0 && (
                <RpSource tag={`Errors ${invalid.length}`} tone="alert">
                  {plural(invalid.length, 'row')} with errors will be skipped
                </RpSource>
              )}
            </div>

            {/* New preview */}
            {newBills.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="rp-eyebrow--muted">New bills · first {Math.min(5, newBills.length)}</span>
                <RpTable dense minWidth={560} caption="New bills preview">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th className="num">Amount</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newBills.slice(0, 5).map((b, i) => (
                      <tr key={i}>
                        <td>{b.vendor}</td>
                        <td className="num">{money(b.amount, b.currency)}</td>
                        <td className="whitespace-nowrap text-rp-muted">{fmtDate(b.due_date)}</td>
                        <td><RpStatus kind="bill" value={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </RpTable>
              </div>
            )}

            {/* Errors */}
            {invalid.length > 0 && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowErrors(!showErrors)}
                  aria-expanded={showErrors}
                  className="inline-flex items-center gap-1.5 self-start font-display text-xs uppercase tracking-[.14em] text-rp-alert transition-colors hover:text-rp-text"
                >
                  {showErrors
                    ? <ChevronDown size={14} strokeWidth={RP_ICON.strokeWidth} aria-hidden />
                    : <ChevronRight size={14} strokeWidth={RP_ICON.strokeWidth} aria-hidden />}
                  {plural(invalid.length, 'row')} with errors
                </button>
                {showErrors && (
                  <ul className="rp-inset flex max-h-40 flex-col overflow-y-auto">
                    {invalid.map(r => (
                      <li key={r.row} className="flex gap-3 border-b border-rp-line px-4 py-2 text-[13px] last:border-b-0">
                        <span className="w-14 shrink-0 font-display tracking-[.08em] tabular-nums text-rp-dim">Row {r.row}</span>
                        <span className="text-rp-alert">{r.errors.join('; ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {importError && <p className="rp-error" role="alert">{importError}</p>}
          </>
        )}

        {/* ── Overwrite review ── */}
        {phase === 'overwrite' && (
          <>
            <RpSource tag={`Check ${duplicates.length}`} tone="gold">
              {plural(duplicates.length, 'bill')} already {duplicates.length === 1 ? 'exists' : 'exist'} with the same vendor and due date · review what changes
            </RpSource>

            <RpTabs
              ariaLabel="Duplicates"
              value={overwriteMode}
              onChange={id => setOverwriteMode(id as 'overwrite' | 'skip')}
              items={[
                { id: 'overwrite', label: 'Overwrite all duplicates' },
                { id: 'skip', label: 'Skip duplicates, import new only' },
              ]}
            />

            <ol className="flex flex-col border-t border-rp-line">
              {duplicates.map((pair, i) => {
                const changes: string[] = []
                if (pair.existing.amount !== pair.incoming.amount) changes.push('amount')
                if (pair.existing.status !== pair.incoming.status) changes.push('status')
                if ((pair.existing.category || '') !== (pair.incoming.category || '')) changes.push('category')
                if ((pair.existing.description || '') !== (pair.incoming.description || '')) changes.push('description')
                if ((pair.existing.notes || '') !== (pair.incoming.notes || '')) changes.push('notes')
                if ((pair.existing.paid_date || '') !== (pair.incoming.paid_date || '')) changes.push('paid date')
                const amountChanged = pair.existing.amount !== pair.incoming.amount
                const statusChanged = pair.existing.status !== pair.incoming.status
                const categoryChanged = (pair.existing.category || '') !== (pair.incoming.category || '')

                return (
                  <li key={i} className="flex flex-col gap-3 border-b border-rp-line py-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[13px] tracking-[.08em] text-rp-gold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium text-rp-text">{pair.incoming.vendor}</span>
                      <span className="text-[13px] text-rp-muted">Due {fmtDate(pair.incoming.due_date)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rp-inset flex flex-col gap-1.5 px-4 py-3">
                        <span className="rp-eyebrow--muted">Current</span>
                        <span className="text-[15px] tabular-nums text-rp-text">{money(pair.existing.amount, pair.existing.currency)}</span>
                        <span className="flex flex-wrap items-center gap-2 text-[13px] text-rp-muted">
                          <RpStatus kind="bill" value={pair.existing.status} />
                          {pair.existing.category && <span className="truncate">{pair.existing.category}</span>}
                        </span>
                      </div>
                      <div className="rp-inset flex flex-col gap-1.5 border-rp-gold/40 px-4 py-3">
                        <span className="rp-eyebrow--muted !text-rp-gold">Will become</span>
                        <span className={cn('text-[15px] tabular-nums', amountChanged ? 'text-rp-gold' : 'text-rp-text')}>
                          {money(pair.incoming.amount, pair.incoming.currency)}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-[13px] text-rp-muted">
                          <RpStatus kind="bill" value={pair.incoming.status} className={statusChanged ? undefined : 'opacity-70'} />
                          {pair.incoming.category && (
                            <span className={cn('truncate', categoryChanged && 'text-rp-gold')}>{pair.incoming.category}</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <p className={cn('text-xs', changes.length > 0 ? 'text-rp-gold' : 'text-rp-dim')}>
                      {changes.length > 0 ? dot('Changes', changes.join(', ')) : 'No changes · identical to the existing bill'}
                    </p>
                  </li>
                )
              })}
            </ol>

            {importError && <p className="rp-error" role="alert">{importError}</p>}
          </>
        )}

        {/* ── Importing ── */}
        {phase === 'importing' && <RpLoading label="Importing" />}
      </RpModal>
    </>
  )
}
