import * as XLSX from 'xlsx'
import type { Bill } from '@/lib/types'

const VALID_STATUSES = ['pending', 'approved', 'paid', 'rejected', 'overdue'] as const
type BillStatus = typeof VALID_STATUSES[number]

// Columns — single source of truth for export + import
export const EXCEL_COLUMNS = [
  { key: 'vendor',         header: 'Vendor',         required: true,  width: 24 },
  { key: 'amount',         header: 'Amount',         required: true,  width: 12 },
  { key: 'currency',       header: 'Currency',       required: false, width: 10 },
  { key: 'category',       header: 'Category',       required: false, width: 18 },
  { key: 'due_date',       header: 'Due Date',       required: false, width: 14 },
  { key: 'status',         header: 'Status',         required: false, width: 12 },
  { key: 'description',    header: 'Description',    required: false, width: 30 },
  { key: 'payment_method', header: 'Payment Method', required: false, width: 16 },
  { key: 'paid_date',      header: 'Paid Date',      required: false, width: 14 },
  { key: 'notes',          header: 'Notes',          required: false, width: 30 },
] as const

export interface ParsedBill {
  vendor: string
  amount: number
  currency: string
  category: string | null
  due_date: string | null
  status: BillStatus
  description: string | null
  payment_method: string | null
  paid_date: string | null
  notes: string | null
}

export interface InvalidRow {
  row: number
  errors: string[]
  data: Record<string, unknown>
}

// ── Date helpers ──
function toIsoDate(v: unknown): string | null {
  if (v == null || v === '') return null
  // Already a string
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (!trimmed) return null
    // Already ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    // Parse other formats
    const d = new Date(trimmed)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0]
  }
  // Number = Excel serial date
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  // Date object
  if (v instanceof Date) return v.toISOString().split('T')[0]
  return null
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Header normalizer ──
function normalizeKey(key: string): string {
  return key.toString().toLowerCase().replace(/[\s_-]+/g, '_').trim()
}

function findValue(row: Record<string, unknown>, ...candidates: string[]): unknown {
  // Try exact, then normalized
  for (const c of candidates) {
    if (c in row && row[c] != null && row[c] !== '') return row[c]
  }
  // Scan all keys with normalization
  const normalizedRow: Record<string, unknown> = {}
  for (const k of Object.keys(row)) {
    normalizedRow[normalizeKey(k)] = row[k]
  }
  for (const c of candidates) {
    const norm = normalizeKey(c)
    if (norm in normalizedRow && normalizedRow[norm] != null && normalizedRow[norm] !== '') {
      return normalizedRow[norm]
    }
  }
  return null
}

// ── Amount parser (strip $, commas, spaces) ──
function parseAmount(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return isFinite(v) ? v : null
  if (typeof v === 'string') {
    const cleaned = v.replace(/[$,\s]/g, '').trim()
    if (!cleaned) return null
    const n = parseFloat(cleaned)
    return isFinite(n) ? n : null
  }
  return null
}

// ── Row validator ──
function validateRow(row: Record<string, unknown>, rowNumber: number): { valid: ParsedBill } | { invalid: InvalidRow } {
  const errors: string[] = []

  const vendor = findValue(row, 'vendor', 'Vendor')
  const amountRaw = findValue(row, 'amount', 'Amount')
  const currencyRaw = findValue(row, 'currency', 'Currency')
  const category = findValue(row, 'category', 'Category')
  const dueDateRaw = findValue(row, 'due_date', 'Due Date')
  const statusRaw = findValue(row, 'status', 'Status')
  const description = findValue(row, 'description', 'Description')
  const paymentMethod = findValue(row, 'payment_method', 'Payment Method')
  const paidDateRaw = findValue(row, 'paid_date', 'Paid Date')
  const notes = findValue(row, 'notes', 'Notes')

  // Vendor
  const vendorStr = vendor ? String(vendor).trim() : ''
  if (!vendorStr) errors.push('Vendor is required')

  // Amount
  const amount = parseAmount(amountRaw)
  if (amount == null) errors.push('Amount must be a number')
  else if (amount < 0) errors.push('Amount must be non-negative')

  // Currency
  let currency = 'USD'
  if (currencyRaw) {
    const cc = String(currencyRaw).trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(cc)) errors.push(`Currency "${currencyRaw}" must be a 3-letter code`)
    else currency = cc
  }

  // Due date
  const due_date = dueDateRaw ? toIsoDate(dueDateRaw) : null
  if (dueDateRaw && !due_date) errors.push(`Due Date "${dueDateRaw}" is not a valid date`)

  // Paid date
  const paid_date = paidDateRaw ? toIsoDate(paidDateRaw) : null
  if (paidDateRaw && !paid_date) errors.push(`Paid Date "${paidDateRaw}" is not a valid date`)

  // Status
  let status: BillStatus = 'pending'
  if (statusRaw) {
    const s = String(statusRaw).trim().toLowerCase()
    if (VALID_STATUSES.includes(s as BillStatus)) status = s as BillStatus
    else errors.push(`Status "${statusRaw}" must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  // Status/paid_date guardrails
  let finalPaidDate = paid_date
  if (status === 'paid' && !finalPaidDate) finalPaidDate = todayIso()
  if (status !== 'paid' && finalPaidDate) {
    errors.push(`Paid Date is set but Status is "${status}" — set Status to "paid" or clear Paid Date`)
  }

  // String length guards
  const MAX = 500
  for (const [label, val] of [['Category', category], ['Description', description], ['Payment Method', paymentMethod], ['Notes', notes]] as const) {
    if (val && String(val).length > MAX) errors.push(`${label} exceeds ${MAX} characters`)
  }

  if (errors.length > 0) {
    return { invalid: { row: rowNumber, errors, data: row } }
  }

  return {
    valid: {
      vendor: vendorStr,
      amount: amount!,
      currency,
      category: category ? String(category).trim() : null,
      due_date,
      status,
      description: description ? String(description).trim() : null,
      payment_method: paymentMethod ? String(paymentMethod).trim() : null,
      paid_date: finalPaidDate,
      notes: notes ? String(notes).trim() : null,
    },
  }
}

// ── Export all bills to xlsx ──
export function exportBillsToXlsx(bills: Bill[]): void {
  const rows = bills.map(b => ({
    Vendor: b.vendor,
    Amount: b.amount,
    Currency: b.currency,
    Category: b.category || '',
    'Due Date': b.due_date || '',
    Status: b.status,
    Description: b.description || '',
    'Payment Method': b.payment_method || '',
    'Paid Date': b.paid_date || '',
    Notes: b.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: EXCEL_COLUMNS.map(c => c.header),
  })

  // Column widths
  ws['!cols'] = EXCEL_COLUMNS.map(c => ({ wch: c.width }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bills')

  XLSX.writeFile(wb, `nexus-cash-flow-${todayIso()}.xlsx`)
}

// ── Download a blank template with 1 sample row ──
export function exportTemplate(): void {
  const sample = [{
    Vendor: 'Con Edison',
    Amount: 450.00,
    Currency: 'USD',
    Category: 'Utilities',
    'Due Date': '2026-05-01',
    Status: 'pending',
    Description: 'May electric bill',
    'Payment Method': 'ACH',
    'Paid Date': '',
    Notes: '',
  }]

  const ws = XLSX.utils.json_to_sheet(sample, {
    header: EXCEL_COLUMNS.map(c => c.header),
  })
  ws['!cols'] = EXCEL_COLUMNS.map(c => ({ wch: c.width }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bills Template')
  XLSX.writeFile(wb, 'nexus-cash-flow-template.xlsx')
}

// ── Parse a file (xlsx/csv) and return valid/invalid rows ──
export async function parseBillsFile(file: File): Promise<{ valid: ParsedBill[]; invalid: InvalidRow[] }> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  const firstSheet = wb.Sheets[wb.SheetNames[0]]
  if (!firstSheet) return { valid: [], invalid: [] }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    raw: false,
    defval: null,
  })

  const valid: ParsedBill[] = []
  const invalid: InvalidRow[] = []

  rows.forEach((row, i) => {
    // Skip fully-empty rows
    const hasContent = Object.values(row).some(v => v != null && v !== '')
    if (!hasContent) return

    const result = validateRow(row, i + 2) // +2 because Excel rows start at 1 and row 1 is the header
    if ('valid' in result) valid.push(result.valid)
    else invalid.push(result.invalid)
  })

  return { valid, invalid }
}
