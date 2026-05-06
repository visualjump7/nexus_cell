'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ProjectFile } from '@/lib/types'

// Accepted MIME types must match sql/010 bucket allowed_mime_types.
const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
])

const ACCEPT_ATTR = '.pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp'
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches bucket file_size_limit

interface Props {
  projectId: string
  orgId: string
  // Existing files to display + allow delete on. Pass [] for the create flow
  // before any files exist. Server-fetched once; uploader updates via router.refresh().
  existingFiles?: ProjectFile[]
  // Optional callback fired after each successful upload (e.g. for the
  // create-flow modal to track that progress has happened).
  onUploaded?: (file: ProjectFile) => void
  // Whether the current user can delete files (admin / EA only). Display only.
  canDelete?: boolean
}

interface PendingFile {
  id: string
  file: File
  progress: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
}

function humanSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(mime: string | null): string {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼'
  if (mime.includes('pdf')) return '📕'
  if (mime.includes('sheet') || mime.includes('excel')) return '📊'
  if (mime.includes('word') || mime.includes('msword')) return '📝'
  return '📄'
}

export default function ProjectFilesUploader({
  projectId,
  orgId,
  existingFiles = [],
  onUploaded,
  canDelete = true,
}: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending, setPending] = useState<PendingFile[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    // Filter + validate
    const accepted: PendingFile[] = []
    for (const file of files) {
      if (!ACCEPTED_MIMES.has(file.type)) {
        accepted.push({ id: crypto.randomUUID(), file, progress: 'error', error: 'Type not allowed' })
        continue
      }
      if (file.size > MAX_BYTES) {
        accepted.push({ id: crypto.randomUUID(), file, progress: 'error', error: 'Over 25 MB' })
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, progress: 'queued' })
    }

    setPending(prev => [...prev, ...accepted])

    const supabase = createClient()
    for (const item of accepted) {
      if (item.progress === 'error') continue

      setPending(prev => prev.map(p => p.id === item.id ? { ...p, progress: 'uploading' } : p))

      const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
      const path = `${orgId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(path, item.file, { contentType: item.file.type })

      if (uploadErr) {
        setPending(prev => prev.map(p => p.id === item.id
          ? { ...p, progress: 'error', error: uploadErr.message }
          : p))
        continue
      }

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(path)

      const recordRes = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: urlData.publicUrl,
          file_name: item.file.name,
          file_type: item.file.type,
          file_size: item.file.size,
        }),
      })

      if (!recordRes.ok) {
        // Roll back the upload so we don't leave orphans
        await supabase.storage.from('project-files').remove([path]).catch(() => null)
        const data = await recordRes.json().catch(() => ({}))
        setPending(prev => prev.map(p => p.id === item.id
          ? { ...p, progress: 'error', error: data.error || 'Failed to record file' }
          : p))
        continue
      }

      const created = (await recordRes.json()) as ProjectFile
      setPending(prev => prev.map(p => p.id === item.id ? { ...p, progress: 'done' } : p))
      onUploaded?.(created)
    }

    router.refresh()
  }, [orgId, projectId, onUploaded, router])

  function clearCompleted() {
    setPending(prev => prev.filter(p => p.progress !== 'done'))
  }

  async function deleteFile(fileId: string) {
    if (!canDelete) return
    setDeleting(fileId)
    try {
      await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(Array.from(e.dataTransfer.files))
        }}
        className={`border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-emerald-400 bg-emerald-500/[0.04]'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-sm text-white font-medium">Drop files here or click to choose</p>
        <p className="text-xs text-gray-500 mt-1">PDF, Excel, Word, images · up to 25 MB each</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={e => {
            handleFiles(Array.from(e.target.files || []))
            // Reset so re-picking the same file fires onChange
            e.target.value = ''
          }}
        />
      </div>

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div className="bg-[#141520] border border-white/5 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Uploads</p>
            {pending.some(p => p.progress === 'done') && (
              <button onClick={clearCompleted} className="text-[10px] text-gray-500 hover:text-white transition-colors">
                Clear done
              </button>
            )}
          </div>
          {pending.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <span className="text-base shrink-0" aria-hidden>{fileIcon(p.file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{p.file.name}</p>
                <p className="text-[10px] text-gray-500">{humanSize(p.file.size)}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider shrink-0 ${
                p.progress === 'done' ? 'text-emerald-400' :
                p.progress === 'error' ? 'text-red-400' :
                p.progress === 'uploading' ? 'text-amber-400' :
                'text-gray-500'
              }`}>
                {p.progress === 'error' ? (p.error || 'Error') : p.progress}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Existing files list */}
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Attached</p>
          {existingFiles.map(f => (
            <div key={f.id} className="bg-[#141520] border border-white/5 rounded-lg p-3 flex items-center gap-3">
              <span className="text-lg shrink-0" aria-hidden>{fileIcon(f.file_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{f.file_name}</p>
                <p className="text-[11px] text-gray-500">
                  {humanSize(f.file_size)}
                  {f.label && <> · {f.label}</>}
                </p>
              </div>
              <a
                href={f.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 text-xs hover:underline shrink-0"
              >
                Open
              </a>
              {canDelete && (
                <button
                  onClick={() => deleteFile(f.id)}
                  disabled={deleting === f.id}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors shrink-0 disabled:opacity-50"
                  title="Delete file"
                >
                  {deleting === f.id ? '…' : 'Delete'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
