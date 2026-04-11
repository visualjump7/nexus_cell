'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectBlock, ProjectBlockType, UserRole } from '@/lib/types'
import GalleryBlock from './GalleryBlock'
import PersonnelBlock from './PersonnelBlock'
import SubcontractorBlock from './SubcontractorBlock'
import NotesBlock from './NotesBlock'
import DeleteConfirm from '@/components/DeleteConfirm'

const blockTypeConfig: Record<ProjectBlockType, { label: string; icon: string; description: string }> = {
  gallery: { label: 'Gallery', icon: '🖼️', description: 'Photo gallery with lightbox' },
  personnel: { label: 'Personnel', icon: '👤', description: 'Team members and contacts' },
  subcontractor: { label: 'Subcontractor', icon: '🏗️', description: 'Contractors and vendors' },
  notes: { label: 'Notes', icon: '📝', description: 'Rich text notes and updates' },
}

interface Props {
  projectId: string
  orgId: string
  blocks: ProjectBlock[]
  role: UserRole
}

export default function ProjectBlocks({ projectId, orgId, blocks, role }: Props) {
  const router = useRouter()
  const canWrite = ['ea', 'admin'].includes(role)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [deletingBlock, setDeletingBlock] = useState<ProjectBlock | null>(null)

  async function addBlock(type: ProjectBlockType) {
    setShowAddMenu(false)
    await fetch('/api/project-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, type, title: blockTypeConfig[type].label }),
    })
    router.refresh()
  }

  async function updateTitle(blockId: string, title: string) {
    setEditingTitle(null)
    await fetch(`/api/project-blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    router.refresh()
  }

  async function handleDeleteBlock() {
    if (!deletingBlock) return
    await fetch(`/api/project-blocks/${deletingBlock.id}`, { method: 'DELETE' })
    setDeletingBlock(null)
    router.refresh()
  }

  return (
    <div>
      {/* Add Block Toolbar */}
      {canWrite && (
        <div className="mb-6 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-4 py-2 bg-teal-500 hover:brightness-110 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Block
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-2 bg-card-dark rounded-xl shadow-2xl shadow-black/40 border border-white/10 p-2 z-20 w-72">
              {(Object.entries(blockTypeConfig) as [ProjectBlockType, typeof blockTypeConfig[ProjectBlockType]][]).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{config.label}</p>
                    <p className="text-[11px] text-gray-500">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div className="bg-card-dark rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No blocks yet. Add a gallery, personnel directory, subcontractor list, or notes to build out this project.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map(block => (
            <div key={block.id} className="bg-card-dark rounded-xl shadow-lg shadow-black/20 overflow-hidden">
              {/* Block Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{blockTypeConfig[block.type]?.icon}</span>
                  {editingTitle === block.id ? (
                    <input
                      autoFocus
                      defaultValue={block.title || ''}
                      onBlur={e => updateTitle(block.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') updateTitle(block.id, (e.target as HTMLInputElement).value) }}
                      className="bg-transparent border-b border-white/20 text-sm text-white font-medium focus:outline-none focus:border-teal-400 px-1"
                    />
                  ) : (
                    <h3
                      className={`text-sm font-medium text-white ${canWrite ? 'cursor-pointer hover:text-teal-400' : ''}`}
                      onClick={() => canWrite && setEditingTitle(block.id)}
                    >
                      {block.title || blockTypeConfig[block.type]?.label}
                    </h3>
                  )}
                </div>
                {canWrite && (
                  <button onClick={() => setDeletingBlock(block)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
                    Remove
                  </button>
                )}
              </div>

              {/* Block Content */}
              <div className="p-5">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingBlock && (
        <DeleteConfirm
          itemName={`${blockTypeConfig[deletingBlock.type]?.label} block`}
          onConfirm={handleDeleteBlock}
          onCancel={() => setDeletingBlock(null)}
        />
      )}
    </div>
  )
}
