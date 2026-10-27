'use client'

import { useState, useRef, useEffect } from 'react'
import { RpButton, pushEscapeLayer } from '@/components/rp'
import { BRAND } from '@/lib/brand'

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

export default function AIDrawer({ isOpen, onClose, initialMessage, onInitialMessageConsumed, openingMessage }: AIDrawerProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [openerShown, setOpenerShown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Focus the input on open; Esc (layered over anything below), scroll lock,
  // and focus back to the opener when the drawer closes.
  useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    const unregister = pushEscapeLayer(() => onCloseRef.current())
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      unregister()
      document.body.style.overflow = prev
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus()
    }
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
  }, [messages, loading])

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
      setMessages(prev => [...prev, { role: 'assistant', content: "We couldn't get an answer just now. Please try again." }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose} role="presentation">
      {/* Scrim: flat, no blur */}
      <div className="absolute inset-0 bg-[rgba(8,9,10,.85)] animate-overlay-fade-in" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexus-drawer-title"
        className="relative flex max-h-[min(84vh,780px)] w-[min(640px,100%)] flex-col border border-rp-line2 bg-rp-bg animate-overlay-pop-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b border-rp-line px-5 py-4 sm:px-6 sm:py-5">
          <span
            aria-hidden
            className="h-8 w-8 shrink-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 30%, #E6C98A 0%, #CDA14B 40%, #8C6830 78%, #2D2112 100%)', boxShadow: '0 0 18px rgba(205,161,75,.25)' }}
          />
          <div className="min-w-0 flex-1">
            <h2 id="nexus-drawer-title" className="rp-eyebrow">{BRAND.askLabel}</h2>
            <p className="mt-1 text-[13px] leading-snug text-rp-muted">{BRAND.name} development partner</p>
          </div>
          <RpButton variant="ghost" size="sm" onClick={onClose}>Close</RpButton>
        </div>

        {/* Conversation */}
        <div
          ref={scrollRef}
          className="flex min-h-[140px] flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6"
          aria-live="polite"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col gap-2 py-2">
              <p className="font-display text-2xl uppercase leading-[1.1] tracking-[.02em] text-rp-text">Ask about the build</p>
              <p className="max-w-[52ch] text-[15px] leading-normal text-rp-muted">
                The budget, the schedule, sign-offs, the punch list or the next site visit to Palatka.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role}>{msg.content}</ChatBubble>
          ))}
          {loading && <ChatTyping />}
        </div>

        {/* Input, joined to Send like the gate */}
        <div className="shrink-0 border-t border-rp-line px-5 py-4 sm:px-6">
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the build, budget or schedule…"
              aria-label="Message the team"
              className="rp-input min-h-12 min-w-0 flex-1 border-r-0"
            />
            <RpButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="min-h-12 shrink-0"
            >
              Send
            </RpButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Square chat bubble: the user's in a 10% gold wash, Nexus's on the panel ground. Shared with the owner's Ask Nexus widget. */
export function ChatBubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const mine = role === 'user'
  return (
    <div className={`flex flex-col gap-1.5 ${mine ? 'items-end' : 'items-start'}`}>
      <span className="font-display text-[10px] uppercase tracking-[.16em] text-rp-dim">
        {mine ? 'You' : BRAND.assistantName}
      </span>
      <div
        className={`max-w-[85%] px-4 py-3 text-[15px] leading-[1.55] text-rp-text ${
          mine ? 'border border-rp-gold/40 bg-[rgba(205,161,75,.10)]' : 'border border-rp-line bg-rp-panel'
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  )
}

/** Nexus is typing: three small gold squares. */
export function ChatTyping() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-display text-[10px] uppercase tracking-[.16em] text-rp-dim">{BRAND.assistantName}</span>
      <div className="flex items-center gap-1.5 border border-rp-line bg-rp-panel px-4 py-4" role="status" aria-label="Getting an answer">
        <span className="h-[5px] w-[5px] animate-pulse bg-rp-gold" />
        <span className="h-[5px] w-[5px] animate-pulse bg-rp-gold" style={{ animationDelay: '150ms' }} />
        <span className="h-[5px] w-[5px] animate-pulse bg-rp-gold" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// Loose keyword/emoji scan to fire the Easter-egg heart-eyes when the AI
// lands something warm. Intentionally generous — better to occasionally
// trigger than to miss obvious wins. Kept in this file so it's near the
// AI response handling and easy to tweak.
const POSITIVE_PATTERNS = [
  /\b(great|amazing|wonderful|fantastic|congrats|congratulations|nicely done|well done|love|nailed it)\b/i,
  // Heart, green heart, party popper, sparkles, partying face (escaped so no
  // emoji sits in the source).
  /\u2764|\uD83D\uDC9A|\uD83C\uDF89|\u2728|\uD83E\uDD73/,
]

function isPositive(text: string): boolean {
  if (!text) return false
  return POSITIVE_PATTERNS.some(p => p.test(text))
}
