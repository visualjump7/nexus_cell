'use client';

import { useState } from 'react';
import { usePrompts } from '@/hooks/usePrompts';
import { useArmoryStore } from '@/stores/armory-store';
import { useRouter } from 'next/navigation';
import { Prompt } from '@/types';

export default function LibraryPage() {
  const router = useRouter();
  const { setPromptState, setActivePreset } = useArmoryStore();
  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  
  const { prompts, isLoading, toggleFavorite, deletePrompt } = usePrompts({
    favorites: showFavorites || undefined,
    search: search || undefined,
  });

  const handleLoadPrompt = (prompt: Prompt) => {
    setPromptState({
      subject: prompt.subject || '',
      angle: prompt.angle,
      movement: prompt.movement,
      lens: prompt.lens,
      lighting: prompt.lighting,
      style: prompt.style,
      filmStock: prompt.film_stock,
      aspectRatio: (prompt.aspect_ratio as any) || '16:9',
    });
    setActivePreset(null);
    router.push('/dashboard');
  };

  const handleToggleFavorite = async (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    await toggleFavorite.mutateAsync({ id: prompt.id, isFavorite: !prompt.is_favorite });
  };

  const handleDelete = async (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this prompt?')) {
      await deletePrompt.mutateAsync(prompt.id);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extralight text-white mb-2">
          Prompt <span className="font-bold text-orange-500">Library</span>
        </h1>
        <p className="text-white/40 text-sm">
          Your saved prompt configurations
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFavorites
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
              : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <span>★</span>
          Favorites
        </button>
      </div>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 opacity-20">◇</div>
          <h3 className="text-lg font-medium text-white mb-2">No prompts yet</h3>
          <p className="text-white/40 text-sm mb-4">
            {showFavorites 
              ? "You haven't favorited any prompts yet."
              : "Save prompts from the Armory to see them here."}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Go to Armory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => handleLoadPrompt(prompt)}
              className="group relative p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{prompt.title}</h3>
                  {prompt.description && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{prompt.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleToggleFavorite(e, prompt)}
                    className={`p-1.5 rounded transition-colors ${
                      prompt.is_favorite 
                        ? 'text-orange-500' 
                        : 'text-white/20 hover:text-white/40'
                    }`}
                  >
                    ★
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, prompt)}
                    className="p-1.5 rounded text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-[10px] bg-white/5 rounded text-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-[10px] text-white/30">
                      +{prompt.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Configuration Preview */}
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {prompt.angle && (
                  <div className="text-white/40">
                    <span className="text-white/20">◇</span> {prompt.angle}
                  </div>
                )}
                {prompt.lens && (
                  <div className="text-white/40">
                    <span className="text-white/20">◉</span> {prompt.lens}
                  </div>
                )}
                {prompt.lighting && (
                  <div className="text-white/40">
                    <span className="text-white/20">☀</span> {prompt.lighting}
                  </div>
                )}
                {prompt.style && (
                  <div className="text-white/40">
                    <span className="text-white/20">◈</span> {prompt.style}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] text-white/30">
                  {prompt.aspect_ratio}
                </span>
                <span className="text-[10px] text-white/30">
                  {new Date(prompt.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Folder indicator */}
              {prompt.folder && (
                <div 
                  className="absolute top-0 left-4 px-2 py-0.5 rounded-b text-[10px]"
                  style={{ backgroundColor: prompt.folder.color + '20', color: prompt.folder.color }}
                >
                  {prompt.folder.icon} {prompt.folder.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
