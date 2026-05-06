import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

// GET /api/projects/types
// Returns distinct, non-null project_type values across the org's projects,
// ordered by frequency (most-used first). Drives the type combobox in the
// project create/edit modal so users see the types their team already uses
// without forcing a curated list.
export async function GET() {
  const { supabase, orgId } = await getAuthContext()

  const { data, error } = await supabase
    .from('projects')
    .select('project_type')
    .eq('organization_id', orgId)
    .not('project_type', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Tally + sort by frequency desc, then alpha
  const counts = new Map<string, number>()
  for (const row of data || []) {
    const t = (row.project_type || '').trim()
    if (!t) continue
    counts.set(t, (counts.get(t) || 0) + 1)
  }

  const types = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)

  return NextResponse.json({ types })
}
