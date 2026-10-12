'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { RpTextarea, timeAgo } from '@/components/rp'

interface Props {
  blockId: string
  initialContent: string
  canWrite: boolean
}

export default function NotesBlock({ blockId, initialContent, canWrite }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveContent = useCallback(async (text: string) => {
    setSaveStatus('saving')
    await fetch(`/api/project-blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { content_html: text } }),
    })
    setSaveStatus('saved')
    setSavedAt(new Date().toISOString())
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

  // Keep "Saved · 2m ago" current.
  useEffect(() => {
    if (!savedAt) return
    const t = setInterval(() => setTick(n => n + 1), 30_000)
    return () => clearInterval(t)
  }, [savedAt])

  const status =
    saveStatus === 'saving' ? 'Saving…'
      : saveStatus === 'saved' && savedAt ? `Saved · ${timeAgo(savedAt)}`
      : canWrite ? 'Saves as you type'
      : null

  return (
    <div className="flex flex-col gap-2">
      <RpTextarea
        value={content}
        onChange={handleChange}
        readOnly={!canWrite}
        aria-label="Notes"
        placeholder={canWrite ? 'Site notes, milestones, inspections, status…' : 'No notes yet.'}
        className="min-h-[180px] leading-[1.55]"
      />
      {status && (
        <p className="text-xs text-rp-dim" aria-live="polite">{status}</p>
      )}
    </div>
  )
}
