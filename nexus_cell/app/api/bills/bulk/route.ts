import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const MAX_BULK = 500

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership || !['ea', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const inputBills: Record<string, unknown>[] = Array.isArray(body?.bills) ? body.bills : []

  if (inputBills.length === 0) {
    return NextResponse.json({ error: 'No bills provided' }, { status: 400 })
  }
  if (inputBills.length > MAX_BULK) {
    return NextResponse.json({ error: `Maximum ${MAX_BULK} bills per import` }, { status: 400 })
  }

  // Shape rows — server-side stamping
  const rows = inputBills.map(b => ({
    organization_id: membership.organization_id,
    created_by: user.id,
    vendor: b.vendor,
    description: b.description ?? null,
    amount: b.amount,
    currency: b.currency || 'USD',
    status: b.status || 'pending',
    category: b.category ?? null,
    due_date: b.due_date ?? null,
    paid_date: b.paid_date ?? null,
    payment_method: b.payment_method ?? null,
    notes: b.notes ?? null,
  }))

  // Try single bulk insert first
  const { data, error } = await supabase.from('bills').insert(rows).select()

  if (!error) {
    return NextResponse.json({ inserted: data || [], failed: [] }, { status: 201 })
  }

  // Bulk failed — fall back to per-row inserts so we can report which failed
  const inserted: unknown[] = []
  const failed: { index: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const { data: row, error: rowErr } = await supabase.from('bills').insert(rows[i]).select().single()
    if (rowErr) failed.push({ index: i, error: rowErr.message })
    else inserted.push(row)
  }

  return NextResponse.json({ inserted, failed }, { status: 201 })
}
