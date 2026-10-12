'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import {
  RpPage, RpPageHeader, RpFilterBar, RpTabs, RpSelect, RpGroup, RpGroupHead, RpList, RpRow,
  RpPriority, RpStatus, RpButton, RpEmpty, RpModal, RpField, RpInput, RpTextarea, RpFormGrid,
  Plus, RP_ICON, fmtDate, dot, statusLabel,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

/** Below 640px, wrap a row's status and actions onto their own line (kit rows cap the end at 50%). */
const ROW_STACK_SM = 'max-sm:flex-wrap max-sm:[&>.rp-row-main]:basis-0 max-sm:[&>.rp-row-end]:max-w-none max-sm:[&>.rp-row-end]:basis-full max-sm:[&>.rp-row-end]:justify-start'

const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'waiting', 'done', 'cancelled']
const CLOSED: Task['status'][] = ['done', 'cancelled']

type GroupMode = 'due' | 'status' | 'none'
type DueBucket = 'overdue' | 'week' | 'later' | 'none' | 'done'

const DUE_GROUPS: { id: DueBucket; title: string }[] = [
  { id: 'overdue', title: 'Overdue' },
  { id: 'week', title: 'This week' },
  { id: 'later', title: 'Later' },
  { id: 'none', title: 'No date' },
  { id: 'done', title: 'Done' },
]

interface MemberOption { id: string; name: string; role: string }
interface Props { tasks: Task[]; role: UserRole; userId: string; members: MemberOption[] }

/** UTC calendar-date string, the comparison the rest of the app uses. */
function isoDay(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export default function TasksList({ tasks, role, userId, members }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)

  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [groupMode, setGroupMode] = useState<GroupMode>('due')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const today = isoDay()
  const weekEnd = isoDay(7)

  const isClosed = (t: Task) => CLOSED.includes(t.status)
  const isOverdue = (t: Task) => !isClosed(t) && !!t.due_date && t.due_date.slice(0, 10) < today

  function dueBucket(t: Task): DueBucket {
    if (isClosed(t)) return 'done'
    if (!t.due_date) return 'none'
    const d = t.due_date.slice(0, 10)
    if (d < today) return 'overdue'
    if (d <= weekEnd) return 'week'
    return 'later'
  }

  // Assignee filter first (status tab counts follow it), then status.
  const byAssignee = tasks.filter(t => {
    if (assigneeFilter === 'mine' && t.assigned_to !== userId) return false
    if (assigneeFilter !== 'all' && assigneeFilter !== 'mine' && t.assigned_to !== assigneeFilter) return false
    return true
  })
  const filtered = byAssignee.filter(t => statusFilter === 'all' || t.status === statusFilter)

  const openCount = tasks.filter(t => !isClosed(t)).length
  const overdueCount = tasks.filter(isOverdue).length
  const weekCount = tasks.filter(t => dueBucket(t) === 'week').length

  function getMemberName(id: string | null) {
    if (!id) return 'Unassigned'
    const m = members.find(m => m.id === id)
    return m?.name || 'Unknown'
  }

  async function handleDelete() {
    if (!deletingTask) return
    await fetch(`/api/tasks/${deletingTask.id}`, { method: 'DELETE' })
    setDeletingTask(null)
    router.refresh()
  }

  function openNew() { setEditingTask(null); setShowForm(true) }
  function openEdit(task: Task) { setEditingTask(task); setShowForm(true) }

  // Sort inside a group: earliest due first, undated last, then newest.
  const byDue = (a: Task, b: Task) => {
    const da = a.due_date ?? '9999-12-31'
    const db = b.due_date ?? '9999-12-31'
    if (da !== db) return da < db ? -1 : 1
    return a.created_at < b.created_at ? 1 : -1
  }

  const groups: { id: string; title: string; edge?: boolean; items: Task[] }[] =
    groupMode === 'due'
      ? DUE_GROUPS.map(g => ({ id: g.id, title: g.title, edge: g.id === 'overdue', items: filtered.filter(t => dueBucket(t) === g.id).sort(byDue) }))
      : groupMode === 'status'
        ? STATUS_ORDER.map(s => ({ id: s, title: statusLabel('task', s), items: filtered.filter(t => t.status === s).sort(byDue) }))
        : [{ id: 'all', title: 'All', items: filtered }]

  const visibleGroups = groups.filter(g => g.items.length > 0)

  let running = 0
  function renderRow(task: Task) {
    running += 1
    const overdue = isOverdue(task)
    const due = task.due_date
      ? <span className={overdue ? 'text-rp-alert' : undefined}>{`Due ${fmtDate(task.due_date, 'short')}`}</span>
      : null
    return (
      <RpRow
        key={task.id}
        className={ROW_STACK_SM}
        index={running}
        lead={<RpPriority value={task.priority} />}
        title={task.title}
        meta={<>{getMemberName(task.assigned_to)}{due && <>{' · '}{due}</>}</>}
        aside={<RpStatus kind="task" value={task.status} />}
        done={task.status === 'done'}
        edge={task.priority === 'urgent' && !isClosed(task) ? 'alert' : task.priority === 'high' && !isClosed(task) ? 'gold' : undefined}
        onClick={canWrite ? () => openEdit(task) : undefined}
        actions={canWrite ? (
          <>
            <RpButton variant="text" size="sm" onClick={() => openEdit(task)}>Edit</RpButton>
            <RpButton variant="text" size="sm" onClick={() => setDeletingTask(task)}>Delete</RpButton>
          </>
        ) : undefined}
      />
    )
  }

  const statusTabs = [
    { id: 'all', label: 'All', count: byAssignee.length },
    ...STATUS_ORDER.map(s => ({ id: s, label: statusLabel('task', s), count: byAssignee.filter(t => t.status === s).length })),
  ]

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('tasks')}
        title="The punch list"
        line={dot(
          `${tasks.length} ${tasks.length === 1 ? 'item' : 'items'}`,
          `${openCount} open`,
          overdueCount > 0 && `${overdueCount} overdue`,
          `${weekCount} due this week`,
        )}
        actions={canWrite && (
          <RpButton icon={<Plus {...RP_ICON} />} onClick={openNew}>New task</RpButton>
        )}
      />

      <RpFilterBar count={`${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`}>
        <RpTabs ariaLabel="Status" items={statusTabs} value={statusFilter} onChange={setStatusFilter} />
        <RpSelect
          aria-label="Assignee"
          className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[240px]"
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
        >
          <option value="all">Everyone</option>
          <option value="mine">My tasks</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </RpSelect>
        <div className="flex items-center gap-3">
          <span className="rp-eyebrow--muted">Group</span>
          <RpTabs
            ariaLabel="Group by"
            size="sm"
            value={groupMode}
            onChange={id => setGroupMode(id as GroupMode)}
            items={[{ id: 'due', label: 'Due date' }, { id: 'status', label: 'Status' }, { id: 'none', label: 'None' }]}
          />
        </div>
      </RpFilterBar>

      {filtered.length === 0 ? (
        <RpEmpty
          title="Nothing on the punch list."
          line={tasks.length > 0 ? 'No tasks match these filters.' : 'New items land here as the build moves.'}
          action={canWrite && tasks.length === 0 ? <RpButton variant="ghost" icon={<Plus {...RP_ICON} />} onClick={openNew}>New task</RpButton> : undefined}
        />
      ) : groupMode === 'none' ? (
        <RpList>{filtered.map(renderRow)}</RpList>
      ) : (
        <div className="flex flex-col">
          {visibleGroups.map((g, gi) => (
            <RpGroup key={g.id}>
              <RpGroupHead
                num={gi + 1}
                title={<span className={g.edge ? 'text-rp-alert' : undefined}>{g.title}</span>}
                line={g.edge ? 'Past due and still open' : undefined}
                aside={<span className="rp-counter">{`${g.items.length} ${g.items.length === 1 ? 'item' : 'items'}`}</span>}
              />
              <RpList>{g.items.map(renderRow)}</RpList>
            </RpGroup>
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          task={editingTask}
          members={members}
          onClose={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}
      {deletingTask && <DeleteConfirm itemName={deletingTask.title} onConfirm={handleDelete} onCancel={() => setDeletingTask(null)} />}
    </RpPage>
  )
}

function TaskFormModal({ task, members, onClose }: { task: Task | null; members: MemberOption[]; onClose: () => void }) {
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

  return (
    <RpModal
      open
      onClose={onClose}
      eyebrow={sectionEyebrow('tasks', isEditing ? 'Edit' : 'New')}
      title={isEditing ? 'Edit task' : 'New task'}
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="task-form" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save' : 'Create task'}
          </RpButton>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Title" htmlFor="task-title" required className="sm:col-span-2">
            <RpInput id="task-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Walk the garage row with the GC" required />
          </RpField>
          <RpField label="Description" htmlFor="task-desc" className="sm:col-span-2">
            <RpTextarea id="task-desc" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </RpField>
          <RpField label="Status" htmlFor="task-status">
            <RpSelect id="task-status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof p.status }))}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </RpSelect>
          </RpField>
          <RpField label="Priority" htmlFor="task-priority">
            <RpSelect id="task-priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof p.priority }))}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </RpSelect>
          </RpField>
          <RpField label="Assign to" htmlFor="task-assignee">
            <RpSelect id="task-assignee" value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </RpSelect>
          </RpField>
          <RpField label="Due date" htmlFor="task-due">
            <RpInput id="task-due" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error mt-4" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
