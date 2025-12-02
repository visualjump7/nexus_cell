'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Film } from 'lucide-react';

interface CameraModeToggleProps {
  cameraMode: 'photography' | 'cinematography';
  setCameraMode: (mode: 'photography' | 'cinematography') => void;
}

export function CameraModeToggle({ cameraMode, setCameraMode }: CameraModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex gap-1 p-1 bg-black/50 rounded-full border border-gray-700">
        {/* Photography Mode */}
        <button
          onClick={() => setCameraMode('photography')}
          className={`
            px-8 py-3 rounded-full font-semibold uppercase tracking-wide text-sm
            transition-all duration-300 flex items-center gap-2
            ${cameraMode === 'photography'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
        >
          <Camera className="w-4 h-4" />
          Photography
        </button>
        
        {/* Cinematography Mode */}
        <button
          onClick={() => setCameraMode('cinematography')}
          className={`
            px-8 py-3 rounded-full font-semibold uppercase tracking-wide text-sm
            transition-all duration-300 flex items-center gap-2
            ${cameraMode === 'cinematography'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
        >
          <Film className="w-4 h-4" />
          Cinematography
        </button>
      </div>
    </div>
  );
}
