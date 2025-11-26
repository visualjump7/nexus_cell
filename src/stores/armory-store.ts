import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlatformId, PromptState, defaultPromptState } from '@/types';

interface ArmoryStore {
  // Prompt State
  promptState: PromptState;
  setPromptState: (state: Partial<PromptState>) => void;
  resetPromptState: () => void;

  // Platform
  targetPlatform: PlatformId;
  setTargetPlatform: (platform: PlatformId) => void;

  // UI State
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  
  showPresets: boolean;
  setShowPresets: (show: boolean) => void;
  
  activePreset: string | null;
  setActivePreset: (id: string | null) => void;
  
  platformFilter: 'all' | 'image' | 'video';
  setPlatformFilter: (filter: 'all' | 'image' | 'video') => void;

  // Generation State
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  
  currentGenerationId: string | null;
  setCurrentGenerationId: (id: string | null) => void;
}

export const useArmoryStore = create<ArmoryStore>()(
  persist(
    (set) => ({
      // Prompt State
      promptState: defaultPromptState,
      setPromptState: (state) =>
        set((prev) => ({ 
          promptState: { ...prev.promptState, ...state },
          activePreset: null // Clear preset when manually changing
        })),
      resetPromptState: () => 
        set({ promptState: defaultPromptState, activePreset: null }),

      // Platform
      targetPlatform: 'midjourney',
      setTargetPlatform: (platform) => set({ targetPlatform: platform }),

      // UI State
      activeCategory: 'camera',
      setActiveCategory: (category) => set({ activeCategory: category }),
      
      showPresets: false,
      setShowPresets: (show) => set({ showPresets: show }),
      
      activePreset: null,
      setActivePreset: (id) => set({ activePreset: id }),
      
      platformFilter: 'all',
      setPlatformFilter: (filter) => set({ platformFilter: filter }),

      // Generation State
      isGenerating: false,
      setIsGenerating: (value) => set({ isGenerating: value }),
      
      currentGenerationId: null,
      setCurrentGenerationId: (id) => set({ currentGenerationId: id }),
    }),
    {
      name: 'prompt-armory-store',
      partialize: (state) => ({
        targetPlatform: state.targetPlatform,
        platformFilter: state.platformFilter,
      }),
    }
  )
);
