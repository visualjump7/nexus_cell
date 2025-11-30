'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Cpu } from 'lucide-react';

interface SystemStateToggleProps {
  viewMode: 'focus' | 'advanced';
  setViewMode: (mode: 'focus' | 'advanced') => void;
}

export function SystemStateToggle({ viewMode, setViewMode }: SystemStateToggleProps) {
  return (
    <div className="relative flex items-center bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1 h-11 sm:h-9 w-[240px] sm:w-[200px] cursor-pointer"
         onClick={() => setViewMode(viewMode === 'focus' ? 'advanced' : 'focus')}>
      
      {/* Sliding Background */}
      <motion.div
        className={`absolute top-1 bottom-1 rounded-full ${
          viewMode === 'focus' 
            ? 'bg-emerald-900/40 border border-emerald-500/30' 
            : 'bg-red-900/40 border border-red-500/30'
        }`}
        initial={false}
        animate={{
          x: viewMode === 'focus' ? 0 : '100%',
          width: '50%'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {/* Focus Option */}
      <div className={`flex-1 flex items-center justify-center gap-2 relative z-10 transition-colors duration-300 ${viewMode === 'focus' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
        <motion.div
          animate={viewMode === 'focus' ? { scale: [1, 0.9, 1] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Target className="w-3.5 h-3.5" />
        </motion.div>
        <span className="text-[11px] sm:text-[10px] font-bold tracking-wider">FOCUS</span>
      </div>

      {/* Advanced Option */}
      <div className={`flex-1 flex items-center justify-center gap-2 relative z-10 transition-colors duration-300 ${viewMode === 'advanced' ? 'text-red-500' : 'text-muted-foreground'}`}>
        <motion.div
          animate={viewMode === 'advanced' ? { rotate: 360 } : { rotate: 0 }}
          transition={viewMode === 'advanced' ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
        >
          <Cpu className="w-3.5 h-3.5" />
        </motion.div>
        <span className="text-[11px] sm:text-[10px] font-bold tracking-wider">ADVANCED</span>
      </div>
    </div>
  );
}
