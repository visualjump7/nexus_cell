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
  "What needs my approval today?",
  "When's my next flight?",
  "Anything urgent this week?",
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
            background: 'radial-gradient(circle, #5eead4 0%, #0d9488 50%, #064e3b 100%)',
            boxShadow: '0 0 20px rgba(94,234,212,0.2)',
          }}
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-[#5eead4] leading-none">Ask Nexus</p>
          <p className="text-[11px] text-gray-500 mt-1">Anything about your operations.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type or ask…"
          className="flex-1 bg-[#141520] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#5eead4]/50 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-30 transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }}
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>

      {showOpener && (
        <div className="mt-4 flex justify-start">
          <div className="max-w-[90%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed bg-[#5eead4]/10 text-[#e2e8f0] border border-[#5eead4]/10">
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
              className="bg-white/5 rounded-full px-3 py-1.5 text-xs text-[#94a3b8] hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
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
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#141520] text-[#e2e8f0]'
                  : 'bg-[#5eead4]/10 text-[#e2e8f0] border border-[#5eead4]/10'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#5eead4]/10 border border-[#5eead4]/10 px-4 py-3 rounded-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#5eead4] rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-[#5eead4] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#5eead4] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  )
}
