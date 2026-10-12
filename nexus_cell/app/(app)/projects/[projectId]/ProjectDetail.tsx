'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, Budget, ProjectFile, ProjectBlock, ProjectBlockType, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import ProjectFilesUploader, { ProjectFilesTable } from '@/components/project-detail/ProjectFilesUploader'
import ProjectBlocks, { blockAnchor, blockTypeConfig } from '@/components/project-detail/ProjectBlocks'
import { ProjectFormModal } from '@/app/(app)/projects/ProjectsList'
import { sectionEyebrow } from '@/lib/sections'
import { getProjectImagery } from '@/lib/project-imagery'
import { cn } from '@/lib/utils'
import {
  RpPage, RpPageHeader, RpStatus, RpButton, RpFigure, RpStatStrip, RpStat, RpSectionNav,
  RpSubhead, RpTable, RpMeter, RpEmpty, RpModal, RpField, RpInput, RpTextarea, RpFormGrid,
  useRpLightbox, Plus, RP_ICON, dot, fmtMoney, fmtPct, pad2,
  type RpImage, type RpSectionNavItem,
} from '@/components/rp'

interface Props {
  project: Project
  budgets: Budget[]
  files: ProjectFile[]
  role: UserRole
  orgId: string
  /** When passed, the hero uses the gallery blocks' images and the Directory renders here. */
  blocks?: ProjectBlock[]
}

export default function ProjectDetail({ project, budgets, files, role, orgId, blocks }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [editingProject, setEditingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)

  const totalBudgeted = budgets.reduce((sum, b) => sum + (Number(b.budgeted) || 0), 0)
  const totalActual = budgets.reduce((sum, b) => sum + (Number(b.actual) || 0), 0)
  const variance = totalBudgeted - totalActual
  const spentRatio = totalBudgeted > 0 ? totalActual / totalBudgeted : NaN
  const categories = new Set(budgets.map(b => b.category)).size

  // ── Imagery: the gallery blocks' images (by block, then position), else the catalog.
  const dbImages = useMemo(() => {
    if (!blocks) return null
    return blocks
      .filter(b => b.type === 'gallery')
      .flatMap(b => [...(b.project_images ?? [])].sort((x, y) => (x.position ?? 0) - (y.position ?? 0)))
      .map((img, i) => ({ url: img.url, caption: img.caption, position: i }))
  }, [blocks])
  const imagery = useMemo(() => getProjectImagery(project, dbImages), [project, dbImages])
  const images: RpImage[] = useMemo(() => {
    const hero = imagery.hero
    return [hero, ...imagery.gallery.filter(g => g.src !== hero.src)]
  }, [imagery])
  const lb = useRpLightbox(images)
  const hero = images[0]
  const strip = images.slice(1, 5)
  const moreCount = images.length - 5

  // ── Section nav: Budget, one anchor per block type, Files. Numbers match the headings.
  const blockFrom = 2
  const nav: RpSectionNavItem[] = [{ id: 'budget', num: '01', label: 'Budget' }]
  if (blocks) {
    const seen = new Set<ProjectBlockType>()
    blocks.forEach((b, i) => {
      if (seen.has(b.type)) return
      seen.add(b.type)
      nav.push({ id: blockAnchor(b.type), num: pad2(blockFrom + i), label: blockTypeConfig[b.type]?.label ?? b.type })
    })
  }
  const filesNum = blocks ? blockFrom + blocks.length : 2
  nav.push({ id: 'files', num: pad2(filesNum), label: 'Files' })

  async function handleDeleteBudget() {
    if (!deletingBudget) return
    await fetch(`/api/projects/${project.id}/budgets/${deletingBudget.id}`, { method: 'DELETE' })
    setDeletingBudget(null)
    router.refresh()
  }

  async function handleDeleteProject() {
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    setDeletingProject(false)
    router.push('/projects')
    router.refresh()
  }

  const budgetHref = `/projects/${project.id}/budget`

  return (
    <RpPage>
      <RpPageHeader
        back={{ href: '/projects', label: 'Projects' }}
        eyebrow={sectionEyebrow('projects')}
        tags={<RpStatus kind="project" value={project.status} />}
        title={project.name}
        line={project.description || undefined}
        spec={project.notes ? (
          <>
            {dot(project.project_type, project.location)}
            {/* The project notes read as part of the header, not a lone ruled paragraph under the stats. */}
            <span className="mt-2 block max-w-[70ch] text-sm leading-relaxed text-rp-muted">{project.notes}</span>
          </>
        ) : dot(project.project_type, project.location)}
        actions={(
          <>
            <RpButton href={budgetHref} arrow>Open budget</RpButton>
            {canWrite && <RpButton variant="ghost" onClick={() => setEditingProject(true)}>Edit</RpButton>}
            {canWrite && <RpButton variant="danger" onClick={() => setDeletingProject(true)}>Delete</RpButton>}
          </>
        )}
      />

      {/* Hero, then a strip of the next images; one lightbox steps through all of them. */}
      <section aria-label="Images" className="flex flex-col gap-3">
        <RpFigure
          {...hero}
          aspect="banner"
          frameClassName="max-lg:aspect-[16/10]"
          num={1}
          qualifier={hero.qualifier ?? hero.provenance}
          onOpen={() => lb.open(0)}
          loading="eager"
        />
        {strip.length > 0 && (
          <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-4">
            {strip.map((img, i) => (
              <RpFigure
                key={`${img.src}-${i}`}
                src={img.src}
                alt={img.alt}
                aspect="card"
                mat={img.mat}
                objectPosition={img.objectPosition}
                num={i + 2}
                onOpen={() => lb.open(i + 1)}
                overlay={i === 3 && moreCount > 0 ? (
                  <span className="font-display text-xs uppercase tracking-[.14em] text-rp-text">+{moreCount} more</span>
                ) : undefined}
              />
            ))}
          </div>
        )}
        {lb.node}
      </section>

      <RpStatStrip cols={4}>
        <RpStat
          label="Budget"
          value={fmtMoney(totalBudgeted, { compact: true })}
          sub={totalBudgeted > 0 ? fmtMoney(totalBudgeted) : 'No lines yet'}
        />
        <RpStat
          label="Spent"
          value={fmtMoney(totalActual, { compact: true })}
          sub={totalBudgeted > 0 ? `${fmtPct(spentRatio)} of budget` : undefined}
          meter={{ value: Number.isFinite(spentRatio) ? spentRatio : 0 }}
        />
        <RpStat
          label="Variance"
          value={fmtMoney(variance, { compact: true, sign: true })}
          tone={variance < 0 ? 'alert' : 'default'}
          sub={variance > 0 ? 'Under budget' : variance < 0 ? 'Over budget' : 'On budget'}
        />
        <RpStat
          label="Line items"
          value={budgets.length}
          sub={categories ? `${categories} categor${categories === 1 ? 'y' : 'ies'}` : undefined}
        />
      </RpStatStrip>

      <RpSectionNav sticky items={nav} ariaLabel="Project sections" />

      {/* ── 01 Budget ── (flush: the section nav's own rule sits just above) */}
      <section className="flex flex-col gap-6">
        <RpSubhead
          id="budget"
          flush
          num={1}
          title="Budget"
          spec={budgets.length
            ? dot(`${budgets.length} line${budgets.length === 1 ? '' : 's'}`, `${fmtMoney(totalBudgeted, { compact: true })} budgeted`, `${fmtMoney(totalActual, { compact: true })} spent`)
            : 'Budget against actual, line by line'}
          aside={(
            <>
              <RpButton variant="text" arrow href={budgetHref}>Open full budget</RpButton>
              {canWrite && (
                <RpButton variant="ghost" size="sm" icon={<Plus {...RP_ICON} size={14} />} onClick={() => setShowBudgetForm(true)}>
                  Line item
                </RpButton>
              )}
            </>
          )}
        />

        {budgets.length === 0 ? (
          <RpEmpty
            compact
            title="No budget lines yet."
            line="Add a line here, or import the Excel budget from the full budget page."
            action={canWrite && (
              <RpButton variant="ghost" size="sm" icon={<Plus {...RP_ICON} size={14} />} onClick={() => setShowBudgetForm(true)}>
                Line item
              </RpButton>
            )}
          />
        ) : (
          <RpTable minWidth={canWrite ? 820 : 740} caption="Budget lines">
            <thead>
              <tr>
                <th className="idx">#</th>
                <th>Category</th>
                <th className="num">Budgeted</th>
                <th className="num">Actual</th>
                <th className="num">Variance</th>
                <th className="relative" style={{ width: 136 }}><span className="sr-only">Spend</span></th>
                {canWrite && <th className="num relative"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {budgets.map((b, i) => {
                const budgeted = Number(b.budgeted) || 0
                const actual = Number(b.actual) || 0
                const v = budgeted - actual
                const ratio = budgeted > 0 ? actual / budgeted : 0
                const over = ratio > 1
                return (
                  <tr key={b.id}>
                    <td className="idx">{pad2(i + 1)}</td>
                    <td className="min-w-[220px]">
                      {b.category}
                      {b.notes && <span className="sub">{b.notes}</span>}
                    </td>
                    <td className="num">{fmtMoney(budgeted)}</td>
                    <td className="num">
                      <span className={cn(over && 'text-rp-alert')}>{fmtMoney(actual)}</span>
                      <span className={cn('ml-1.5 text-[13px]', over ? 'text-rp-alert' : 'text-rp-dim')}>({fmtPct(ratio)})</span>
                    </td>
                    <td className={cn('num', v > 0 ? 'text-rp-green' : v < 0 ? 'text-rp-alert' : 'text-rp-muted')}>
                      {fmtMoney(v, { sign: true })}
                    </td>
                    <td className="align-middle">
                      <RpMeter value={ratio} label={`${b.category} spend`} />
                    </td>
                    {canWrite && (
                      <td className="num">
                        <RpButton
                          variant="text"
                          size="sm"
                          className="text-rp-muted hover:text-rp-alert"
                          onClick={() => setDeletingBudget(b)}
                          aria-label={`Remove ${b.category}${b.notes ? ` · ${b.notes}` : ''}`}
                        >
                          Remove
                        </RpButton>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>Total</td>
                <td className="num">{fmtMoney(totalBudgeted)}</td>
                <td className="num">{fmtMoney(totalActual)}</td>
                <td className={cn('num', variance > 0 ? 'text-rp-green' : variance < 0 ? 'text-rp-alert' : '')}>
                  {fmtMoney(variance, { sign: true })}
                </td>
                <td className="align-middle">
                  <RpMeter value={Number.isFinite(spentRatio) ? spentRatio : 0} label="Total spend" />
                </td>
                {canWrite && <td />}
              </tr>
            </tfoot>
          </RpTable>
        )}
      </section>

      {/* ── Directory (module page only; the overlay renders it after this component) ── */}
      {blocks && (
        <section className="flex flex-col gap-6">
          <RpSubhead id="directory" title="Directory" spec="Images, team, subcontractors and notes" />
          <ProjectBlocks projectId={project.id} orgId={orgId} blocks={blocks} role={role} numberFrom={blockFrom} />
        </section>
      )}

      {/* ── Files ── */}
      <section className="flex flex-col gap-6">
        <RpSubhead
          id="files"
          num={filesNum}
          title="Files"
          spec={files.length
            ? dot(`${files.length} file${files.length === 1 ? '' : 's'}`, 'drawings, contracts and photos')
            : 'Drawings, contracts and photos'}
        />
        {canWrite ? (
          <ProjectFilesUploader
            projectId={project.id}
            orgId={orgId}
            existingFiles={files}
            canDelete
          />
        ) : files.length === 0 ? (
          <RpEmpty compact title="No files yet." line="Drawings, contracts and photos will appear here." />
        ) : (
          <ProjectFilesTable files={files} />
        )}
      </section>

      {/* Modals */}
      {showBudgetForm && <BudgetFormModal projectId={project.id} onClose={() => setShowBudgetForm(false)} />}
      {deletingBudget && <DeleteConfirm itemName={deletingBudget.category} onConfirm={handleDeleteBudget} onCancel={() => setDeletingBudget(null)} />}
      {editingProject && <ProjectFormModal project={project} orgId={orgId} onClose={() => setEditingProject(false)} />}
      {deletingProject && <DeleteConfirm itemName={project.name} onConfirm={handleDeleteProject} onCancel={() => setDeletingProject(false)} />}
    </RpPage>
  )
}

function BudgetFormModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ category: '', budgeted: '', actual: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/projects/${projectId}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: form.category,
        budgeted: parseFloat(form.budgeted) || 0,
        actual: parseFloat(form.actual) || 0,
        notes: form.notes || null,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow="New line item"
      title={form.category.trim() || 'Budget line'}
      footer={(
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="budget-line-form" disabled={saving}>{saving ? 'Saving…' : 'Add line'}</RpButton>
        </>
      )}
    >
      <form id="budget-line-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <RpFormGrid>
          <RpField label="Category" htmlFor="bl-category" required className="sm:col-span-2">
            <RpInput id="bl-category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Site work, paving, MEP" required />
          </RpField>
          <RpField label="Budgeted ($)" htmlFor="bl-budgeted" required>
            <RpInput id="bl-budgeted" type="number" step="0.01" min="0" value={form.budgeted} onChange={e => setForm(p => ({ ...p, budgeted: e.target.value }))} placeholder="0.00" required />
          </RpField>
          <RpField label="Actual ($)" htmlFor="bl-actual">
            <RpInput id="bl-actual" type="number" step="0.01" min="0" value={form.actual} onChange={e => setForm(p => ({ ...p, actual: e.target.value }))} placeholder="0.00" />
          </RpField>
          <RpField label="Notes" htmlFor="bl-notes" className="sm:col-span-2" hint="Shown under the category, e.g. the line name or draw">
            <RpTextarea id="bl-notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
