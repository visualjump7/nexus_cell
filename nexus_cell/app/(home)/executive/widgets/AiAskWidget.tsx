'use client'

import { useEffect, useRef, useState } from 'react'
import WidgetCard from './WidgetCard'

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
    <WidgetCard prominent>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full shrink-0"
          style={{
            background: 'radial-gradient(circle, #E0BF7B 0%, #B0853A 50%, #4F3B20 100%)',
          }}
          aria-hidden
        />
        <div>
          <p className="rp-eyebrow leading-none">Ask Nexus</p>
          <p className="text-[12px] text-[#9AA0A4] mt-1.5">Anything about the build, the budget or the calendar.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type or ask…"
          className="flex-1 bg-[#0E0F11] border border-[#26292C] rounded-sm px-4 py-2.5 text-sm text-white placeholder-[#6E7578] focus:outline-none focus:border-[#CDA14B] transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="rp-btn-solid"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>

      {showOpener && (
        <div className="mt-4 flex justify-start">
          <div className="max-w-[90%] px-3.5 py-2.5 rounded-sm text-sm leading-relaxed bg-[#CDA14B]/10 text-[#F5F5F5] border border-[#CDA14B]/20">
            <p className="whitespace-pre-wrap">{openingMessage}</p>
          </div>
        </div>
      )}

      {!hasConversation && (
        <div className="mt-3 flex flex-wrap gap-2">
          {principalSuggestions.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="rp-btn-ghost disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {hasConversation && (
        <div ref={scrollRef} className="mt-4 max-h-72 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#141618] text-[#F5F5F5] border border-[#1F1F1F]'
                  : 'bg-[#CDA14B]/10 text-[#F5F5F5] border border-[#CDA14B]/20'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#CDA14B]/10 border border-[#CDA14B]/20 px-4 py-3 rounded-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#CDA14B] rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-[#CDA14B] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#CDA14B] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  )
}
