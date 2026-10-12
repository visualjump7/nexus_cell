'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ProjectFile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RpButton, RpMeter, RpTable, RpTag, fmtDate, pad2 } from '@/components/rp'

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

/** The striped "pending" ground the dropzones sit on. */
export const DROPZONE_BG =
  'bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(205,161,75,.05)_14px_28px)]'

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

export function humanSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Short file-type tag: PDF, XLSX, DOCX, IMG or the extension. */
export function fileKind(mime: string | null, name?: string | null): string {
  const m = mime || ''
  if (m.startsWith('image/')) return 'IMG'
  if (m.includes('pdf')) return 'PDF'
  if (m.includes('sheet') || m.includes('excel')) return 'XLSX'
  if (m.includes('word') || m.includes('msword')) return 'DOCX'
  const ext = (name || '').split('.').pop()?.toLowerCase() || ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'IMG'
  if (ext === 'pdf') return 'PDF'
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'XLSX'
  if (ext === 'docx' || ext === 'doc') return 'DOCX'
  return ext ? ext.toUpperCase().slice(0, 4) : 'FILE'
}

/** Files as a ruled table: index, name (link + label), type tag, size, added, actions. */
export function ProjectFilesTable({
  files,
  onDelete,
  deleting,
}: {
  files: ProjectFile[]
  onDelete?: (id: string) => void
  deleting?: string | null
}) {
  return (
    <RpTable minWidth={600} caption="Project files">
      <thead>
        <tr>
          <th className="idx">#</th>
          <th>Name</th>
          <th>Type</th>
          <th className="num">Size</th>
          <th>Added</th>
          <th className="num relative"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {files.map((f, i) => (
          <tr key={f.id}>
            <td className="idx">{pad2(i + 1)}</td>
            <td className="max-w-[420px]">
              <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="break-words">
                {f.file_name}
              </a>
              {f.label && <span className="sub">{f.label}</span>}
            </td>
            <td><RpTag>{fileKind(f.file_type, f.file_name)}</RpTag></td>
            <td className="num text-rp-muted">{humanSize(f.file_size) || '—'}</td>
            <td className="whitespace-nowrap text-rp-muted">{fmtDate(f.created_at)}</td>
            <td className="num">
              <span className="inline-flex items-center gap-4">
                <RpButton variant="text" size="sm" href={f.file_url} target="_blank" rel="noopener noreferrer">
                  Open
                </RpButton>
                {onDelete && (
                  <RpButton
                    variant="text"
                    size="sm"
                    className="text-rp-muted hover:text-rp-alert"
                    onClick={() => onDelete(f.id)}
                    disabled={deleting === f.id}
                    aria-label={`Delete ${f.file_name}`}
                  >
                    {deleting === f.id ? 'Deleting…' : 'Delete'}
                  </RpButton>
                )}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </RpTable>
  )
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
    <div className="flex flex-col gap-5">
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
        className={cn(
          'rp-box relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 px-6 py-8 text-center transition-colors duration-200',
          DROPZONE_BG,
          dragOver ? 'border-rp-gold bg-[rgba(205,161,75,.06)]' : 'hover:border-rp-line3',
        )}
      >
        <RpTag tone="gold">Drop drawings or photos</RpTag>
        <p className="text-[13px] text-rp-muted">PDF, XLSX, DOCX, JPG, PNG · up to 25 MB each</p>
        <RpButton
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
        >
          Choose files
        </RpButton>
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
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="rp-eyebrow--muted">Uploads</span>
            {pending.some(p => p.progress === 'done') && (
              <RpButton variant="text" size="sm" className="text-rp-muted" onClick={clearCompleted}>
                Clear done
              </RpButton>
            )}
          </div>
          <ul className="flex flex-col border-t border-rp-line">
            {pending.map(p => {
              const value = p.progress === 'done' ? 1 : p.progress === 'uploading' ? 0.5 : 0
              return (
                <li key={p.id} className="flex flex-col gap-2 border-b border-rp-line py-3">
                  <div className="flex items-baseline gap-3">
                    <RpTag className="shrink-0">{fileKind(p.file.type, p.file.name)}</RpTag>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-rp-text">{p.file.name}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-rp-dim">{humanSize(p.file.size)}</span>
                    <span
                      className={cn(
                        'shrink-0 font-display text-[11px] uppercase tracking-[.14em]',
                        p.progress === 'done' ? 'text-rp-green'
                          : p.progress === 'error' ? 'text-rp-alert'
                          : p.progress === 'uploading' ? 'text-rp-blue'
                          : 'text-rp-dim',
                      )}
                    >
                      {p.progress === 'error' ? (p.error || 'Error')
                        : p.progress === 'done' ? 'Uploaded'
                        : p.progress === 'uploading' ? 'Uploading'
                        : 'Queued'}
                    </span>
                  </div>
                  {p.progress !== 'error' && (
                    <RpMeter value={value} tone={p.progress === 'done' ? 'green' : 'blue'} size={2} label={`${p.file.name} upload`} />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Existing files list */}
      {existingFiles.length > 0 && (
        <ProjectFilesTable
          files={existingFiles}
          onDelete={canDelete ? deleteFile : undefined}
          deleting={deleting}
        />
      )}
    </div>
  )
}
