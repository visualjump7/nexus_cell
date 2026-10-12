'use client'

import { useEffect, useRef, useState } from 'react'
import WidgetCard from './WidgetCard'
import { ChatBubble, ChatTyping } from '@/components/AIDrawer'
import { RpButton } from '@/components/rp'
import { BRAND } from '@/lib/brand'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  // Jarvis opener — server-derived, shown as the first assistant message.
  openingMessage?: string
  // Live suggestion chips. Falls back to a static set if not provided.
  suggestions?: string[]
}

const FALLBACK_SUGGESTIONS = [
  "What needs my sign-off this week?",
  "Where are we on the garage row?",
  "What's the next milestone on the track?",
]

export default function AiAskWidget({ openingMessage, suggestions }: Props) {
  const initialMessages: ChatMessage[] = openingMessage
    ? [{ role: 'assistant', content: openingMessage }]
    : []
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [history, setHistory] = useState<ChatMessage[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const principalSuggestions = suggestions && suggestions.length > 0 ? suggestions : FALLBACK_SUGGESTIONS

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  async function send(text: string) {
    const t = text.trim()
    if (!t || loading) return
    const userMsg: ChatMessage = { role: 'user', content: t }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: t, conversationHistory: history }),
      })
      const data = await res.json()
      const aiMsg: ChatMessage = { role: 'assistant', content: data.response || "Sorry, I couldn't process that." }
      setMessages(m => [...m, aiMsg])
      setHistory(data.conversationHistory || [])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Nexus is unavailable right now. Please try again.' }])
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  // "Conversation" = the principal has actually said something. The opener
  // alone shouldn't hide the suggestion chips — chips help the principal know
  // what they can ask next, even after Nexus speaks first.
  const hasConversation = messages.some(m => m.role === 'user')
  const showOpener = !!openingMessage && !hasConversation

  return (
    <WidgetCard
      prominent
      title={`Ask ${BRAND.assistantName}`}
      subtitle="Anything about the build, the budget or the calendar."
      trailing={
        <span
          aria-hidden
          className="block h-6 w-6 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 30%, #E6C98A 0%, #CDA14B 40%, #8C6830 78%, #2D2112 100%)', boxShadow: '0 0 14px rgba(205,161,75,.25)' }}
        />
      }
    >
      <div className="flex max-w-[860px] flex-col gap-4">
        {showOpener && <ChatBubble role="assistant">{openingMessage}</ChatBubble>}

        {hasConversation && (
          <div ref={scrollRef} className="flex max-h-80 flex-col gap-4 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role}>{msg.content}</ChatBubble>
            ))}
            {loading && <ChatTyping />}
          </div>
        )}

        {/* Input joined to Ask, like the gate */}
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type or ask…"
            aria-label={`Ask ${BRAND.assistantName}`}
            className="rp-input min-h-12 min-w-0 flex-1 border-r-0"
            disabled={loading}
          />
          <RpButton
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="min-h-12 shrink-0"
          >
            {loading ? '…' : 'Ask'}
          </RpButton>
        </div>

        {!hasConversation && (
          <div className="flex flex-wrap gap-2">
            {principalSuggestions.map(s => (
              <RpButton key={s} variant="ghost" size="sm" className="font-sans text-[13px] normal-case tracking-normal whitespace-normal text-left" onClick={() => send(s)} disabled={loading}>
                {s}
              </RpButton>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  )
}
