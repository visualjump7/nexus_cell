'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-500/[0.12]', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
  blue:    { bg: 'bg-blue-500/[0.12]', border: 'border-blue-500/30', icon: 'text-blue-400' },
  purple:  { bg: 'bg-purple-500/[0.12]', border: 'border-purple-500/30', icon: 'text-purple-400' },
  amber:   { bg: 'bg-amber-500/[0.12]', border: 'border-amber-500/30', icon: 'text-amber-400' },
  cyan:    { bg: 'bg-cyan-500/[0.12]', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
  rose:    { bg: 'bg-rose-500/[0.12]', border: 'border-rose-500/30', icon: 'text-rose-400' },
  orange:  { bg: 'bg-orange-500/[0.12]', border: 'border-orange-500/30', icon: 'text-orange-400' },
}

interface ModuleOrbProps {
  href: string
  icon: ReactNode
  label: string
  color: string
  badge?: number
  delay?: number
}

export default function ModuleOrb({ href, icon, label, color, badge, delay = 0 }: ModuleOrbProps) {
  const colors = colorMap[color] || colorMap.emerald

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 group animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className={`w-[52px] h-[52px] rounded-full ${colors.bg} border-[1.5px] ${colors.border} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          <div className={`w-6 h-6 ${colors.icon}`}>
            {icon}
          </div>
        </div>
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1">
            <span className="text-[10px] font-bold text-white leading-none">{badge > 99 ? '99+' : badge}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
    </Link>
  )
}
