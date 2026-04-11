'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  on_hold: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  archived: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

interface Props { projects: Project[]; role: UserRole }

export default function ProjectsList({ projects, role }: Props) {
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

      {showForm && <ProjectFormModal project={editingProj} onClose={() => { setShowForm(false); setEditingProj(null) }} inputClass={inputClass} />}
      {deletingProj && <DeleteConfirm itemName={deletingProj.name} onConfirm={handleDelete} onCancel={() => setDeletingProj(null)} />}
    </div>
  )
}

function ProjectFormModal({ project, onClose, inputClass }: { project: Project | null; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!project
  const [form, setForm] = useState({
    name: project?.name || '',
    project_type: project?.project_type || '',
    status: project?.status || 'active',
    location: project?.location || '',
    description: project?.description || '',
    notes: project?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      project_type: form.project_type || null,
      location: form.location || null,
      description: form.description || null,
      notes: form.notes || null,
    }
    const url = isEditing ? `/api/projects/${project.id}` : '/api/projects'
    const method = isEditing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
  const projectTypes = ['Property Renovation', 'Yacht Maintenance', 'Event Planning', 'Construction', 'Interior Design', 'Landscaping', 'Security Upgrade', 'Other']

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className={labelClass}>Name *</label><input className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aspen Remodel" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.project_type} onChange={e => setForm(p => ({ ...p, project_type: e.target.value }))}>
                <option value="">Select...</option>
                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                <option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Location</label><input className={inputClass} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. 123 Main St, Aspen, CO" /></div>
          <div><label className={labelClass}>Description</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
