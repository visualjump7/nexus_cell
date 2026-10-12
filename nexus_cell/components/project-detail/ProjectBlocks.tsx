'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectBlock, ProjectBlockType, UserRole } from '@/lib/types'
import GalleryBlock from './GalleryBlock'
import PersonnelBlock from './PersonnelBlock'
import SubcontractorBlock from './SubcontractorBlock'
import NotesBlock from './NotesBlock'
import DeleteConfirm from '@/components/DeleteConfirm'
import { useToast } from '@/components/shared/Toast'
import {
  RpButton, RpCapNum, RpEmpty, RpGroup, RpGroupHead, RpTag,
  ArrowDown, ArrowUp, Plus, Trash2, RP_ICON, pushEscapeLayer,
} from '@/components/rp'

export const blockTypeConfig: Record<ProjectBlockType, { label: string; description: string }> = {
  gallery: { label: 'Images', description: 'Renders and site photos' },
  personnel: { label: 'Team', description: 'People on the package' },
  subcontractor: { label: 'Subcontractors', description: 'Trades, contracts, insurance' },
  notes: { label: 'Notes', description: 'Running notes' },
}

/** Anchor id for the first block of a type (used by the project page's section nav). */
export function blockAnchor(type: ProjectBlockType): string {
  return `directory-${type}`
}

interface Props {
  projectId: string
  orgId: string
  blocks: ProjectBlock[]
  role: UserRole
  /** Number of the first block (default 1), so block heads can match a page's section nav. */
  numberFrom?: number
}

export default function ProjectBlocks({ projectId, orgId, blocks, role, numberFrom = 1 }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [deletingBlock, setDeletingBlock] = useState<ProjectBlock | null>(null)
  const [moving, setMoving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Add-block menu: outside click and Esc close it.
  useEffect(() => {
    if (!showAddMenu) return
    function onDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setShowAddMenu(false)
    }
    document.addEventListener('mousedown', onDown)
    const pop = pushEscapeLayer(() => setShowAddMenu(false))
    return () => { document.removeEventListener('mousedown', onDown); pop() }
  }, [showAddMenu])

  async function addBlock(type: ProjectBlockType) {
    setShowAddMenu(false)
    await fetch('/api/project-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, type, title: blockTypeConfig[type].label }),
    })
    router.refresh()
  }

  async function updateTitle(block: ProjectBlock, title: string) {
    if (title === (block.title || blockTypeConfig[block.type]?.label || '')) return
    await fetch(`/api/project-blocks/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    router.refresh()
  }

  // Reorder: swap with the neighbour, then write every position that changed.
  async function move(index: number, d: -1 | 1) {
    const to = index + d
    if (to < 0 || to >= blocks.length || moving) return
    const order = [...blocks]
    ;[order[index], order[to]] = [order[to], order[index]]
    setMoving(true)
    try {
      const saved = await Promise.all(order.map((b, i) => (b.position === i ? true : fetch(`/api/project-blocks/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: i }),
      }).then(r => r.ok, () => false))))
      if (saved.includes(false)) toast('Could not save the new section order', 'error')
      router.refresh()
    } finally {
      setMoving(false)
    }
  }

  async function handleDeleteBlock() {
    if (!deletingBlock) return
    await fetch(`/api/project-blocks/${deletingBlock.id}`, { method: 'DELETE' })
    setDeletingBlock(null)
    router.refresh()
  }

  const firstOfType = new Set<string>()
  const anchorFor = (b: ProjectBlock) => {
    if (firstOfType.has(b.type)) return `block-${b.id}`
    firstOfType.add(b.type)
    return blockAnchor(b.type)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Add block */}
      {canWrite && (
        <div ref={menuRef} className="relative self-start">
          <RpButton
            variant="ghost"
            icon={<Plus {...RP_ICON} />}
            aria-haspopup="menu"
            aria-expanded={showAddMenu}
            onClick={() => setShowAddMenu(v => !v)}
          >
            Add block
          </RpButton>

          {showAddMenu && (
            <div
              role="menu"
              aria-label="Add block"
              className="absolute left-0 top-full z-20 mt-px w-[min(340px,calc(100vw-40px))] border border-rp-line2 bg-rp-bg"
            >
              {(Object.entries(blockTypeConfig) as [ProjectBlockType, typeof blockTypeConfig[ProjectBlockType]][]).map(([type, config], i) => (
                <button
                  key={type}
                  type="button"
                  role="menuitem"
                  onClick={() => addBlock(type)}
                  className="flex w-full items-baseline gap-3.5 border-l-2 border-transparent px-4 py-3 text-left transition-colors duration-200 hover:border-rp-gold hover:bg-rp-surface [&+&]:border-t [&+&]:border-t-rp-line"
                >
                  <RpCapNum n={i + 1} className="text-xs" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-display text-[15px] uppercase tracking-[.08em] text-rp-text">{config.label}</span>
                    <span className="text-[13px] text-rp-muted">{config.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocks */}
      {blocks.length === 0 ? (
        <RpEmpty
          compact
          title="Nothing in the directory yet."
          line="Add renders and site photos, the package team, subcontractors or running notes."
        />
      ) : (
        <div className="flex flex-col">
          {blocks.map((block, i) => {
            const cfg = blockTypeConfig[block.type]
            return (
              <RpGroup key={block.id} id={anchorFor(block)} className="pb-8 last:pb-0">
                <RpGroupHead
                  num={numberFrom + i}
                  title={canWrite ? (
                    <BlockTitle
                      key={`${block.id}-${block.title ?? ''}`}
                      initial={block.title || cfg?.label || ''}
                      label={`${cfg?.label ?? 'Block'} title`}
                      onCommit={v => updateTitle(block, v)}
                    />
                  ) : (block.title || cfg?.label)}
                  tag={cfg && <RpTag>{cfg.label}</RpTag>}
                  aside={canWrite && (
                    <span className="flex items-center gap-1.5">
                      <RpButton variant="icon" size="sm" aria-label="Move up" disabled={i === 0 || moving} onClick={() => move(i, -1)}>
                        <ArrowUp {...RP_ICON} />
                      </RpButton>
                      <RpButton variant="icon" size="sm" aria-label="Move down" disabled={i === blocks.length - 1 || moving} onClick={() => move(i, 1)}>
                        <ArrowDown {...RP_ICON} />
                      </RpButton>
                      <RpButton variant="icon" size="sm" aria-label="Delete block" className="hover:border-rp-alert hover:text-rp-alert" onClick={() => setDeletingBlock(block)}>
                        <Trash2 {...RP_ICON} />
                      </RpButton>
                    </span>
                  )}
                />

                {block.type === 'gallery' && (
                  <GalleryBlock
                    blockId={block.id}
                    images={block.project_images || []}
                    canWrite={canWrite}
                    orgId={orgId}
                    projectId={projectId}
                  />
                )}
                {block.type === 'personnel' && (
                  <PersonnelBlock
                    blockId={block.id}
                    contacts={(block.project_contacts || []).filter(c => c.contact_type === 'personnel')}
                    canWrite={canWrite}
                  />
                )}
                {block.type === 'subcontractor' && (
                  <SubcontractorBlock
                    blockId={block.id}
                    contacts={(block.project_contacts || []).filter(c => c.contact_type === 'subcontractor')}
                    canWrite={canWrite}
                  />
                )}
                {block.type === 'notes' && (
                  <NotesBlock
                    blockId={block.id}
                    initialContent={(block.config as { content_html?: string })?.content_html || ''}
                    canWrite={canWrite}
                  />
                )}
              </RpGroup>
            )
          })}
        </div>
      )}

      {deletingBlock && (
        <DeleteConfirm
          itemName={`${deletingBlock.title || blockTypeConfig[deletingBlock.type]?.label} block`}
          onConfirm={handleDeleteBlock}
          onCancel={() => setDeletingBlock(null)}
        />
      )}
    </div>
  )
}

/** Inline title editor: Oswald 24 uppercase, sized to its text, blue rule on focus. */
function BlockTitle({ initial, label, onCommit }: { initial: string; label: string; onCommit: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  const cls = 'col-start-1 row-start-1 font-display text-2xl uppercase leading-[1.1] tracking-[.02em]'
  return (
    <span className="inline-grid max-w-full grid-cols-[minmax(0,auto)] overflow-hidden align-baseline">
      <span aria-hidden className={`${cls} invisible whitespace-pre border-b border-transparent pr-1`}>{value || ' '}</span>
      <input
        value={value}
        aria-label={label}
        onChange={e => setValue(e.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        className={`${cls} w-full min-w-[4ch] border-b border-transparent bg-transparent p-0 text-rp-text outline-none transition-colors duration-200 hover:border-rp-line2 focus:border-rp-blue focus-visible:outline-none`}
      />
    </span>
  )
}
