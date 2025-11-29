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

      {/* Row 2: App Switcher (Bottom Layer) - Glowing navigation button */}
      <div className="flex items-center">
        {currentApp === 'visual' ? (
          /* On Dashboard: Link to Email Armory - Amber icon glow */
          <Link
            href="/dashboard/email"
            className="flex items-center gap-3 px-6 py-3 border border-amber-500 text-white/60 hover:bg-amber-500/10 hover:text-white transition-all duration-300 group rounded-lg h-[50px]"
          >
            <span className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              <MessageSquare size={20} />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider">Email Armory</span>
          </Link>
        ) : (
          /* On Email Page: Link to Prompt Armory - Cyan icon glow */
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-6 py-3 border border-cyan-400 text-white/60 hover:bg-cyan-400/10 hover:text-white transition-all duration-300 group rounded-lg h-[50px]"
          >
            <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              <LayoutDashboard size={20} />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider">Prompt Armory</span>
          </Link>
        )}
      </div>
    </div>
  );
};
