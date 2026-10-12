'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ProjectImage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { demoMeta, toRpImage } from '@/lib/project-imagery'
import { RpButton, RpFigure, frameClass, isMatAspect, pairedAspects, useRpLightbox } from '@/components/rp'

interface Props {
  blockId: string
  images: ProjectImage[]
  canWrite: boolean
  orgId: string
  projectId: string
}

/**
 * Concept gallery: one full-width lead frame, then pairs. Numbered captions
 * under each frame, one shared lightbox (← →), concept badges and drawing mats
 * from the catalog. Writers get a striped "Add images" plate and Remove links.
 */
export default function GalleryBlock({ blockId, images, canWrite, orgId, projectId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const sorted = useMemo(
    () => [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [images],
  )
  const rpImages = useMemo(
    // Caption: the stored one, else the concept caption for /demo images, else the file name.
    () => sorted.map(img => toRpImage(img.url, img.caption || demoMeta(img.url)?.caption || img.file_name)),
    [sorted],
  )
  const lb = useRpLightbox(rpImages)

  async function handleUpload(files: FileList) {
    setUploading(true)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${orgId}/${projectId}/${blockId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(path, file)

      if (uploadError) { console.error(uploadError); continue }

      const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(path)

      await fetch(`/api/project-blocks/${blockId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        }),
      })
    }

    setUploading(false)
    router.refresh()
  }

  async function handleDelete(imageId: string) {
    await fetch(`/api/project-blocks/${blockId}/images/${imageId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (sorted.length === 0 && !canWrite) {
    return <p className="text-[15px] text-rp-muted">No images yet. Renders and site photos will appear here.</p>
  }

  // The lead spans both columns; an odd trailing image spans too unless the add plate fills the row.
  const last = sorted.length - 1
  const restCount = sorted.length - 1 + (canWrite ? 1 : 0)
  // Both frames of a pair share one aspect (the add plate is a 16:10 frame).
  const aspects = pairedAspects(
    rpImages.map(img => ({ aspect: img.aspect ?? 'aerial', mat: img.mat ?? isMatAspect(img.aspect ?? 'aerial') })),
    1,
    canWrite ? 'aerial' : undefined,
  )

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 min-[640px]:grid-cols-2">
      {sorted.map((img, i) => {
        const rp = rpImages[i]
        const span = i === 0 || (i === last && restCount % 2 === 1 && !canWrite)
        return (
          <div key={img.id} className={cn('group/img flex min-w-0 flex-col gap-2', span && 'min-[640px]:col-span-2')}>
            <RpFigure
              {...rp}
              aspect={aspects[i]}
              mat={rp.mat ?? isMatAspect(rp.aspect ?? 'aerial')}
              num={i + 1}
              onOpen={() => lb.open(i)}
            />
            {/* Remove: always shown on touch; on hover screens from 768px, on hover or focus only. */}
            {canWrite && (
              <RpButton
                variant="text"
                size="sm"
                className="self-start text-rp-dim transition-opacity duration-200 hover:text-rp-alert md:[@media(hover:hover)]:opacity-0 md:[@media(hover:hover)]:focus-visible:opacity-100 md:[@media(hover:hover)]:group-hover/img:opacity-100"
                onClick={() => handleDelete(img.id)}
                aria-label={`Remove image ${i + 1}`}
              >
                Remove
              </RpButton>
            )}
          </div>
        )
      })}

      {/* Add plate */}
      {canWrite && (
        <div className={cn('flex min-w-0 flex-col gap-2', sorted.length === 0 && 'min-[640px]:col-span-2')}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files)
            }}
            disabled={uploading}
            className={cn(
              frameClass(sorted.length === 0 ? 'banner' : 'aerial'),
              'rp-frame--static transition-colors duration-200',
              dragOver ? 'border-rp-gold' : 'hover:border-rp-line3',
            )}
            aria-label="Add images"
          >
            <span className={cn('rp-pending', dragOver && 'bg-[rgba(205,161,75,.06)]')}>
              <span className="rp-pending-label">{uploading ? 'Uploading' : 'Add images'}</span>
              <span className="rp-pending-name">Renders and site photos · drop here or choose</span>
              <span className="rp-btn-ghost rp-btn--sm mt-1" aria-hidden>Choose files</span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleUpload(e.target.files)
            }}
          />
        </div>
      )}

      {lb.node}
    </div>
  )
}
