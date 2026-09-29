'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ProjectImage } from '@/lib/types'

interface Props {
  blockId: string
  images: ProjectImage[]
  canWrite: boolean
  orgId: string
  projectId: string
}

export default function GalleryBlock({ blockId, images, canWrite, orgId, projectId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

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

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div>
      {images.length === 0 && !canWrite && (
        <p className="text-sm text-[#6E7578]">No images yet. Renderings and site photos will appear here.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="group rp-frame aspect-[4/3]">
            <img
              src={img.url}
              alt={img.caption || img.file_name || 'Project image'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxIdx(idx)}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(8,9,10,.85)] to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="rp-caption truncate"><span className="rp-num">{pad(idx + 1)}</span>{img.caption || img.file_name}</p>
              {canWrite && (
                <button onClick={() => handleDelete(img.id)} className="font-display text-[10px] uppercase tracking-[0.14em] text-red-400 hover:text-red-300 mt-1">Delete</button>
              )}
            </div>
          </div>
        ))}

        {/* Upload zone */}
        {canWrite && (
          <div
            onClick={() => fileRef.current?.click()}
            className="aspect-[4/3] border border-dashed border-[#26292C] bg-[#0E0F11] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#CDA14B] transition-colors"
          >
            <svg className="w-6 h-6 text-[#6E7578]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="rp-eyebrow--muted">{uploading ? 'Uploading…' : 'Add images'}</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleUpload(e.target.files)} />
          </div>
        )}
      </div>

      {/* Lightbox (pitch-site style) */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-[rgba(8,9,10,.96)] flex flex-col" onClick={() => setLightboxIdx(null)}>
          <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <p className="rp-caption truncate">
              <span className="rp-num">{pad(lightboxIdx + 1)} / {pad(images.length)}</span>
              {images[lightboxIdx].caption || images[lightboxIdx].file_name}
            </p>
            <button onClick={() => setLightboxIdx(null)} className="rp-btn-ghost shrink-0">Close</button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-14 pb-8">
            <button aria-label="Previous image" onClick={e => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)) }} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A4] hover:text-white text-4xl p-2 transition-colors">&#8249;</button>
            <img src={images[lightboxIdx].url} alt={images[lightboxIdx].caption || ''} className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
            <button aria-label="Next image" onClick={e => { e.stopPropagation(); setLightboxIdx(Math.min(images.length - 1, lightboxIdx + 1)) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A4] hover:text-white text-4xl p-2 transition-colors">&#8250;</button>
          </div>
        </div>
      )}
    </div>
  )
}
