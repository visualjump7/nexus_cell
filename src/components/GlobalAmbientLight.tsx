'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlobalAmbientLightProps {
  color: string;
}

export function GlobalAmbientLight({ color }: GlobalAmbientLightProps) {
  return (
    <div className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden">
      {/* Primary ambient glow */}
      <motion.div
        className="absolute top-[-20%] left-1/2 w-[120vw] h-[80vh] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        initial={{ backgroundColor: color }}
        animate={{ backgroundColor: color }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Secondary glow for depth */}
      <motion.div
        className="absolute top-[10%] left-[20%] w-[60vw] h-[60vh] rounded-full opacity-10 blur-[100px]"
        initial={{ backgroundColor: color }}
        animate={{ backgroundColor: color }}
        transition={{ duration: 2, delay: 0.2, ease: 'easeInOut' }}
      />

      {/* Subtle tint overlay */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        initial={{ backgroundColor: color }}
        animate={{ backgroundColor: color }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
    </div>
  );
}

