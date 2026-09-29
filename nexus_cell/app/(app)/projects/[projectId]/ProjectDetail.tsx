'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project, Budget, ProjectFile, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import ProjectFilesUploader from '@/components/project-detail/ProjectFilesUploader'

// Deterministic hero rendering from the Roaring Pines demo set (projects have
// no image column yet). Mirrors the helper in ProjectsList.
const PROJECT_IMAGE_ROTATION = [
  '/demo/site/site-full-hero.jpg',
  '/demo/site/site-central-lake-garage-arc.jpg',
  '/demo/site/site-eastern-lakefront.jpg',
  '/demo/site/site-northern-lakes.jpg',
]

function projectImage(p: Pick<Project, 'id' | 'name' | 'project_type'>): string {
  const key = `${p.name || ''} ${p.project_type || ''}`.toLowerCase()
  if (/trackside/.test(key)) return '/demo/images/trackside-connected-row.jpg'
  if (/garage|paddock|flatrock/.test(key)) return '/demo/images/flatrock-club-01.jpg'
  if (/home|residence|estate/.test(key)) return '/demo/homes/custom-home-exterior.jpg'
  if (/entrance|gate/.test(key)) return '/demo/entrance/main-gate-v03.jpg'
  if (/clubhouse|pool/.test(key)) return '/demo/site/site-clubhouse-pools-courts.jpg'
  if (/track|circuit/.test(key)) return '/demo/site/site-southern-circuit.jpg'
  let h = 0
  for (const c of p.id || '') h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PROJECT_IMAGE_ROTATION[h % PROJECT_IMAGE_ROTATION.length]
}

const statusColors: Record<string, string> = {
  active: 'rp-tag--accent',
  on_hold: 'text-amber-400 border-amber-500/40',
  completed: 'text-[#3989CB] border-[#3989CB]/40',
  archived: '',
}

interface Props { project: Project; budgets: Budget[]; files: ProjectFile[]; role: UserRole; orgId: string }

export default function ProjectDetail({ project, budgets, files, role, orgId }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)

  function formatCurrency(amt: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0)
  const totalActual = budgets.reduce((sum, b) => sum + b.actual, 0)
  const variance = totalBudgeted - totalActual

  async function handleDeleteBudget() {
    if (!deletingBudget) return
    await fetch(`/api/projects/${project.id}/budgets/${deletingBudget.id}`, { method: 'DELETE' })
    setDeletingBudget(null)
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <Link href="/projects" className="rp-eyebrow--muted hover:text-white transition-colors mb-4 inline-block">← Back to Projects</Link>
      <header className="rp-head">
        <span className="rp-eyebrow">Project</span>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="rp-title">{project.name}</h1>
          <span className={`rp-tag ${statusColors[project.status] || ''}`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
        {(project.project_type || project.location) && (
          <p className="rp-caption">{[project.project_type, project.location].filter(Boolean).join(' · ')}</p>
        )}
        {project.description && <p className="rp-lede">{project.description}</p>}
      </header>

      <figure className="m-0 mb-8">
        <div className="rp-frame" style={{ aspectRatio: '16 / 7' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={projectImage(project)} alt={project.name} className="w-full h-full object-cover" />
        </div>
      </figure>

      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rp-panel p-4">
          <p className="rp-eyebrow--muted">Total Budgeted</p>
          <p className="rp-stat-value mt-1">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="rp-panel p-4">
          <p className="rp-eyebrow--muted">Total Actual</p>
          <p className="rp-stat-value mt-1">{formatCurrency(totalActual)}</p>
        </div>
        <div className="rp-panel p-4">
          <p className="rp-eyebrow--muted">Variance</p>
          <p className={`rp-stat-value mt-1 ${variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
          </p>
        </div>
      </div>

      {/* Budget Line Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="rp-eyebrow--muted">Budget Breakdown</h2>
          {canWrite && (
            <button onClick={() => setShowBudgetForm(true)} className="rp-btn-solid">
              + Add Line Item
            </button>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="rp-panel p-8 text-center">
            <p className="text-gray-500">No budget items yet.</p>
          </div>
        ) : (
          <div className="rp-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F1F] text-left rp-eyebrow--muted">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Budgeted</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-right">Variance</th>
                  {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => {
                  const v = b.budgeted - b.actual
                  const pct = b.budgeted > 0 ? (b.actual / b.budgeted) * 100 : 0
                  return (
                    <tr key={b.id} className="border-b border-[#1F1F1F] hover:bg-[#141618] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{b.category}</p>
                        {b.notes && <p className="text-xs text-gray-600">{b.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono">{formatCurrency(b.budgeted)}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={pct > 100 ? 'text-red-400' : 'text-white'}>{formatCurrency(b.actual)}</span>
                        <span className="text-xs text-gray-600 ml-1">({pct.toFixed(0)}%)</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {v >= 0 ? '+' : ''}{formatCurrency(v)}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setDeletingBudget(b)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Files */}
      <div>
        <h2 className="rp-eyebrow--muted mb-4">Files</h2>
        {canWrite ? (
          <ProjectFilesUploader
            projectId={project.id}
            orgId={orgId}
            existingFiles={files}
            canDelete
          />
        ) : files.length === 0 ? (
          <div className="rp-panel p-8 text-center">
            <p className="text-gray-500">No files uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map(file => (
              <div key={file.id} className="rp-panel p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{file.file_name}</p>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {file.label && <span>{file.label} · </span>}
                    {file.file_size && <span>{(file.file_size / 1024).toFixed(0)} KB</span>}
                  </div>
                </div>
                {file.file_url && (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-xs hover:underline shrink-0">Download</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && <BudgetFormModal projectId={project.id} onClose={() => setShowBudgetForm(false)} inputClass={inputClass} />}
      {deletingBudget && <DeleteConfirm itemName={deletingBudget.category} onConfirm={handleDeleteBudget} onCancel={() => setDeletingBudget(null)} />}
    </div>
  )
}

function BudgetFormModal({ projectId, onClose, inputClass }: { projectId: string; onClose: () => void; inputClass: string }) {
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

  const labelClass = 'block text-sm text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="rp-panel w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="rp-eyebrow">Add Budget Line Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className={labelClass}>Category *</label><input className={inputClass} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Site work" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Budgeted *</label><input className={inputClass} type="number" step="0.01" min="0" value={form.budgeted} onChange={e => setForm(p => ({ ...p, budgeted: e.target.value }))} placeholder="0.00" required /></div>
            <div><label className={labelClass}>Actual</label><input className={inputClass} type="number" step="0.01" min="0" value={form.actual} onChange={e => setForm(p => ({ ...p, actual: e.target.value }))} placeholder="0.00" /></div>
          </div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="rp-btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="rp-btn-solid flex-1 disabled:cursor-not-allowed justify-center">
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
