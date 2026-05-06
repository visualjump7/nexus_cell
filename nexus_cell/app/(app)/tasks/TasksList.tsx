'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'

const statusColors: Record<string, string> = {
  todo: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  waiting: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  done: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const priorityDots: Record<string, string> = {
  low: 'bg-gray-500', normal: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500',
}

interface MemberOption { id: string; name: string; role: string }
interface Props { tasks: Task[]; role: UserRole; userId: string; members: MemberOption[] }

export default function TasksList({ tasks, role, userId, members }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (assigneeFilter === 'mine' && t.assigned_to !== userId) return false
    if (assigneeFilter !== 'all' && assigneeFilter !== 'mine' && t.assigned_to !== assigneeFilter) return false
    return true
  })

  function getMemberName(id: string | null) {
    if (!id) return 'Unassigned'
    const m = members.find(m => m.id === id)
    return m?.name || 'Unknown'
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleDelete() {
    if (!deletingTask) return
    await fetch(`/api/tasks/${deletingTask.id}`, { method: 'DELETE' })
    setDeletingTask(null)
    router.refresh()
  }

  const selectClass = 'px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'
  const inputClass = 'w-full px-3 py-2 bg-card border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm'

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingTask(null); setShowForm(true) }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">
            + New Task
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className={selectClass} value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
          <option value="all">All Assignees</option>
          <option value="mine">My Tasks</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-lg shadow-black/20 p-12 text-center">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="bg-card rounded-xl shadow-lg shadow-black/20 p-4 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${priorityDots[task.priority]}`} title={task.priority} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${statusColors[task.status] || ''}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span>{getMemberName(task.assigned_to)}</span>
                  {task.due_date && <>
                    <span className="text-gray-600">·</span>
                    <span>Due {formatDate(task.due_date)}</span>
                  </>}
                </div>
              </div>
              {canWrite && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditingTask(task); setShowForm(true) }} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                  <button onClick={() => setDeletingTask(task)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskFormModal task={editingTask} members={members} onClose={() => { setShowForm(false); setEditingTask(null) }} inputClass={inputClass} />}
      {deletingTask && <DeleteConfirm itemName={deletingTask.title} onConfirm={handleDelete} onCancel={() => setDeletingTask(null)} />}
    </div>
  )
}

function TaskFormModal({ task, members, onClose, inputClass }: { task: Task | null; members: MemberOption[]; onClose: () => void; inputClass: string }) {
  const router = useRouter()
  const isEditing = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'normal',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form, description: form.description || null, assigned_to: form.assigned_to || null, due_date: form.due_date || null }
    const url = isEditing ? `/api/tasks/${task.id}` : '/api/tasks'
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Schedule property inspection" required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select className={inputClass} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof p.priority }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Assign To</label>
              <select className={inputClass} value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input className={inputClass} type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
