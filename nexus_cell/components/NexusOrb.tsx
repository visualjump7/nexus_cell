'use client'

interface NexusOrbProps {
  size?: 'large' | 'small'
  onClick?: () => void
}

export default function NexusOrb({ size = 'large', onClick }: NexusOrbProps) {
  if (size === 'small') {
    return (
      <button
        onClick={onClick}
        className="relative w-9 h-9 rounded-full animate-nexus-pulse cursor-pointer"
        style={{ background: 'radial-gradient(circle, #5eead4 0%, #0d9488 50%, #064e3b 100%)' }}
      >
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 20px rgba(94, 234, 212, 0.3)' }} />
      </button>
    )
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Core orb — rings are children so they center perfectly */}
      <button
        onClick={onClick}
        className="relative w-[120px] h-[120px] rounded-full animate-nexus-pulse cursor-pointer flex items-center justify-center z-10"
        style={{
          background: 'radial-gradient(circle, #5eead4 0%, #0d9488 40%, #064e3b 100%)',
          boxShadow: '0 0 60px rgba(94, 234, 212, 0.3), 0 0 120px rgba(94, 234, 212, 0.1)',
        }}
      >
        {/* Ring 1 — centered via inset-0 + m-auto inside the button */}
        <div className="absolute inset-0 m-auto w-[160px] h-[160px] rounded-full border border-teal-500/20 animate-nexus-ring-pulse" />
        {/* Ring 2 */}
        <div className="absolute inset-0 m-auto w-[140px] h-[140px] rounded-full border border-teal-400/10 animate-nexus-ring-pulse" style={{ animationDelay: '1.5s' }} />

        <span className="text-[9px] text-white/50 select-none relative z-10">AI</span>
      </button>

      {/* Hint text */}
      <p className="text-xs text-gray-500 mt-6 select-none">Tap to ask</p>
    </div>
  )
}
