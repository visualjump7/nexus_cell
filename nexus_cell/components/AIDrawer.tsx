'use client'

import { useState, useRef, useEffect } from 'react'

interface AIDrawerProps {
  isOpen: boolean
  onClose: () => void
  // When set, the drawer auto-sends this message on open. The parent should
  // clear it via onInitialMessageConsumed so it doesn't re-fire next open.
  initialMessage?: string
  onInitialMessageConsumed?: () => void
  // Jarvis-mode opener — server-derived assistant message that's already
  // "in the room" when the drawer opens. Decorative; included in
  // conversationHistory so the AI knows what it already said.
  openingMessage?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const exampleQueries = [
  'What\'s pending approval?',
  'When is my next flight?',
  'How much did we spend this month?',
  'What bills are overdue?',
  'Upcoming renewals',
]

export default function AIDrawer({ isOpen, onClose, initialMessage, onInitialMessageConsumed, openingMessage }: AIDrawerProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [openerShown, setOpenerShown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Render the Jarvis opener as the first assistant message the first time
  // the drawer opens this session. Includes it in conversationHistory so
  // follow-up replies have context.
  useEffect(() => {
    if (isOpen && openingMessage && !openerShown && messages.length === 0) {
      const opener: ChatMessage = { role: 'assistant', content: openingMessage }
      setMessages([opener])
      setConversationHistory([opener])
      setOpenerShown(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openingMessage])

  useEffect(() => {
    if (isOpen && initialMessage && initialMessage.trim()) {
      sendMessage(initialMessage)
      onInitialMessageConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMessage])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), conversationHistory }),
      })
      const data = await res.json()
      const aiMsg: ChatMessage = { role: 'assistant', content: data.response || 'Sorry, I couldn\'t process that.' }
      setMessages(prev => [...prev, aiMsg])
      setConversationHistory(data.conversationHistory || [])

      // Easter egg: heart-eyes on the Nexus character when the AI lands a
      // warm or celebratory response. Keyword scan on the assistant's text.
      if (isPositive(aiMsg.content)) {
        window.dispatchEvent(new CustomEvent('nexus:positive'))
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Nexus is unavailable right now. Please try again.' }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#0f1117] rounded-2xl border border-white/10 shadow-2xl shadow-black/40 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full" style={{ background: 'radial-gradient(circle, #5eead4 0%, #0d9488 50%, #064e3b 100%)', boxShadow: '0 0 20px rgba(94,234,212,0.2)' }} />
            <div>
              <h2 className="text-sm font-semibold text-[#5eead4]">Nexus AI</h2>
              <p className="text-[10px] text-[#64748b]">Search across all your data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-lg">&times;</button>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-3 space-y-3 min-h-[100px]">
          {messages.length === 0 && !loading && (
            <div className="text-center py-6">
              <p className="text-[#475569] text-sm">Ask me anything about your operations.</p>
            </div>
          )}
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

        {/* Example chips (only when no messages) */}
        {messages.length === 0 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {exampleQueries.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="bg-white/5 rounded-full px-3 py-1.5 text-xs text-[#94a3b8] hover:bg-white/10 hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-5 pt-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-[#141520] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#5eead4]/50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-30 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loose keyword/emoji scan to fire the Easter-egg heart-eyes when the AI
// lands something warm. Intentionally generous — better to occasionally
// trigger than to miss obvious wins. Kept in this file so it's near the
// AI response handling and easy to tweak.
const POSITIVE_PATTERNS = [
  /\b(great|amazing|wonderful|fantastic|congrats|congratulations|nicely done|well done|love|❤|💚|🎉|✨|🥳|nailed it)\b/i,
]

function isPositive(text: string): boolean {
  if (!text) return false
  return POSITIVE_PATTERNS.some(p => p.test(text))
}
