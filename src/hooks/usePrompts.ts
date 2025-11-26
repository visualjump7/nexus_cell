'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Prompt, CreatePromptInput, UpdatePromptInput } from '@/types';

interface UsePromptsOptions {
  folderId?: string | null;
  favorites?: boolean;
  archived?: boolean;
  search?: string;
}

export function usePrompts(options: UsePromptsOptions = {}) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { folderId, favorites, archived = false, search } = options;

  const queryKey = ['prompts', { folderId, favorites, archived, search }];

  const { data: prompts, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select(`
          *,
          folder:folders(id, name, color, icon)
        `)
        .eq('is_archived', archived)
        .order('updated_at', { ascending: false });

      if (folderId !== undefined) {
        query = query.eq('folder_id', folderId);
      }

      if (favorites) {
        query = query.eq('is_favorite', true);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Prompt[];
    },
  });

  const createPrompt = useMutation({
    mutationFn: async (input: CreatePromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .insert(input)
        .select(`*, folder:folders(id, name, color, icon)`)
        .single();
      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const updatePrompt = useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePromptInput & { id: string }) => {
      const { data, error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .select(`*, folder:folders(id, name, color, icon)`)
        .single();
      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from('prompts')
        .update({ is_favorite: isFavorite })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const archivePrompt = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { data, error } = await supabase
        .from('prompts')
        .update({ is_archived: archive })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const incrementUseCount = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('increment_prompt_use_count', {
        prompt_id: id,
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    prompts: prompts ?? [],
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    archivePrompt,
    incrementUseCount,
  };
}

export function usePrompt(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['prompt', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select(`*, folder:folders(id, name, color, icon)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Prompt;
    },
    enabled: !!id,
  });
}
