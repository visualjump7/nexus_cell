'use client'

interface AIDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const exampleQueries = [
  'Pending approvals',
  'Next flight',
  'Monthly spend',
  'Overdue bills',
  'Open tasks',
]

export default function AIDrawer({ isOpen, onClose }: AIDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-[#0f1117] rounded-2xl border border-white/10 shadow-2xl shadow-black/40 p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative mini orb */}
        <div className="flex justify-center mb-5">
          <div
            className="w-10 h-10 rounded-full"
            style={{
              background: 'radial-gradient(circle, #5eead4 0%, #0d9488 50%, #064e3b 100%)',
              boxShadow: '0 0 30px rgba(94, 234, 212, 0.2)',
            }}
          />
        </div>

        <h2 className="text-lg font-semibold text-white text-center mb-4">Ask Nexus</h2>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Ask anything about your operations..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm"
            autoFocus
          />
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {exampleQueries.map(q => (
            <button
              key={q}
              className="bg-white/5 rounded-full px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110" style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }}>
          Ask Nexus
        </button>

        {/* Close hint */}
        <p className="text-center text-[11px] text-gray-600 mt-3">Press <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-gray-500 font-mono">Esc</kbd> to close</p>
      </div>
    </div>
  )
}
