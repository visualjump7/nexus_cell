'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Note, CreateNoteInput, UpdateNoteInput } from '@/types';

interface UseNotesOptions {
  promptId?: string;
  generationId?: string;
  pinned?: boolean;
  search?: string;
}

export function useNotes(options: UseNotesOptions = {}) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { promptId, generationId, pinned, search } = options;

  const queryKey = ['notes', { promptId, generationId, pinned, search }];

  const { data: notes, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (promptId) {
        query = query.eq('prompt_id', promptId);
      }

      if (generationId) {
        query = query.eq('generation_id', generationId);
      }

      if (pinned !== undefined) {
        query = query.eq('is_pinned', pinned);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Note[];
    },
  });

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const { data, error } = await supabase
        .from('notes')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateNoteInput & { id: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ is_pinned: isPinned })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes: notes ?? [],
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}

export function useNote(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Note;
    },
    enabled: !!id,
  });
}
