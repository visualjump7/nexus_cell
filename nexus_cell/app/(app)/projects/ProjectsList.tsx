'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project, ProjectFile, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import ProjectTypeCombobox from '@/components/project-detail/ProjectTypeCombobox'
import ProjectFilesUploader from '@/components/project-detail/ProjectFilesUploader'
import { BRAND } from '@/lib/brand'
import { sectionEyebrow } from '@/lib/sections'
import { getProjectImagery } from '@/lib/project-imagery'
import { cn } from '@/lib/utils'
import {
  RpPage, RpPageHeader, RpStatStrip, RpStat, RpFilterBar, RpTabs, RpGroup, RpGroupHead,
  RpCardGrid, RpFigure, RpCapNum, RpStatus, RpMeter, RpTable, RpButton, RpEmpty, RpModal,
  RpField, RpInput, RpSelect, RpTextarea, RpFormGrid,
  Plus, RP_ICON, dot, fmtMoney, fmtPct, pad2, statusLabel,
  type RpImage,
} from '@/components/rp'

/** A project row, optionally with its budget lines embedded (`select('*, budgets(budgeted, actual)')`). */
export type ProjectWithBudgets = Project & { budgets?: { budgeted: number; actual: number }[] | null }

interface Props { projects: ProjectWithBudgets[]; role: UserRole; orgId: string }

const STATUS_ORDER = ['active', 'on_hold', 'completed', 'archived'] as const
const OTHER_TYPE = 'Other packages'

interface Row {
  p: ProjectWithBudgets
  budget: number
  actual: number
  ratio: number
}

function toRow(p: ProjectWithBudgets): Row {
  let budget = 0
  let actual = 0
  for (const b of p.budgets ?? []) {
    budget += Number(b.budgeted) || 0
    actual += Number(b.actual) || 0
  }
  return { p, budget, actual, ratio: budget > 0 ? actual / budget : NaN }
}

/**
 * Card heroes in display order. Each package shows its own lead image; when an
 * earlier card in the same list already shows it, the package's next unused
 * image is used instead (never a drawing), so a group repeats a picture only
 * when the data leaves no other choice.
 */
function heroesFor(rows: Row[]): Map<string, RpImage> {
  const out = new Map<string, RpImage>()
  const used = new Set<string>()
  for (const r of rows) {
    const img = getProjectImagery(r.p)
    let hero = img.hero
    if (used.has(hero.src)) {
      const alt = img.gallery.find(g => !used.has(g.src) && !g.mat)
      if (alt) hero = alt
    }
    out.set(r.p.id, hero)
    used.add(hero.src)
  }
  return out
}

function sum(rows: Row[]) {
  const budget = rows.reduce((s, r) => s + r.budget, 0)
  const actual = rows.reduce((s, r) => s + r.actual, 0)
  return { budget, actual, ratio: budget > 0 ? actual / budget : NaN }
}

export default function ProjectsList({ projects, role, orgId }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [grouping, setGrouping] = useState<'type' | 'none'>('type')
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [showForm, setShowForm] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [deletingProj, setDeletingProj] = useState<Project | null>(null)

  // Budget figures only when the page embedded the budget lines.
  const hasBudgets = projects.some(p => Array.isArray(p.budgets))
  const rows = useMemo(() => projects.map(toRow), [projects])
  const filtered = rows.filter(r => statusFilter === 'all' || r.p.status === statusFilter)

  const total = sum(rows)
  const overBudget = rows.filter(r => r.budget > 0 && r.actual > r.budget)
  const overBy = overBudget.reduce((s, r) => s + (r.actual - r.budget), 0)
  const countOf = (s: string) => rows.filter(r => r.p.status === s).length

  // Groups by package type, largest budget first; packages largest first inside.
  const groups = useMemo(() => {
    const map = new Map<string, Row[]>()
    for (const r of filtered) {
      const key = r.p.project_type?.trim() || OTHER_TYPE
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    const list = Array.from(map.entries()).map(([type, items]) => ({
      type,
      items: hasBudgets ? [...items].sort((a, b) => b.budget - a.budget) : items,
      ...sum(items),
    }))
    return list.sort((a, b) => {
      if (a.type === OTHER_TYPE) return 1
      if (b.type === OTHER_TYPE) return -1
      return hasBudgets ? b.budget - a.budget : b.items.length - a.items.length || a.type.localeCompare(b.type)
    })
  }, [filtered, hasBudgets])

  async function handleDelete() {
    if (!deletingProj) return
    await fetch(`/api/projects/${deletingProj.id}`, { method: 'DELETE' })
    setDeletingProj(null)
    router.refresh()
  }

  const openNew = () => { setEditingProj(null); setShowForm(true) }
  const openEdit = (p: Project) => { setEditingProj(p); setShowForm(true) }

  const n = projects.length
  const pkgs = (k: number) => `${k} package${k === 1 ? '' : 's'}`
  const line = hasBudgets && total.budget > 0
    ? dot(pkgs(n), `${fmtMoney(total.budget, { compact: true })} budgeted`, `${fmtPct(total.ratio)} spent`)
    : `${pkgs(n)} across ${BRAND.site.acres} acres`

  const statusItems = [
    { id: 'all', label: 'All', count: rows.length },
    ...STATUS_ORDER.map(s => ({ id: s, label: statusLabel('project', s), count: countOf(s) })),
  ]

  let running = 0
  const flatHeroes = grouping === 'none' && view === 'cards' ? heroesFor(filtered) : new Map<string, RpImage>()

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('projects')}
        title="The build, package by package"
        line={line}
        actions={canWrite && (
          <RpButton icon={<Plus {...RP_ICON} />} onClick={openNew}>New project</RpButton>
        )}
      />

      {hasBudgets && n > 0 && (
        <RpStatStrip cols={5}>
          <RpStat label="Budget" value={fmtMoney(total.budget, { compact: true })} sub={pkgs(n)} />
          <RpStat
            label="Spent"
            value={fmtMoney(total.actual, { compact: true })}
            sub={`${fmtPct(total.ratio)} of budget`}
            meter={{ value: Number.isFinite(total.ratio) ? total.ratio : 0 }}
          />
          <RpStat
            label="Remaining"
            value={fmtMoney(total.budget - total.actual, { compact: true })}
            sub={total.budget > 0 ? `${fmtPct(1 - total.ratio)} of budget` : undefined}
          />
          <RpStat
            label="Active"
            value={countOf('active')}
            sub={dot(`${countOf('on_hold')} on hold`, `${countOf('completed')} complete`)}
          />
          <RpStat
            label="Over budget"
            value={overBudget.length}
            tone={overBudget.length ? 'alert' : 'default'}
            sub={overBudget.length ? `${fmtMoney(overBy, { compact: true })} over in total` : 'All within budget'}
          />
        </RpStatStrip>
      )}

      {n > 0 && (
        <RpFilterBar count={pkgs(filtered.length)}>
          <RpTabs ariaLabel="Status" items={statusItems} value={statusFilter} onChange={setStatusFilter} className="max-w-full" />
          <RpTabs
            ariaLabel="Grouping"
            size="sm"
            items={[{ id: 'type', label: 'By type' }, { id: 'none', label: 'None' }]}
            value={grouping}
            onChange={id => setGrouping(id as 'type' | 'none')}
          />
          <RpTabs
            ariaLabel="View"
            size="sm"
            items={[{ id: 'cards', label: 'Cards' }, { id: 'table', label: 'Table' }]}
            value={view}
            onChange={id => setView(id as 'cards' | 'table')}
          />
        </RpFilterBar>
      )}

      {n === 0 ? (
        <RpEmpty
          title="No packages yet."
          line="Add the first package to start tracking budget and spend."
          action={canWrite && <RpButton icon={<Plus {...RP_ICON} />} onClick={openNew}>New project</RpButton>}
        />
      ) : filtered.length === 0 ? (
        <RpEmpty
          compact
          title="No packages here."
          line={`Nothing is marked ${statusLabel('project', statusFilter).toLowerCase()} right now.`}
          action={<RpButton variant="ghost" onClick={() => setStatusFilter('all')}>Show all</RpButton>}
        />
      ) : view === 'table' ? (
        <ProjectsTable
          rows={grouping === 'type' ? groups.flatMap(g => g.items) : filtered}
          hasBudgets={hasBudgets}
          canWrite={canWrite}
          onEdit={openEdit}
          onDelete={setDeletingProj}
        />
      ) : grouping === 'type' ? (
        <div className="flex flex-col">
          {groups.map((g, gi) => {
            const heroes = heroesFor(g.items)
            return (
            <RpGroup key={g.type} className="gap-6 pb-10 last:pb-0">
              <RpGroupHead
                num={gi + 1}
                title={g.type}
                line={dot(
                  pkgs(g.items.length),
                  hasBudgets && g.budget > 0 && fmtMoney(g.budget, { compact: true }),
                  hasBudgets && g.budget > 0 && `${fmtPct(g.ratio)} spent`,
                )}
                aside={hasBudgets && g.budget > 0 && (
                  <div className="w-40 max-sm:w-28">
                    <RpMeter value={g.ratio} label={`${g.type} spend`} />
                  </div>
                )}
              />
              <RpCardGrid ruled={false} min={300} max={3} className="max-sm:gap-y-6">
                {g.items.map(r => (
                  <ProjectCard
                    key={r.p.id}
                    row={r}
                    hero={heroes.get(r.p.id)!}
                    num={++running}
                    hasBudgets={hasBudgets}
                    canWrite={canWrite}
                    onEdit={openEdit}
                    onDelete={setDeletingProj}
                  />
                ))}
              </RpCardGrid>
            </RpGroup>
            )
          })}
        </div>
      ) : (
        <RpCardGrid ruled={false} min={300} max={3} className="max-sm:gap-y-6">
          {filtered.map((r, i) => (
            <ProjectCard
              key={r.p.id}
              row={r}
              hero={flatHeroes.get(r.p.id)!}
              num={i + 1}
              hasBudgets={hasBudgets}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setDeletingProj}
            />
          ))}
        </RpCardGrid>
      )}

      {showForm && (
        <ProjectFormModal
          project={editingProj}
          orgId={orgId}
          onClose={() => { setShowForm(false); setEditingProj(null) }}
        />
      )}
      {deletingProj && <DeleteConfirm itemName={deletingProj.name} onConfirm={handleDelete} onCancel={() => setDeletingProj(null)} />}
    </RpPage>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
// Hero frame + rich caption. One link (the name) stretches over the whole
// card; Edit/Delete sit above it. Below 640px the card becomes a compact row
// (a 112px thumbnail beside the text) so 50 packages do not scroll for metres.

function ProjectCard({ row, hero, num, hasBudgets, canWrite, onEdit, onDelete }: {
  row: Row
  hero: RpImage
  num: number
  hasBudgets: boolean
  canWrite: boolean
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
}) {
  const { p, budget, ratio } = row
  const href = `/projects/${p.id}`
  const over = Number.isFinite(ratio) && ratio > 1

  return (
    <article className="group/card relative flex min-w-0 flex-col gap-4 max-sm:flex-row max-sm:items-start motion-safe:[&:hover_.rp-frame_img]:[transform:scale(1.02)]">
      <RpFigure
        {...hero}
        alt={hero.alt || p.name}
        aspect="card"
        caption={undefined}
        qualifier={undefined}
        lightbox={false}
        className="max-sm:w-28 max-sm:shrink-0 max-sm:[&_.rp-frame-badge]:hidden"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 max-sm:gap-2">
        <div className="flex items-center justify-between gap-3">
          <RpCapNum n={num} className="text-[13px] leading-none" />
          <RpStatus kind="project" value={p.status} />
        </div>
        <h3 className="line-clamp-2 font-display text-xl uppercase leading-[1.15] tracking-[.03em] text-rp-text max-sm:text-base">
          <Link
            href={href}
            className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] hover:text-rp-blue"
          >
            {p.name}
          </Link>
        </h3>
        {p.location && <p className="text-[13px] leading-snug text-rp-muted max-sm:hidden">{p.location}</p>}
        {hasBudgets && budget > 0 && (
          <div className="mt-1 flex flex-col gap-2 max-sm:mt-0">
            <RpMeter value={ratio} label={`${p.name} spend`} />
            <p className="font-display text-xs uppercase tracking-[.08em] text-rp-dim tabular-nums">
              <span className={cn(over && 'text-rp-alert')}>{fmtPct(ratio)} spent</span>
              {' · '}
              {fmtMoney(budget, { compact: true })}
            </p>
          </div>
        )}
        {canWrite && (
          <div className="relative z-[1] flex items-center gap-4 pt-1 transition-opacity duration-200 md:[@media(hover:hover)]:opacity-0 md:[@media(hover:hover)]:group-hover/card:opacity-100 md:[@media(hover:hover)]:group-focus-within/card:opacity-100">
            <RpButton variant="text" size="sm" className="text-rp-muted" onClick={() => onEdit(p)} aria-label={`Edit ${p.name}`}>
              Edit
            </RpButton>
            <RpButton variant="text" size="sm" className="text-rp-muted hover:text-rp-alert" onClick={() => onDelete(p)} aria-label={`Delete ${p.name}`}>
              Delete
            </RpButton>
          </div>
        )}
      </div>
    </article>
  )
}

// ── Table view ─────────────────────────────────────────────────────────────

function ProjectsTable({ rows, hasBudgets, canWrite, onEdit, onDelete }: {
  rows: Row[]
  hasBudgets: boolean
  canWrite: boolean
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
}) {
  const router = useRouter()
  const t = sum(rows)

  return (
    <RpTable minWidth={hasBudgets ? 860 : 640} caption="Projects">
      <thead>
        <tr>
          <th className="idx">#</th>
          <th>Package</th>
          <th>Location</th>
          <th>Status</th>
          {hasBudgets && (
            <>
              <th className="num">Budget</th>
              <th className="num">Spent</th>
              <th style={{ width: 132 }}>%</th>
            </>
          )}
          {canWrite && <th className="num relative"><span className="sr-only">Actions</span></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const href = `/projects/${r.p.id}`
          return (
            <tr
              key={r.p.id}
              data-href={href}
              onClick={e => {
                if ((e.target as HTMLElement).closest('a,button')) return
                router.push(href)
              }}
            >
              <td className="idx">{pad2(i + 1)}</td>
              <td className="min-w-[240px]">
                <Link href={href}>{r.p.name}</Link>
                {r.p.project_type && <span className="sub">{r.p.project_type}</span>}
              </td>
              <td className="text-rp-muted">{r.p.location || '—'}</td>
              <td><RpStatus kind="project" value={r.p.status} /></td>
              {hasBudgets && (
                <>
                  <td className="num">{r.budget > 0 ? fmtMoney(r.budget) : '—'}</td>
                  <td className={cn('num', r.actual > r.budget && r.budget > 0 && 'text-rp-alert')}>
                    {r.budget > 0 || r.actual > 0 ? fmtMoney(r.actual) : '—'}
                  </td>
                  <td>
                    {r.budget > 0 ? (
                      <span className="flex items-center gap-3">
                        <RpMeter value={r.ratio} className="w-20 shrink-0" label={`${r.p.name} spend`} />
                        <span className="w-10 text-right text-[13px] tabular-nums text-rp-muted">{fmtPct(r.ratio)}</span>
                      </span>
                    ) : <span className="text-rp-dim">—</span>}
                  </td>
                </>
              )}
              {canWrite && (
                <td className="num">
                  <span className="inline-flex items-center gap-4">
                    <RpButton variant="text" size="sm" className="text-rp-muted" onClick={() => onEdit(r.p)} aria-label={`Edit ${r.p.name}`}>Edit</RpButton>
                    <RpButton variant="text" size="sm" className="text-rp-muted hover:text-rp-alert" onClick={() => onDelete(r.p)} aria-label={`Delete ${r.p.name}`}>Delete</RpButton>
                  </span>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
      {hasBudgets && (
        <tfoot>
          <tr>
            <td />
            <td>Total · {rows.length} packages</td>
            <td />
            <td />
            <td className="num">{fmtMoney(t.budget)}</td>
            <td className="num">{fmtMoney(t.actual)}</td>
            <td>
              <span className="flex items-center gap-3">
                <RpMeter value={Number.isFinite(t.ratio) ? t.ratio : 0} className="w-20 shrink-0" label="Total spend" />
                <span className="w-10 text-right text-[13px] tabular-nums">{fmtPct(t.ratio)}</span>
              </span>
            </td>
            {canWrite && <td />}
          </tr>
        </tfoot>
      )}
    </RpTable>
  )
}

// ── Two-step create/edit modal ─────────────────────────────────────────────
// Step 1: Details. On submit we save the project row; for create we then
// advance to Step 2 with the new project's ID. For edit we land directly on
// whichever tab the user picked.
//
// Step 2: Files. Drag-drop + click-to-pick uploader that writes directly to
// Supabase Storage and records project_files rows. Independent of the
// details save — uploads can fail without losing form data.
//
// Exported so the project page can edit in place.

type Step = 'details' | 'files'

export function ProjectFormModal({
  project,
  orgId,
  onClose,
}: {
  project: Project | null
  orgId: string
  onClose: () => void
}) {
  const router = useRouter()
  const isEditing = !!project
  const [step, setStep] = useState<Step>('details')
  // For create flow: once details are saved we get a new project id and
  // can advance to the files step. For edit flow: we already have one.
  const [projectId, setProjectId] = useState<string | null>(project?.id || null)

  const [form, setForm] = useState({
    name: project?.name || '',
    project_type: project?.project_type || '',
    status: project?.status || 'active',
    location: project?.location || '',
    latitude: project?.latitude != null ? String(project.latitude) : '',
    longitude: project?.longitude != null ? String(project.longitude) : '',
    description: project?.description || '',
    notes: project?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCoords, setShowCoords] = useState(form.latitude !== '' || form.longitude !== '')

  // Existing files (edit flow only) — fetched once when modal opens
  const [existingFiles, setExistingFiles] = useState<ProjectFile[]>([])
  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    async function load() {
      const supabase = (await import('@/utils/supabase/client')).createClient()
      const { data } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (!cancelled) setExistingFiles((data || []) as ProjectFile[])
    }
    load()
    return () => { cancelled = true }
  }, [projectId])

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const lat = form.latitude.trim() ? parseFloat(form.latitude) : NaN
    const lng = form.longitude.trim() ? parseFloat(form.longitude) : NaN
    if (form.latitude.trim() && (isNaN(lat) || lat < -90 || lat > 90)) {
      setError('Latitude must be between -90 and 90.')
      setSaving(false)
      return
    }
    if (form.longitude.trim() && (isNaN(lng) || lng < -180 || lng > 180)) {
      setError('Longitude must be between -180 and 180.')
      setSaving(false)
      return
    }

    const payload = {
      name: form.name,
      project_type: form.project_type.trim() || null,
      status: form.status,
      location: form.location || null,
      latitude: !isNaN(lat) ? lat : null,
      longitude: !isNaN(lng) ? lng : null,
      description: form.description || null,
      notes: form.notes || null,
    }

    const url = isEditing && projectId ? `/api/projects/${projectId}` : '/api/projects'
    const method = isEditing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }

    const created = await res.json()
    setSaving(false)
    router.refresh()

    // Advance to file step so the user can attach right away
    if (!isEditing) setProjectId(created.id)
    setStep('files')
  }

  const latErr = error.startsWith('Latitude') ? error : undefined
  const lngErr = error.startsWith('Longitude') ? error : undefined
  const formErr = !latErr && !lngErr ? error : ''

  return (
    <RpModal
      open
      onClose={onClose}
      size="lg"
      eyebrow={isEditing ? 'Edit project' : 'New project'}
      title={form.name.trim() || 'Untitled package'}
      footer={step === 'details' ? (
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="project-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save details' : 'Save and add files'}
          </RpButton>
        </>
      ) : (
        <>
          {!isEditing && <RpButton variant="back" onClick={() => setStep('details')} className="mr-auto">Details</RpButton>}
          <RpButton onClick={onClose}>Done</RpButton>
        </>
      )}
    >
      <RpTabs
        ariaLabel="Project form step"
        size="sm"
        value={step}
        onChange={id => setStep(id as Step)}
        items={[
          { id: 'details', num: '01', label: 'Details' },
          { id: 'files', num: '02', label: 'Files', disabled: !projectId },
        ]}
      />

      {step === 'details' && (
        <form id="project-form" onSubmit={saveDetails} className="flex flex-col gap-5">
          <RpFormGrid>
            <RpField label="Name" htmlFor="pf-name" required className="sm:col-span-2">
              <RpInput
                id="pf-name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Trackside Garages: Phase 1 Rows"
                required
              />
            </RpField>
            <RpField label="Type" htmlFor="pf-type">
              <ProjectTypeCombobox
                id="pf-type"
                value={form.project_type}
                onChange={v => setForm(p => ({ ...p, project_type: v }))}
              />
            </RpField>
            <RpField label="Status" htmlFor="pf-status">
              <RpSelect id="pf-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Complete</option>
                <option value="archived">Archived</option>
              </RpSelect>
            </RpField>
            <RpField
              label="Location"
              htmlFor="pf-location"
              className="sm:col-span-2"
              hint="Where on the 443 acres: north lakes, garage campus, pit lane, sitewide"
            >
              <RpInput
                id="pf-location"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Garage campus · pit lane"
              />
            </RpField>
            <div className="sm:col-span-2">
              <RpButton variant="text" size="sm" onClick={() => setShowCoords(v => !v)} aria-expanded={showCoords}>
                {showCoords ? '− Hide coordinates' : '+ Add coordinates'}
              </RpButton>
            </div>
            {showCoords && (
              <>
                <RpField label="Latitude" htmlFor="pf-lat" hint="−90 to 90" error={latErr}>
                  <RpInput
                    id="pf-lat"
                    type="text"
                    inputMode="decimal"
                    value={form.latitude}
                    onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="29.6470"
                    invalid={!!latErr}
                  />
                </RpField>
                <RpField label="Longitude" htmlFor="pf-lng" hint="−180 to 180" error={lngErr}>
                  <RpInput
                    id="pf-lng"
                    type="text"
                    inputMode="decimal"
                    value={form.longitude}
                    onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="-81.7011"
                    invalid={!!lngErr}
                  />
                </RpField>
              </>
            )}
            <RpField label="Description" htmlFor="pf-desc" className="sm:col-span-2" hint="One or two plain sentences: what the package delivers">
              <RpTextarea
                id="pf-desc"
                rows={3}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </RpField>
            <RpField label="Notes" htmlFor="pf-notes" className="sm:col-span-2">
              <RpTextarea
                id="pf-notes"
                rows={3}
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </RpField>
          </RpFormGrid>
          {formErr && <p className="rp-error" role="alert">{formErr}</p>}
        </form>
      )}

      {step === 'files' && projectId && (
        <ProjectFilesUploader
          projectId={projectId}
          orgId={orgId}
          existingFiles={existingFiles}
          onUploaded={f => setExistingFiles(prev => [f, ...prev])}
        />
      )}
    </RpModal>
  )
}
