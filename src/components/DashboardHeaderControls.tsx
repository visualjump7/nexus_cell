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
    <div className="flex flex-col items-end gap-2 md:gap-3">
      {/* Row 1: Meta-Nav (Top Layer) - Hide on mobile, show on md+ */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-white/40 tracking-wider">
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


    </div>
  );
};
