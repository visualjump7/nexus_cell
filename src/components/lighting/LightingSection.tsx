'use client';

import { useState } from 'react';
import { useArmoryStore } from '@/stores/armory-store';
import { lightingByCategory } from '@/data';

export function LightingSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  
  const { selectedLighting, setSelectedLighting } = useArmoryStore();

  const handleSelectPreset = (preset: any) => {
    setSelectedLighting(preset);
  };

  const handleClearSelection = () => {
    setSelectedLighting(null);
  };

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer mb-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
            Lighting (Optional)
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        </div>
        <button className="text-2xl text-white/40 hover:text-white/70 ml-4">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Collapsed State - Show Selected Badge */}
      {!isExpanded && selectedLighting && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30">
            <span className="text-sm font-medium text-white">{selectedLighting.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="space-y-4 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          {Object.entries(lightingByCategory).map(([categoryName, presets]) => (
            <div key={categoryName} className="space-y-3">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <span className="text-sm font-semibold text-white/90">{categoryName}</span>
                <span className="text-xl text-white/50">
                  {openCategory === categoryName ? '−' : '+'}
                </span>
              </button>

              {/* Category Presets */}
              {openCategory === categoryName && (
                <div className="pl-4 space-y-2">
                  {presets.map((preset) => (
                    <label
                      key={preset.id}
                      className="flex items-start gap-3 p-3 border border-white/10 rounded-lg hover:border-white/20 cursor-pointer transition-all duration-200 bg-white/[0.02] hover:bg-white/[0.05]"
                    >
                      <input
                        type="radio"
                        name="lighting-preset"
                        checked={selectedLighting?.id === preset.id}
                        onChange={() => handleSelectPreset(preset)}
                        className="mt-0.5 w-4 h-4 border-white/20 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 bg-black/50"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-white">{preset.name}</div>
                        <div className="text-xs text-white/50 mt-1">{preset.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Clear Button */}
          {selectedLighting && (
            <button
              onClick={handleClearSelection}
              className="w-full py-2 text-sm text-white/60 hover:text-white/80 border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors mt-4"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

