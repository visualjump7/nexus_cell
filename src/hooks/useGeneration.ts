'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Generation, PlatformId, PromptState, GenerateResponse } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

interface GenerateParams {
  platform: PlatformId;
  prompt: string;
  aspectRatio: string;
  promptState?: PromptState;
}

export function useGeneration() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const { profile, canGenerate } = useAuthStore();

  const generate = useCallback(async (params: GenerateParams): Promise<Generation | null> => {
    if (!canGenerate()) {
      throw new Error('Generation limit reached. Please upgrade your plan.');
    }

    setIsGenerating(true);

    try {
      // Create generation record
      const { data: generation, error: createError } = await supabase
        .from('generations')
        .insert({
          platform: params.platform,
          prompt_text: params.prompt,
          prompt_state: params.promptState,
          aspect_ratio: params.aspectRatio,
          status: 'pending',
          media_type: ['runway', 'pika', 'kling', 'sora', 'veo'].includes(params.platform) 
            ? 'video' 
            : 'image',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update status to processing
      await supabase
        .from('generations')
        .update({ status: 'processing' })
        .eq('id', generation.id);

      // Call the generation API
      const response = await fetch(`/api/generate/${params.platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          aspectRatio: params.aspectRatio,
        }),
      });

      const result: GenerateResponse = await response.json();

      if (!result.success) {
        // Update with error
        await supabase
          .from('generations')
          .update({ 
            status: 'failed',
            error_message: result.error,
          })
          .eq('id', generation.id);

        throw new Error(result.error || 'Generation failed');
      }

      // Update with success
      const { data: updatedGeneration, error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          media_url: result.mediaUrl,
          thumbnail_url: result.thumbnailUrl,
          revised_prompt: result.revisedPrompt,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['generations'] });

      return updatedGeneration as Generation;
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [supabase, queryClient, canGenerate]);

  return {
    generate,
    isGenerating,
  };
}

export function useGenerations(limit: number = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['generations', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Generation[];
    },
  });
}

export function useGenerationsByPlatform(platform: PlatformId) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['generations', 'platform', platform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('platform', platform)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Generation[];
    },
  });
}

export function useDeleteGeneration() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('generations')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
  });
}
