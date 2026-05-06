import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { testIcsUrl } from '@/lib/calendar-sync'

// POST /api/external-calendars/test
// Pings an ICS URL without saving so the user catches typos / bad URLs
// before committing. Body: { ics_url }
export async function POST(request: Request) {
  const { role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const ics_url = String(body?.ics_url || '').trim()
  if (!ics_url) return NextResponse.json({ error: 'ics_url required' }, { status: 400 })

  const result = await testIcsUrl(ics_url)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
