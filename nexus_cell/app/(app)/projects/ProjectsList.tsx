'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project, ProjectFile, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import ProjectTypeCombobox from '@/components/project-detail/ProjectTypeCombobox'
import ProjectFilesUploader from '@/components/project-detail/ProjectFilesUploader'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  on_hold: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  archived: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingProj(null); setShowForm(true) }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Project
          </button>
        )}
      </div>

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
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(proj => (
            <Link key={proj.id} href={`/projects/${proj.id}`} className="bg-card rounded-xl shadow-lg shadow-black/20 p-5 hover:brightness-110 transition-colors block">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{proj.name}</h3>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border shrink-0 ${statusColors[proj.status] || ''}`}>
                  {proj.status.replace('_', ' ')}
                </span>
              </div>
              {proj.project_type && <p className="text-xs text-gray-500 mb-1">{proj.project_type}</p>}
              {proj.location && <p className="text-xs text-gray-600">{proj.location}</p>}
              {proj.description && <p className="text-sm text-gray-400 mt-2 truncate">{proj.description}</p>}
              {canWrite && (
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-3">
                  <button onClick={e => { e.preventDefault(); setEditingProj(proj); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                  <button onClick={e => { e.preventDefault(); setDeletingProj(proj) }} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                </div>
              )}
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
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Project' : 'New Project'}</h2>
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
                  step === s ? 'text-white border-emerald-400' : 'text-gray-500 hover:text-white border-transparent'
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
                <input className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aspen Remodel" required />
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
                <input className={inputClass} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. 123 Main St, Aspen, CO" />
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
                <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
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
                    className="py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    ← Details
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors"
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
