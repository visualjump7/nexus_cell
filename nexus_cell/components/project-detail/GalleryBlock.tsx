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

  return (
    <div>
      {images.length === 0 && !canWrite && (
        <p className="text-sm text-gray-600">No images yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="group relative bg-white/5 rounded-lg overflow-hidden aspect-[4/3]">
            <img
              src={img.url}
              alt={img.caption || img.file_name || 'Project image'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxIdx(idx)}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white truncate">{img.caption || img.file_name}</p>
              {canWrite && (
                <button onClick={() => handleDelete(img.id)} className="text-[10px] text-red-400 hover:text-red-300 mt-1">Delete</button>
              )}
            </div>
          </div>
        ))}

        {/* Upload zone */}
        {canWrite && (
          <div
            onClick={() => fileRef.current?.click()}
            className="aspect-[4/3] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'Add Images'}</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleUpload(e.target.files)} />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)) }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl p-2">&#8249;</button>
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(Math.min(images.length - 1, lightboxIdx + 1)) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl p-2">&#8250;</button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl">&times;</button>
          <div className="max-w-4xl max-h-[80vh] p-4" onClick={e => e.stopPropagation()}>
            <img src={images[lightboxIdx].url} alt="" className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg" />
            {images[lightboxIdx].caption && (
              <p className="text-center text-sm text-gray-400 mt-3">{images[lightboxIdx].caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
