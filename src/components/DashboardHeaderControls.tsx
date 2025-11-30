'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, LayoutDashboard, Library, Book } from 'lucide-react';

interface DashboardHeaderControlsProps {
  currentApp: 'visual' | 'text';
}

export const DashboardHeaderControls: React.FC<DashboardHeaderControlsProps> = ({
  currentApp,
}) => {
  return (
    <div className="flex flex-col items-end gap-3">
      {/* Row 1: Meta-Nav (Top Layer) - Small subtle text links */}
      <div className="flex items-center gap-3 text-xs font-mono text-white/40 tracking-wider">
        <Link
          href="/prompt-library"
          className="hover:text-white transition-colors duration-200 flex items-center gap-2"
        >
          <Library size={12} />
          YOUR PROMPT LIBRARY
        </Link>
        <span className="text-white/20">/</span>
        <Link
          href="/dashboard/whitepaper"
          className="hover:text-white transition-colors duration-200 flex items-center gap-2"
        >
          <Book size={12} />
          PROJECT WHITEPAPER
        </Link>
      </div>

      {/* Row 2: Dual App Navigation - Both buttons always visible */}
      <div className="flex items-center gap-5">
        {/* Visual Armory Button */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-6 py-3 border-2 rounded-lg h-[50px] transition-all duration-300 ${
            currentApp === 'visual'
              ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30 cursor-default pointer-events-none'
              : 'bg-transparent border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 cursor-pointer'
          }`}
        >
          <span className={currentApp === 'visual' ? 'text-white' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'}>
            <LayoutDashboard size={20} />
          </span>
          <span className="text-xs font-mono uppercase tracking-wider">Visual Armory</span>
        </Link>

        {/* Email Armory Button */}
        <Link
          href="/dashboard/email"
          className={`flex items-center gap-3 px-6 py-3 border-2 rounded-lg h-[50px] transition-all duration-300 ${
            currentApp === 'text'
              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 cursor-default pointer-events-none'
              : 'bg-transparent border-amber-500 text-amber-500 hover:bg-amber-500/10 cursor-pointer'
          }`}
        >
          <span className={currentApp === 'text' ? 'text-white' : 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'}>
            <MessageSquare size={20} />
          </span>
          <span className="text-xs font-mono uppercase tracking-wider">Email Armory</span>
        </Link>
      </div>
    </div>
  );
};
