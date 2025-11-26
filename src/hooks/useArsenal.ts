'use client';

import { useMemo } from 'react';
import { useCustomCards } from './useCustomCards';
import { defaultArsenal } from '@/lib/default-arsenal';
import { Arsenal, ArsenalCard } from '@/types';

export function useArsenal() {
  const { customCards, isLoading } = useCustomCards();

  const arsenal = useMemo<Arsenal>(() => {
    if (!customCards || customCards.length === 0) {
      return defaultArsenal;
    }

    // Deep clone the default arsenal
    const merged: Arsenal = JSON.parse(JSON.stringify(defaultArsenal));

    // Map category keys to arsenal keys
    const categoryToArsenalKey: Record<string, string> = {
      angle: 'camera',
      movement: 'movement',
      lens: 'lens',
      lighting: 'lighting',
      style: 'style',
      filmStock: 'filmStock',
    };

    // Add custom cards to appropriate categories
    customCards.forEach((card) => {
      const arsenalKey = categoryToArsenalKey[card.category] || card.category;
      
      if (merged[arsenalKey]) {
        const customArsenalCard: ArsenalCard = {
          id: card.id,
          label: card.label,
          value: card.value,
          desc: card.description || '',
          icon: card.icon || undefined,
          isCustom: true,
        };
        
        merged[arsenalKey].cards.push(customArsenalCard);
      }
    });

    return merged;
  }, [customCards]);

  return {
    arsenal,
    isLoading,
    customCardsCount: customCards?.length ?? 0,
  };
}
