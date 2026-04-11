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
      {/* Outer ring 1 */}
      <div className="absolute w-[160px] h-[160px] rounded-full border border-teal-500/20 animate-nexus-ring" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      {/* Outer ring 2 */}
      <div className="absolute w-[140px] h-[140px] rounded-full border border-teal-400/15 animate-nexus-ring-pulse" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDirection: 'reverse', animationDuration: '25s' }} />

      {/* Core orb */}
      <button
        onClick={onClick}
        className="relative w-[120px] h-[120px] rounded-full animate-nexus-pulse cursor-pointer flex flex-col items-center justify-center z-10"
        style={{
          background: 'radial-gradient(circle, #5eead4 0%, #0d9488 40%, #064e3b 100%)',
          boxShadow: '0 0 60px rgba(94, 234, 212, 0.3), 0 0 120px rgba(94, 234, 212, 0.1)',
        }}
      >
        <span className="text-[11px] font-bold tracking-[0.3em] text-white/90 select-none">NEXUS</span>
        <span className="text-[9px] text-white/50 mt-0.5 select-none">AI</span>
      </button>

      {/* Hint text */}
      <p className="text-xs text-gray-500 mt-6 select-none">Tap to ask</p>
    </div>
  )
}
