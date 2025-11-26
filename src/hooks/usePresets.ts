'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { UserPreset, CreateUserPresetInput, UpdateUserPresetInput, Preset } from '@/types';
import { defaultPresets } from '@/lib/default-presets';

export function usePresets() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: userPresets, isLoading, error } = useQuery({
    queryKey: ['user-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_presets')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as UserPreset[];
    },
  });

  // Merge default presets with user presets
  const allPresets: Preset[] = [
    ...defaultPresets,
    ...(userPresets ?? []).map((up) => ({
      id: up.id,
      name: up.name,
      icon: up.icon,
      description: up.description || '',
      color: up.color,
      config: up.config,
      isCustom: true,
    })),
  ];

  const createPreset = useMutation({
    mutationFn: async (input: CreateUserPresetInput) => {
      const { data, error } = await supabase
        .from('user_presets')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as UserPreset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-presets'] });
    },
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateUserPresetInput & { id: string }) => {
      const { data, error } = await supabase
        .from('user_presets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as UserPreset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-presets'] });
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_presets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-presets'] });
    },
  });

  const incrementUseCount = useMutation({
    mutationFn: async (id: string) => {
      // Only increment for user presets (not default ones)
      const { data, error } = await supabase
        .from('user_presets')
        .update({ 
          use_count: supabase.rpc('increment', { x: 1 }),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as UserPreset;
    },
  });

  return {
    presets: allPresets,
    userPresets: userPresets ?? [],
    defaultPresets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    incrementUseCount,
  };
}
