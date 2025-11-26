'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CustomCard, CardCategory, CreateCustomCardInput, UpdateCustomCardInput } from '@/types';

export function useCustomCards(category?: CardCategory) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const queryKey = category ? ['custom-cards', category] : ['custom-cards'];

  const { data: customCards, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('custom_cards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomCard[];
    },
  });

  const createCard = useMutation({
    mutationFn: async (input: CreateCustomCardInput) => {
      const { data, error } = await supabase
        .from('custom_cards')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as CustomCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cards'] });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCustomCardInput & { id: string }) => {
      const { data, error } = await supabase
        .from('custom_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CustomCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cards'] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_cards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cards'] });
    },
  });

  const reorderCards = useMutation({
    mutationFn: async (cards: { id: string; sort_order: number }[]) => {
      const updates = cards.map(({ id, sort_order }) =>
        supabase
          .from('custom_cards')
          .update({ sort_order })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cards'] });
    },
  });

  return {
    customCards: customCards ?? [],
    isLoading,
    error,
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
  };
}
