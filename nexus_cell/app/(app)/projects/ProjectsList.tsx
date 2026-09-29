'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project, ProjectFile, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import ProjectTypeCombobox from '@/components/project-detail/ProjectTypeCombobox'
import ProjectFilesUploader from '@/components/project-detail/ProjectFilesUploader'
import { BRAND } from '@/lib/brand'

// Projects carry no image column yet, so each card gets a deterministic
// rendering from the Roaring Pines demo set, picked by keyword, then by id.
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

interface Props { projects: Project[]; role: UserRole; orgId: string }

export default function ProjectsList({ projects, role, orgId }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [deletingProj, setDeletingProj] = useState<Project | null>(null)

  const filtered = projects.filter(p => statusFilter === 'all' || p.status === statusFilter)

  async function handleDelete() {
    if (!deletingProj) return
    await fetch(`/api/projects/${deletingProj.id}`, { method: 'DELETE' })
    setDeletingProj(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-6xl">
      <header className="rp-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--head" />
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2.5">
            <span className="rp-eyebrow">The build</span>
            <h1 className="rp-title">Projects</h1>
            <p className="rp-caption">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          {canWrite && (
            <button onClick={() => { setEditingProj(null); setShowForm(true) }} className="rp-btn-solid">
              New project
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rp-panel relative overflow-hidden p-12 text-center" style={{ isolation: 'isolate', minHeight: 220 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--foot" />
          <p className="text-[#9AA0A4]">No projects yet. Add the first build package.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(proj => (
            <Link key={proj.id} href={`/projects/${proj.id}`} className="rp-panel group block overflow-hidden transition-colors hover:border-[#3A3E42]">
              <div className="rp-frame border-0 border-b" style={{ aspectRatio: '16 / 10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={projectImage(proj)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display uppercase text-[22px] leading-none tracking-[0.02em] text-[#F5F5F5]">{proj.name}</h3>
                <span className={`rp-tag shrink-0 ${statusColors[proj.status] || ''}`}>
                  {proj.status.replace('_', ' ')}
                </span>
              </div>
              {(proj.project_type || proj.location) && (
                <p className="rp-caption">{[proj.project_type, proj.location].filter(Boolean).join(' · ')}</p>
              )}
              {proj.description && <p className="text-sm text-gray-400 mt-2 truncate">{proj.description}</p>}
              {canWrite && (
                <div className="mt-3 pt-3 border-t border-[#1F1F1F] flex gap-3">
                  <button onClick={e => { e.preventDefault(); setEditingProj(proj); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                  <button onClick={e => { e.preventDefault(); setDeletingProj(proj) }} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                </div>
              )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectFormModal
          project={editingProj}
          orgId={orgId}
          onClose={() => { setShowForm(false); setEditingProj(null) }}
          inputClass={inputClass}
        />
      )}
      {deletingProj && <DeleteConfirm itemName={deletingProj.name} onConfirm={handleDelete} onCancel={() => setDeletingProj(null)} />}
    </div>
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

type Step = 'details' | 'files'

function ProjectFormModal({
  project,
  orgId,
  onClose,
  inputClass,
}: {
  project: Project | null
  orgId: string
  onClose: () => void
  inputClass: string
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

  const labelClass = 'block text-sm text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="rp-panel w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="rp-eyebrow">{isEditing ? 'Edit Project' : 'New Project'}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {step === 'details' ? 'Step 1 of 2 · Details' : 'Step 2 of 2 · Files'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* Tabs (visible once we have a project — edit always, create after step 1) */}
        {projectId && (
          <div className="flex gap-1 px-6 pt-3 border-b border-white/5 shrink-0">
            {(['details', 'files'] as Step[]).map(s => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${
                  step === s ? 'text-white border-[#CDA14B]' : 'text-gray-500 hover:text-white border-transparent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {step === 'details' && (
            <form onSubmit={saveDetails} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Trackside Garage Row" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <ProjectTypeCombobox
                    value={form.project_type}
                    onChange={v => setForm(p => ({ ...p, project_type: v }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input className={inputClass} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Pit lane, Roaring Pines" />
                <button
                  type="button"
                  onClick={() => setShowCoords(v => !v)}
                  className="text-[11px] text-gray-500 hover:text-emerald-400 mt-1.5 transition-colors"
                >
                  {showCoords ? '− Hide coordinates' : '+ Add coordinates'}
                </button>
                {showCoords && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputClass}
                      value={form.latitude}
                      onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                      placeholder="Latitude (-90 to 90)"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputClass}
                      value={form.longitude}
                      onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                      placeholder="Longitude (-180 to 180)"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="rp-btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="rp-btn-solid flex-1 justify-center disabled:cursor-not-allowed">
                  {saving ? 'Saving…' : isEditing ? 'Save details' : 'Save & add files'}
                </button>
              </div>
            </form>
          )}

          {step === 'files' && projectId && (
            <div className="p-6 space-y-4">
              <ProjectFilesUploader
                projectId={projectId}
                orgId={orgId}
                existingFiles={existingFiles}
                onUploaded={f => setExistingFiles(prev => [f, ...prev])}
              />
              <div className="flex gap-3 pt-2 border-t border-white/5">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="rp-btn-ghost"
                  >
                    ← Details
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={onClose}
                  className="rp-btn-solid"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
