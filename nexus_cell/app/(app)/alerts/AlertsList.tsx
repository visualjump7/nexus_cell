'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert, UserRole } from '@/lib/types'
import DeleteConfirm from '@/components/DeleteConfirm'
import {
  RpPage, RpPageHeader, RpFilterBar, RpTabs, RpSelect, RpGroup, RpGroupHead, RpCardGrid, RpList, RpRow,
  RpStatus, RpButton, RpEmpty, RpModal, RpField, RpInput, RpTextarea, RpFormGrid,
  Plus, RP_ICON, dot, timeAgo, fmtDate, statusLabel,
} from '@/components/rp'
import { sectionEyebrow } from '@/lib/sections'

/** Below 640px, wrap a row's status and actions onto their own line (kit rows cap the end at 50%). */
const ROW_STACK_SM = 'max-sm:flex-wrap max-sm:[&>.rp-row-main]:basis-0 max-sm:[&>.rp-row-end]:max-w-none max-sm:[&>.rp-row-end]:basis-full max-sm:[&>.rp-row-end]:justify-start'

const TYPE_ORDER: Alert['alert_type'][] = ['approval', 'action_required', 'urgent', 'info', 'fyi']

interface Props { alerts: Alert[]; role: UserRole; userId?: string }

export default function AlertsList({ alerts, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const canApprove = ['principal', 'ea', 'admin'].includes(role)

  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const byPriority = alerts.filter(a => priorityFilter === 'all' || a.priority === priorityFilter)
  const filtered = byPriority.filter(a => typeFilter === 'all' || a.alert_type === typeFilter)

  const isSignoff = (a: Alert) => a.alert_type === 'approval' && a.status === 'open'
  const signoffs = filtered.filter(isSignoff)
  const rest = filtered.filter(a => !isSignoff(a))
  const showSignoffs = (typeFilter === 'all' || typeFilter === 'approval') && signoffs.length > 0

  const openCount = alerts.filter(a => a.status === 'open').length
  const signoffCount = alerts.filter(isSignoff).length
  const urgentCount = alerts.filter(a => a.status === 'open' && (a.priority === 'urgent' || a.alert_type === 'urgent')).length

  async function handleApproval(alertId: string, decision: 'approved' | 'rejected') {
    setApprovingId(alertId)
    await fetch(`/api/alerts/${alertId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    setApprovingId(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deletingAlert) return
    await fetch(`/api/alerts/${deletingAlert.id}`, { method: 'DELETE' })
    setDeletingAlert(null)
    router.refresh()
  }

  const edgeFor = (a: Alert): 'alert' | 'gold' | undefined =>
    a.priority === 'urgent' ? 'alert' : a.priority === 'high' ? 'gold' : undefined

  const typeTabs = [
    { id: 'all', label: 'All', count: byPriority.length },
    ...TYPE_ORDER.map(t => ({ id: t, label: statusLabel('alertType', t), count: byPriority.filter(a => a.alert_type === t).length })),
  ]

  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('alerts')}
        title="Sign-offs and site issues"
        line={dot(
          `${openCount} open`,
          `${signoffCount} awaiting sign-off`,
          urgentCount > 0 && `${urgentCount} urgent`,
        )}
        actions={canWrite && (
          <RpButton icon={<Plus {...RP_ICON} />} onClick={() => setShowForm(true)}>New alert</RpButton>
        )}
      />

      <RpFilterBar count={`${filtered.length} ${filtered.length === 1 ? 'alert' : 'alerts'}`}>
        <RpTabs ariaLabel="Alert type" items={typeTabs} value={typeFilter} onChange={setTypeFilter} />
        <RpSelect
          aria-label="Priority"
          className="w-full sm:w-auto sm:min-w-[170px] sm:max-w-[220px]"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="all">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </RpSelect>
      </RpFilterBar>

      {filtered.length === 0 ? (
        <RpEmpty title="All clear." line="No open sign-offs or site issues." />
      ) : (
        <div className="flex flex-col">
          {showSignoffs && (
            <RpGroup>
              <RpGroupHead
                num={1}
                title="Awaiting your sign-off"
                aside={<span className="rp-counter">{`${signoffs.length} open`}</span>}
              />
              <RpCardGrid min={360} max={2}>
                {signoffs.map(alert => (
                  <article key={alert.id} className="flex min-w-0 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <RpStatus kind="alertType" value={alert.alert_type} />
                      <RpStatus kind="priority" value={alert.priority} />
                    </div>
                    <h3 className="font-display text-xl uppercase leading-[1.15] tracking-[.03em] text-rp-text">{alert.title}</h3>
                    {alert.body && <p className="line-clamp-3 text-[15px] leading-normal text-rp-muted">{alert.body}</p>}
                    <p className="text-[13px] text-rp-dim" suppressHydrationWarning>{dot(timeAgo(alert.created_at), alert.expires_at && `Due ${fmtDate(alert.expires_at, 'short')}`)}</p>
                    {(canApprove || canWrite) && (
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                        {canApprove && (
                          <>
                            <RpButton size="sm" onClick={() => handleApproval(alert.id, 'approved')} disabled={approvingId === alert.id}>
                              Approve
                            </RpButton>
                            <RpButton variant="danger" size="sm" onClick={() => handleApproval(alert.id, 'rejected')} disabled={approvingId === alert.id}>
                              Reject
                            </RpButton>
                          </>
                        )}
                        {canWrite && (
                          <RpButton variant="text" size="sm" className="ml-auto" onClick={() => setDeletingAlert(alert)}>Delete</RpButton>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </RpCardGrid>
            </RpGroup>
          )}

          {rest.length > 0 && (
            <RpGroup>
              <RpGroupHead
                num={showSignoffs ? 2 : 1}
                title="All alerts"
                aside={<span className="rp-counter">{`${rest.length} ${rest.length === 1 ? 'alert' : 'alerts'}`}</span>}
              />
              <RpList>
                {rest.map(alert => (
                  <RpRow
                    key={alert.id}
                    className={ROW_STACK_SM}
                    edge={edgeFor(alert)}
                    title={alert.title}
                    meta={
                      <>
                        {alert.body && <span className="mb-1 line-clamp-2 block">{alert.body}</span>}
                        <span className="text-rp-dim" suppressHydrationWarning>
                          {dot(statusLabel('alertStatus', alert.status), statusLabel('priority', alert.priority), timeAgo(alert.created_at))}
                        </span>
                      </>
                    }
                    aside={<RpStatus kind="alertType" value={alert.alert_type} />}
                    actions={canWrite ? (
                      <RpButton variant="text" size="sm" onClick={() => setDeletingAlert(alert)}>Delete</RpButton>
                    ) : undefined}
                  />
                ))}
              </RpList>
            </RpGroup>
          )}
        </div>
      )}

      {showForm && <AlertFormModal onClose={() => setShowForm(false)} />}
      {deletingAlert && <DeleteConfirm itemName={deletingAlert.title} onConfirm={handleDelete} onCancel={() => setDeletingAlert(null)} />}
    </RpPage>
  )
}

function AlertFormModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', body: '', alert_type: 'info', priority: 'normal', target_role: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, body: form.body || null, target_role: form.target_role || null }),
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
      eyebrow={sectionEyebrow('alerts', 'New')}
      title="New alert"
      footer={
        <>
          <RpButton variant="ghost" onClick={onClose}>Cancel</RpButton>
          <RpButton type="submit" form="alert-form" disabled={saving}>{saving ? 'Sending…' : 'Send alert'}</RpButton>
        </>
      }
    >
      <form id="alert-form" onSubmit={handleSubmit}>
        <RpFormGrid>
          <RpField label="Title" htmlFor="alert-title" required className="sm:col-span-2">
            <RpInput id="alert-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Paving change order needs sign-off" required />
          </RpField>
          <RpField label="Body" htmlFor="alert-body" className="sm:col-span-2">
            <RpTextarea id="alert-body" rows={3} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="What it is, what it costs, what happens if it waits" />
          </RpField>
          <RpField label="Type" htmlFor="alert-type">
            <RpSelect id="alert-type" value={form.alert_type} onChange={e => setForm(p => ({ ...p, alert_type: e.target.value as typeof p.alert_type }))}>
              <option value="info">Info</option>
              <option value="action_required">Action required</option>
              <option value="approval">Sign-off</option>
              <option value="urgent">Urgent</option>
              <option value="fyi">FYI</option>
            </RpSelect>
          </RpField>
          <RpField label="Priority" htmlFor="alert-priority">
            <RpSelect id="alert-priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof p.priority }))}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </RpSelect>
          </RpField>
          <RpField label="Send to" htmlFor="alert-target" className="sm:col-span-2">
            <RpSelect id="alert-target" value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}>
              <option value="">Everyone</option>
              <option value="principal">Owner</option>
              <option value="ea">Owner&apos;s Rep</option>
              <option value="cfo">CFO</option>
            </RpSelect>
          </RpField>
        </RpFormGrid>
        {error && <p className="rp-error mt-4" role="alert">{error}</p>}
      </form>
    </RpModal>
  )
}
