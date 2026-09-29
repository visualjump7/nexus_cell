import type { createClient } from '@/utils/supabase/server'
import type { Gift, Membership, Subscription } from '@/lib/types'
import type { SiteProject, SiteProjectStatus } from '@/lib/site-map'

type Supabase = ReturnType<typeof createClient>

// Server-side loader shared by /site-map and its (home) overlay.
// Four queries in parallel: projects, budget lines, project alerts and the
// Clubhouse tab lists. Budgets have no organization_id, so they are fetched by
// the org's project ids and summed per project here in JS.
//
// Tasks have no project link in the schema (no project_id / related_id), so
// per-project open task counts are not available and stay null.
export async function getSiteMapData(supabase: Supabase, orgId: string) {
  const [projectsRes, giftsRes, subsRes, memsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_type, status, location, description, latitude, longitude')
      .eq('organization_id', orgId)
      .order('name', { ascending: true }),
    supabase.from('gifts').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').eq('organization_id', orgId).order('next_renewal', { ascending: true }),
    supabase.from('memberships').select('*').eq('organization_id', orgId).order('expiry_date', { ascending: true }),
  ])

  const rows = projectsRes.data || []
  const ids = rows.map(r => r.id as string)

  const [budgetsRes, alertsRes] = ids.length
    ? await Promise.all([
        supabase.from('budgets').select('project_id, budgeted, actual').in('project_id', ids),
        supabase
          .from('alerts')
          .select('related_id')
          .eq('organization_id', orgId)
          .eq('related_type', 'project')
          .in('status', ['open', 'acknowledged'])
          .in('related_id', ids),
      ])
    : [{ data: [] }, { data: [] }]

  const budget = new Map<string, { budgeted: number; actual: number }>()
  for (const b of (budgetsRes.data || []) as { project_id: string; budgeted: number | string | null; actual: number | string | null }[]) {
    const cur = budget.get(b.project_id) || { budgeted: 0, actual: 0 }
    cur.budgeted += Number(b.budgeted) || 0
    cur.actual += Number(b.actual) || 0
    budget.set(b.project_id, cur)
  }

  const alerts = new Map<string, number>()
  for (const a of (alertsRes.data || []) as { related_id: string | null }[]) {
    if (a.related_id) alerts.set(a.related_id, (alerts.get(a.related_id) || 0) + 1)
  }

  const toNum = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)

  const projects: SiteProject[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    project_type: r.project_type,
    status: r.status as SiteProjectStatus,
    location: r.location,
    description: r.description,
    latitude: toNum(r.latitude),
    longitude: toNum(r.longitude),
    budgeted: budget.get(r.id)?.budgeted || 0,
    actual: budget.get(r.id)?.actual || 0,
    activeAlerts: alerts.get(r.id) || 0,
    openTasks: null,
  }))

  return {
    projects,
    gifts: (giftsRes.data || []) as Gift[],
    subscriptions: (subsRes.data || []) as Subscription[],
    memberships: (memsRes.data || []) as Membership[],
  }
}
