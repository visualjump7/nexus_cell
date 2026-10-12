// Single source for status labels and tones (redesign plan A4).
// Tags render these through <RpStatus kind value />.
import { BRAND } from '@/lib/brand'
import type { RpTone } from './types'

export interface RpStatusDef { label: string; tone: RpTone }

type StatusMap = Record<string, RpStatusDef>

const s = (label: string, tone: RpTone): RpStatusDef => ({ label, tone })

export const STATUS = {
  project: {
    active: s('Active', 'gold'),
    on_hold: s('On hold', 'blue'),
    completed: s('Complete', 'green'),
    archived: s('Archived', 'dim'),
  },
  bill: {
    pending: s('Pending', 'gold'),
    approved: s('Approved', 'blue'),
    paid: s('Paid', 'green'),
    overdue: s('Overdue', 'alert'),
    rejected: s('Rejected', 'dim'),
  },
  task: {
    todo: s('To do', 'neutral'),
    in_progress: s('In progress', 'gold'),
    waiting: s('Waiting', 'blue'),
    done: s('Done', 'green'),
    cancelled: s('Cancelled', 'dim'),
  },
  priority: {
    low: s('Low', 'dim'),
    normal: s('Normal', 'neutral'),
    high: s('High', 'gold'),
    urgent: s('Urgent', 'alert'),
  },
  alertType: {
    approval: s('Sign-off', 'gold'),
    action_required: s('Action', 'gold'),
    urgent: s('Urgent', 'alert'),
    info: s('Info', 'blue'),
    fyi: s('FYI', 'neutral'),
  },
  alertStatus: {
    open: s('Open', 'gold'),
    acknowledged: s('Seen', 'blue'),
    resolved: s('Resolved', 'green'),
    expired: s('Expired', 'dim'),
  },
  trip: {
    planning: s('Planning', 'blue'),
    confirmed: s('Confirmed', 'gold'),
    in_progress: s('Underway', 'gold'),
    completed: s('Complete', 'green'),
    cancelled: s('Cancelled', 'dim'),
  },
  contact: {
    active: s('Active', 'green'),
    'on-leave': s('On leave', 'gold'),
    on_leave: s('On leave', 'gold'),
    completed: s('Complete', 'neutral'),
    terminated: s('Ended', 'alert'),
  },
  insurance: {
    on_file: s('On file', 'green'),
    expiring: s('Expiring soon', 'gold'),
    expired: s('Expired', 'alert'),
    missing: s('Not on file', 'dim'),
  },
  brief: {
    draft: s('Draft', 'neutral'),
    published: s('Published', 'green'),
    archived: s('Archived', 'dim'),
  },
  member: {
    active: s('Active', 'green'),
    invited: s('Invited', 'gold'),
    inactive: s('Inactive', 'dim'),
  },
  invitation: {
    pending: s('Pending', 'gold'),
    approved: s('Approved', 'green'),
    rejected: s('Declined', 'dim'),
  },
  gift: {
    idea: s('Idea', 'neutral'),
    purchased: s('Purchased', 'gold'),
    shipped: s('Shipped', 'blue'),
    delivered: s('Delivered', 'green'),
    thanked: s('Thanked', 'green'),
  },
  membership: {
    active: s('Active', 'green'),
    expired: s('Expired', 'alert'),
    cancelled: s('Cancelled', 'dim'),
  },
  subscription: {
    active: s('Active', 'green'),
    paused: s('Paused', 'blue'),
    cancelled: s('Cancelled', 'dim'),
  },
  sync: {
    ok: s('Synced', 'green'),
    error: s('Sync error', 'alert'),
    never: s('Not synced', 'dim'),
  },
  role: {
    principal: s(BRAND.roleLabel.principal, 'gold'),
    ea: s(BRAND.roleLabel.ea, 'neutral'),
    cfo: s(BRAND.roleLabel.cfo, 'neutral'),
    admin: s(BRAND.roleLabel.admin, 'blue'),
    viewer: s(BRAND.roleLabel.viewer, 'dim'),
  },
} satisfies Record<string, StatusMap>

export type RpStatusKind = keyof typeof STATUS

function humanize(value: string): string {
  const t = value.replace(/[_-]/g, ' ').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'
}

/** Label + tone for a status value. Unknown values: neutral, humanised. */
export function statusDef(kind: RpStatusKind, value?: string | null): RpStatusDef {
  if (!value) return { label: '—', tone: 'dim' }
  const map = STATUS[kind] as StatusMap
  const hit = map[value] ?? map[value.toLowerCase()]
  return hit ?? { label: humanize(value), tone: 'neutral' }
}

export function statusTone(kind: RpStatusKind, value?: string | null): RpTone {
  return statusDef(kind, value).tone
}

export function statusLabel(kind: RpStatusKind, value?: string | null): string {
  return statusDef(kind, value).label
}
