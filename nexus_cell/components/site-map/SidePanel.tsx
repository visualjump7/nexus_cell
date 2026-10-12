'use client'

import {
  STATUS_META,
  zoneForLocation,
  isPinned,
  pctSpent,
  type SiteProject,
  type SiteProjectStatus,
} from '@/lib/site-map'
import { RpMeter, RpFigure, RpButton, RpStatus, RpKV, RpInput, fmtMoney, dot, Search } from '@/components/rp'
import { projectHero } from '@/lib/project-imagery'
import { cn } from '@/lib/utils'
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

const money = (n: number) => fmtMoney(n, { compact: true })
const ratio = (budgeted: number, actual: number) => (budgeted > 0 ? actual / budgeted : 0)

/** Spend meter (gold; alert once over budget). Kept as an export for callers of the old bar. */
export function BudgetBar({ budgeted, actual, height = 3 }: { budgeted: number; actual: number; height?: number }) {
  const size = (height >= 4 ? 4 : height <= 2 ? 2 : 3) as 2 | 3 | 4
  return <RpMeter value={ratio(budgeted, actual)} size={size} label="Share of budget spent" />
}

const BACK_BTN = 'font-display text-[11px] uppercase tracking-[.14em] text-rp-muted transition-colors duration-200 hover:text-rp-text'

function ProjectRow({ p, onClick }: { p: SiteProject; onClick: () => void }) {
  const meta = STATUS_META[p.status]
  const pct = pctSpent(p.budgeted, p.actual)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-rp-line px-4 py-3 text-left transition-colors duration-200 hover:bg-rp-surface"
    >
      <i aria-hidden className="mt-[7px] block h-1.5 w-1.5 shrink-0" style={{ background: meta.color }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-snug text-rp-text">{p.name}</span>
        <span className="mt-1.5 flex items-center gap-3">
          <span className="flex-1"><BudgetBar budgeted={p.budgeted} actual={p.actual} height={2} /></span>
          <span className={cn('whitespace-nowrap text-[12px] tabular-nums', pct > 100 ? 'text-rp-alert' : 'text-rp-muted')}>
            {money(p.budgeted)} · {pct.toFixed(0)}%
          </span>
        </span>
      </span>
    </button>
  )
}

function GroupHeader({ title, sub, onClick, swatch }: { title: string; sub: string; onClick?: () => void; swatch?: string }) {
  const inner = (
    <>
      {swatch && <span className="h-2.5 w-2.5 shrink-0 border border-rp-line3" style={{ background: swatch }} />}
      <span className="flex-1 truncate font-display text-[11px] uppercase tracking-[.16em] text-rp-segtext transition-colors duration-200 group-hover:text-rp-gold">{title}</span>
      <span className="whitespace-nowrap text-[12px] tabular-nums text-rp-dim">{sub}</span>
    </>
  )
  const cls = 'group flex w-full items-center gap-2 border-b border-rp-line px-4 pb-2 pt-5 text-left'
  return onClick
    ? <button type="button" onClick={onClick} className={cls}>{inner}</button>
    : <div className={cls}>{inner}</div>
}

export default function SidePanel({
  projects, visible, zones, statusFilter, onToggleStatus, search, onSearch,
  selectedProject, selectedZone, onSelectProject, onSelectZone, onClear,
}: Props) {
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: projects.filter(p => p.status === s).length }), {} as Record<SiteProjectStatus, number>)
  const visibleIds = new Set(visible.map(p => p.id))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Filters */}
      <div className="shrink-0 space-y-3 border-b border-rp-line px-4 pb-3 pt-3">
        <div className="relative">
          <Search size={16} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rp-dim" />
          <RpInput
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search packages"
            className="!min-h-[40px] pl-9 text-[14px]"
            aria-label="Search projects by name"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {STATUSES.map(s => {
            const on = statusFilter.has(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleStatus(s)}
                aria-pressed={on}
                className={cn(
                  'inline-flex items-center gap-1.5 transition-opacity duration-200 focus-visible:outline-offset-2',
                  on ? 'opacity-100' : 'opacity-45 hover:opacity-80',
                )}
              >
                <RpStatus kind="project" value={s} square />
                <span className="font-display text-[11px] tabular-nums text-rp-dim">{counts[s]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedProject ? (
          <ProjectCard p={selectedProject} onBack={onClear} onZone={onSelectZone} />
        ) : selectedZone ? (
          <div>
            <div className="border-b border-rp-line px-4 pb-4 pt-4">
              <button type="button" onClick={onClear} className={`${BACK_BTN} mb-3`}>← All zones</button>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-3 w-3 border border-rp-line3" style={{ background: zoneColor(selectedZone.pct, selectedZone.projects.length > 0) }} />
                <span className="font-display text-[12px] uppercase tracking-[.2em] text-rp-gold">{selectedZone.zone.short}</span>
              </div>
              <h3 className="font-display text-[22px] uppercase leading-[1.05] tracking-[0.02em] text-rp-text">{selectedZone.zone.name}</h3>
              <p className="mt-1.5 text-[13px] tabular-nums text-rp-muted">
                {dot(`${selectedZone.projects.length} package${selectedZone.projects.length !== 1 ? 's' : ''}`, money(selectedZone.budgeted), `${selectedZone.pct.toFixed(0)}% spent`)}
              </p>
              <div className="mt-3"><BudgetBar budgeted={selectedZone.budgeted} actual={selectedZone.actual} height={4} /></div>
              <div className="mt-1.5 flex justify-between text-[12px] tabular-nums text-rp-muted">
                <span>{fmtMoney(selectedZone.actual)} spent</span>
                <span>{fmtMoney(selectedZone.budgeted)} budget</span>
              </div>
            </div>
            {selectedZone.projects.length === 0 && <p className="px-4 py-6 text-[14px] text-rp-dim">Nothing in this zone yet.</p>}
            {selectedZone.projects.map(p => (
              <ProjectRow key={p.id} p={p} onClick={() => onSelectProject(p.id)} />
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
    return (
      <div className="px-4 py-8">
        <p className="font-display text-[11px] uppercase tracking-[.18em] text-rp-muted">Empty</p>
        <p className="mt-2 text-[14px] text-rp-dim">No packages match these filters.</p>
      </div>
    )
  }

  const sum = (ps: SiteProject[]) => ps.reduce((s, p) => s + p.budgeted, 0)

  return (
    <div className="pb-4">
      {zoneGroups.map(({ z, items }) => (
        <div key={z.zone.id}>
          <GroupHeader
            title={z.zone.name}
            sub={`${money(z.budgeted)} · ${z.pct.toFixed(0)}%`}
            swatch={zoneColor(z.pct, true)}
            onClick={() => onSelectZone(z.zone.id)}
          />
          {items.map(p => <ProjectRow key={p.id} p={p} onClick={() => onSelectProject(p.id)} />)}
        </div>
      ))}
      {other.length > 0 && (
        <div>
          <GroupHeader title="Perimeter & other" sub={money(sum(other))} />
          {other.map(p => <ProjectRow key={p.id} p={p} onClick={() => onSelectProject(p.id)} />)}
        </div>
      )}
      {soft.length > 0 && (
        <div>
          <GroupHeader title="Sitewide & soft costs" sub={`${money(sum(soft))} · not pinned`} />
          {soft.map(p => <ProjectRow key={p.id} p={p} onClick={() => onSelectProject(p.id)} />)}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ p, onBack, onZone }: { p: SiteProject; onBack: () => void; onZone: (id: string) => void }) {
  const pct = pctSpent(p.budgeted, p.actual)
  const zone = zoneForLocation(p.location)
  const remaining = p.budgeted - p.actual
  const hero = projectHero(p)
  return (
    <div className="flex flex-col gap-4 px-4 pb-5 pt-4">
      <button type="button" onClick={onBack} className={`${BACK_BTN} self-start`}>← Back</button>

      <RpFigure
        {...hero}
        aspect="card"
        lightbox={false}
        caption={undefined}
        num={undefined}
        qualifier={hero.qualifier}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[22px] uppercase leading-[1.05] tracking-[0.02em] text-rp-text">{p.name}</h3>
          <RpStatus kind="project" value={p.status} className="shrink-0" />
        </div>
        {p.project_type && <p className="text-[13px] text-rp-muted">{p.project_type}</p>}
      </div>

      <div className="border border-rp-line bg-rp-panel p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display text-[11px] uppercase tracking-[.16em] text-rp-muted">Budget</span>
          <span className={cn('font-display text-[22px] font-medium tabular-nums', pct > 100 ? 'text-rp-alert' : 'text-rp-text')}>
            {pct.toFixed(0)}%<span className="ml-1.5 text-[11px] font-normal uppercase tracking-[.14em] text-rp-dim">spent</span>
          </span>
        </div>
        <BudgetBar budgeted={p.budgeted} actual={p.actual} height={4} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { l: 'Budget', v: money(p.budgeted), alert: false },
            { l: 'Spent', v: money(p.actual), alert: false },
            { l: remaining < 0 ? 'Over' : 'Left', v: money(Math.abs(remaining)), alert: remaining < 0 },
          ].map(c => (
            <div key={c.l}>
              <div className="mb-0.5 font-display text-[10px] uppercase tracking-[.16em] text-rp-dim">{c.l}</div>
              <div className={cn('font-display text-[15px] tabular-nums', c.alert ? 'text-rp-alert' : 'text-rp-text')}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>

      <RpKV
        items={[
          {
            label: 'Location',
            value: zone
              ? <button type="button" onClick={() => onZone(zone.id)} className="text-right transition-colors duration-200 hover:text-rp-blue">{p.location}</button>
              : (p.location || '—'),
          },
          ...(p.openTasks != null ? [{ label: 'Open tasks', value: p.openTasks, num: true }] : []),
          {
            label: 'Active alerts',
            value: <span className={p.activeAlerts > 0 ? 'text-rp-gold' : undefined}>{p.activeAlerts}</span>,
            num: true,
          },
        ]}
        className="text-[13px]"
      />

      {p.description && <p className="text-[14px] leading-relaxed text-rp-muted">{p.description}</p>}

      <RpButton variant="text" arrow href={`/projects/${p.id}`} className="self-start">Open project</RpButton>
    </div>
  )
}
