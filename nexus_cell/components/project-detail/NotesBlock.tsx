'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface Props {
  blockId: string
  initialContent: string
  canWrite: boolean
}

export default function NotesBlock({ blockId, initialContent, canWrite }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveContent = useCallback(async (text: string) => {
    setSaveStatus('saving')
    await fetch(`/api/project-blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { content_html: text } }),
    })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [blockId])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setContent(text)
    if (!canWrite) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => saveContent(text), 1000)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div />
        {saveStatus !== 'idle' && (
          <span className={`text-[10px] ${saveStatus === 'saving' ? 'text-[#6E7578]' : 'text-[#A4CC5C]'}`}>
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        )}
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        readOnly={!canWrite}
        placeholder={canWrite ? 'Add site notes, milestones, inspections or status updates…' : 'No notes yet.'}
        className="w-full min-h-[160px] bg-[#0A0B0C] border border-[#26292C] rounded-sm px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#6E7578] resize-y focus:outline-none focus:border-[#CDA14B]"
      />
    </div>
  )
}
