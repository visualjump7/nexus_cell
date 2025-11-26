'use client';

import { useState } from 'react';
import { usePrompts } from '@/hooks/usePrompts';
import { PromptState, PlatformId } from '@/types';
import { generateAllPrompts } from '@/lib/prompt-generators';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptState: PromptState;
}

export function SavePromptModal({ isOpen, onClose, promptState }: SavePromptModalProps) {
  const { createPrompt } = usePrompts();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    
    try {
      const generatedPrompts = generateAllPrompts(promptState);
      
      await createPrompt.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        subject: promptState.subject || null,
        angle: promptState.angle,
        movement: promptState.movement,
        lens: promptState.lens,
        lighting: promptState.lighting,
        style: promptState.style,
        film_stock: promptState.filmStock,
        aspect_ratio: promptState.aspectRatio,
        generated_prompts: generatedPrompts,
        folder_id: null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_favorite: false,
        is_archived: false,
      });
      
      setTitle('');
      setDescription('');
      setTags('');
      onClose();
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md mx-4 bg-[#0a0a0b] rounded-xl border border-white/10 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">Save to Library</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic Hero Shot"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this prompt..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cinematic, hero, dramatic (comma separated)"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Configuration</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {promptState.angle && (
                <div className="text-white/60">
                  <span className="text-white/30">Angle:</span> {promptState.angle}
                </div>
              )}
              {promptState.movement && (
                <div className="text-white/60">
                  <span className="text-white/30">Movement:</span> {promptState.movement}
                </div>
              )}
              {promptState.lens && (
                <div className="text-white/60">
                  <span className="text-white/30">Lens:</span> {promptState.lens}
                </div>
              )}
              {promptState.lighting && (
                <div className="text-white/60">
                  <span className="text-white/30">Lighting:</span> {promptState.lighting}
                </div>
              )}
              {promptState.style && (
                <div className="text-white/60">
                  <span className="text-white/30">Style:</span> {promptState.style}
                </div>
              )}
              {promptState.filmStock && (
                <div className="text-white/60">
                  <span className="text-white/30">Film:</span> {promptState.filmStock}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
