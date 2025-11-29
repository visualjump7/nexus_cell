'use client';

import { useState, useEffect, useCallback } from 'react';

type ViewMode = 'focus' | 'advanced';

const STORAGE_KEY = 'prompt-armory-view-mode';

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>('focus');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'focus' || stored === 'advanced') {
      setViewModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { viewMode, setViewMode, isHydrated };
}
