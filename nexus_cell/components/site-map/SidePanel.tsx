'use client'

import Link from 'next/link'
import {
  STATUS_META,
  zoneForLocation,
  isPinned,
  pctSpent,
  formatMoneyShort,
  type SiteProject,
  type SiteProjectStatus,
} from '@/lib/site-map'
import { formatCurrency } from '@/lib/utils'
import { zoneColor, type ZoneStat } from './utils'

const STATUSES: SiteProjectStatus[] = ['active', 'completed', 'on_hold', 'archived']

interface Props {
  projects: SiteProject[]
  visible: SiteProject[]
  zones: ZoneStat[]
  statusFilter: Set<SiteProjectStatus>
  onToggleStatus: (s: SiteProjectStatus) => void
  search: string
  onSearch: (s: string) => void
  selectedProject: SiteProject | null
  selectedZone: ZoneStat | null
  onSelectProject: (id: string | null) => void
  onSelectZone: (id: string | null) => void
  onClear: () => void
}

export function BudgetBar({ budgeted, actual, height = 6 }: { budgeted: number; actual: number; height?: number }) {
  const pct = pctSpent(budgeted, actual)
  const over = pct > 100
  return (
    <div className="w-full bg-[#1F2225]" style={{ height }} aria-hidden>
      <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: over ? '#E0BF7B' : '#CDA14B' }} />
    </div>
  )
}

function ProjectRow({ p, onClick, active }: { p: SiteProject; onClick: () => void; active: boolean }) {
  const meta = STATUS_META[p.status]
  const pct = pctSpent(p.budgeted, p.actual)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 border-b border-[#1A1C1E] transition-colors hover:bg-[#141618] ${active ? 'bg-[#141618]' : ''}`}
    >
      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: meta.color, opacity: p.status === 'archived' ? 0.7 : 1 }} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-[#E6E6E6] leading-snug truncate">{p.name}</span>
        <span className="flex items-center gap-2 mt-1">
          <span className="flex-1"><BudgetBar budgeted={p.budgeted} actual={p.actual} height={3} /></span>
          <span className="text-[11px] text-[#9AA0A4] tabular-nums whitespace-nowrap">{formatMoneyShort(p.budgeted)} · {pct.toFixed(0)}%</span>
        </span>
      </span>
    </button>
  )
}

function GroupHeader({ title, sub, onClick, swatch }: { title: string; sub: string; onClick?: () => void; swatch?: string }) {
  const inner = (
    <>
      {swatch && <span className="w-2.5 h-2.5 shrink-0 border border-[#3A3E42]" style={{ background: swatch }} />}
      <span className="rp-eyebrow--muted !text-[10.5px] !text-[#C9CCCE] flex-1 truncate">{title}</span>
      <span className="text-[11px] text-[#6E7578] tabular-nums whitespace-nowrap">{sub}</span>
    </>
  )
  const cls = 'w-full flex items-center gap-2 px-4 pt-4 pb-2 text-left'
  return onClick
    ? <button type="button" onClick={onClick} className={`${cls} hover:[&>span]:!text-[#F5F5F5]`}>{inner}</button>
    : <div className={cls}>{inner}</div>
}

export default function SidePanel({
  projects, visible, zones, statusFilter, onToggleStatus, search, onSearch,
  selectedProject, selectedZone, onSelectProject, onSelectZone, onClear,
}: Props) {
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: projects.filter(p => p.status === s).length }), {} as Record<SiteProjectStatus, number>)
  const visibleIds = new Set(visible.map(p => p.id))

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filters */}
      <div className="px-4 pt-3 pb-3 border-b border-[#1F1F1F] space-y-2.5 shrink-0">
        <input
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full px-3 py-2 bg-[#0A0B0C] border border-[#26292C] text-sm text-[#F5F5F5] placeholder-[#6E7578] focus:outline-none focus:border-[#CDA14B]"
          aria-label="Search projects by name"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => {
            const on = statusFilter.has(s)
            const meta = STATUS_META[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleStatus(s)}
                aria-pressed={on}
                className="rp-tag !text-[10px] !px-2 !py-1 transition-colors"
                style={on ? { color: '#F5F5F5', borderColor: `${meta.color}99` } : { opacity: 0.5 }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.label} <span className="text-[#6E7578]">{counts[s]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {selectedProject ? (
          <ProjectCard p={selectedProject} onBack={onClear} onZone={onSelectZone} />
        ) : selectedZone ? (
          <div>
            <div className="px-4 pt-4 pb-3 border-b border-[#1F1F1F]">
              <button type="button" onClick={onClear} className="rp-eyebrow--muted !text-[10px] hover:!text-[#F5F5F5] mb-2">← All zones</button>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 border border-[#3A3E42]" style={{ background: zoneColor(selectedZone.pct, selectedZone.projects.length > 0) }} />
                <span className="rp-eyebrow">{selectedZone.zone.short}</span>
              </div>
              <h3 className="font-display uppercase text-[20px] leading-tight tracking-[0.02em] text-[#F5F5F5]">{selectedZone.zone.name}</h3>
              <p className="rp-caption mt-1.5 tabular-nums">
                {selectedZone.projects.length} project{selectedZone.projects.length !== 1 ? 's' : ''} · {formatMoneyShort(selectedZone.budgeted)} · {selectedZone.pct.toFixed(0)}% spent
              </p>
              <div className="mt-3"><BudgetBar budgeted={selectedZone.budgeted} actual={selectedZone.actual} /></div>
              <div className="flex justify-between mt-1.5 text-[11px] text-[#9AA0A4] tabular-nums">
                <span>{formatCurrency(selectedZone.actual)} spent</span>
                <span>{formatCurrency(selectedZone.budgeted)} budget</span>
              </div>
            </div>
            {selectedZone.projects.length === 0 && <p className="px-4 py-6 text-sm text-[#6E7578]">No projects in this zone yet.</p>}
            {selectedZone.projects.map(p => (
              <ProjectRow key={p.id} p={p} active={false} onClick={() => onSelectProject(p.id)} />
            ))}
          </div>
        ) : (
          <GroupedList
            zones={zones}
            visible={visible}
            visibleIds={visibleIds}
            onSelectProject={onSelectProject}
            onSelectZone={onSelectZone}
          />
        )}
      </div>
    </div>
  )
}

function GroupedList({ zones, visible, visibleIds, onSelectProject, onSelectZone }: {
  zones: ZoneStat[]
  visible: SiteProject[]
  visibleIds: Set<string>
  onSelectProject: (id: string) => void
  onSelectZone: (id: string) => void
}) {
  const soft = visible.filter(p => !isPinned(p))
  const softIds = new Set(soft.map(p => p.id))
  const zoneGroups = zones
    .map(z => ({ z, items: z.projects.filter(p => visibleIds.has(p.id) && !softIds.has(p.id)) }))
    .filter(g => g.items.length > 0)
    .sort((a, b) => b.z.budgeted - a.z.budgeted)
  const other = visible.filter(p => !softIds.has(p.id) && !zoneForLocation(p.location))

  if (visible.length === 0) {
    return <p className="px-4 py-8 text-sm text-[#6E7578] text-center">No projects match these filters.</p>
  }

  const sum = (ps: SiteProject[]) => ps.reduce((s, p) => s + p.budgeted, 0)

  return (
    <div className="pb-4">
      {zoneGroups.map(({ z, items }) => (
        <div key={z.zone.id}>
          <GroupHeader
            title={z.zone.name}
            sub={`${formatMoneyShort(z.budgeted)} · ${z.pct.toFixed(0)}%`}
            swatch={zoneColor(z.pct, true)}
            onClick={() => onSelectZone(z.zone.id)}
          />
          {items.map(p => <ProjectRow key={p.id} p={p} active={false} onClick={() => onSelectProject(p.id)} />)}
        </div>
      ))}
      {other.length > 0 && (
        <div>
          <GroupHeader title="Perimeter & other" sub={formatMoneyShort(sum(other))} />
          {other.map(p => <ProjectRow key={p.id} p={p} active={false} onClick={() => onSelectProject(p.id)} />)}
        </div>
      )}
      {soft.length > 0 && (
        <div>
          <GroupHeader title="Sitewide & soft costs" sub={`${formatMoneyShort(sum(soft))} · not pinned`} />
          {soft.map(p => <ProjectRow key={p.id} p={p} active={false} onClick={() => onSelectProject(p.id)} />)}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ p, onBack, onZone }: { p: SiteProject; onBack: () => void; onZone: (id: string) => void }) {
  const meta = STATUS_META[p.status]
  const pct = pctSpent(p.budgeted, p.actual)
  const zone = zoneForLocation(p.location)
  const remaining = p.budgeted - p.actual
  return (
    <div className="px-4 pt-4 pb-5">
      <button type="button" onClick={onBack} className="rp-eyebrow--muted !text-[10px] hover:!text-[#F5F5F5] mb-3">← Back</button>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="font-display uppercase text-[20px] leading-tight tracking-[0.02em] text-[#F5F5F5]">{p.name}</h3>
        <span className="rp-tag !text-[10px] shrink-0" style={{ color: meta.color, borderColor: `${meta.color}66` }}>{meta.label}</span>
      </div>
      {p.project_type && <p className="rp-caption">{p.project_type}</p>}

      <div className="mt-4 rp-surface p-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="rp-eyebrow--muted !text-[10px]">Budget</span>
          <span className="font-display text-[20px] text-[#F5F5F5] tabular-nums">{pct.toFixed(0)}%<span className="text-[11px] text-[#6E7578] ml-1 tracking-[0.12em] uppercase">spent</span></span>
        </div>
        <BudgetBar budgeted={p.budgeted} actual={p.actual} />
        <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] tabular-nums">
          <div><div className="text-[#6E7578] uppercase tracking-[0.12em] text-[9.5px] mb-0.5">Budget</div><div className="text-[#E6E6E6]">{formatMoneyShort(p.budgeted)}</div></div>
          <div><div className="text-[#6E7578] uppercase tracking-[0.12em] text-[9.5px] mb-0.5">Spent</div><div className="text-[#E6E6E6]">{formatMoneyShort(p.actual)}</div></div>
          <div><div className="text-[#6E7578] uppercase tracking-[0.12em] text-[9.5px] mb-0.5">{remaining < 0 ? 'Over' : 'Left'}</div><div className={remaining < 0 ? 'text-[#E0BF7B]' : 'text-[#E6E6E6]'}>{formatMoneyShort(Math.abs(remaining))}</div></div>
        </div>
      </div>

      <dl className="mt-4 space-y-2.5 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#6E7578]">Location</dt>
          <dd className="text-right text-[#E6E6E6]">
            {zone ? <button type="button" onClick={() => onZone(zone.id)} className="hover:text-[#CDA14B] text-right">{p.location}</button> : (p.location || '—')}
          </dd>
        </div>
        {p.openTasks != null && (
          <div className="flex justify-between gap-3"><dt className="text-[#6E7578]">Open tasks</dt><dd className="text-[#E6E6E6] tabular-nums">{p.openTasks}</dd></div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-[#6E7578]">Active alerts</dt>
          <dd className={`tabular-nums ${p.activeAlerts > 0 ? 'text-[#CDA14B]' : 'text-[#E6E6E6]'}`}>{p.activeAlerts}</dd>
        </div>
      </dl>

      {p.description && <p className="mt-4 text-[13px] leading-relaxed text-[#9AA0A4]">{p.description}</p>}

      <Link href={`/projects/${p.id}`} className="rp-btn-ghost w-full mt-5">Open project →</Link>
    </div>
  )
}
