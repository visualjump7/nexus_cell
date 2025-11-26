'use client';

import { useState } from 'react';
import { useCustomCards } from '@/hooks/useCustomCards';
import { AddCardModal } from '@/components/custom-cards/AddCardModal';
import { CardCategory, CustomCard } from '@/types';

const categories: { key: CardCategory; label: string; icon: string }[] = [
  { key: 'angle', label: 'Camera Angles', icon: '◇' },
  { key: 'movement', label: 'Camera Movement', icon: '↗' },
  { key: 'lens', label: 'Lens & Optics', icon: '◉' },
  { key: 'lighting', label: 'Lighting', icon: '☀' },
  { key: 'style', label: 'Visual Style', icon: '◈' },
  { key: 'filmStock', label: 'Film Stock', icon: '▣' },
];

export default function ArsenalPage() {
  const [activeCategory, setActiveCategory] = useState<CardCategory>('lens');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);

  const { customCards, isLoading, deleteCard, updateCard } = useCustomCards(activeCategory);

  const handleDeleteCard = async (card: CustomCard) => {
    if (confirm(`Are you sure you want to delete "${card.label}"?`)) {
      await deleteCard.mutateAsync(card.id);
    }
  };

  const handleToggleActive = async (card: CustomCard) => {
    await updateCard.mutateAsync({
      id: card.id,
      is_active: !card.is_active,
    });
  };

  const getCategoryCards = () => {
    return customCards.filter(card => card.category === activeCategory);
  };

  const categoryCards = getCategoryCards();

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extralight text-white mb-2">
          Custom <span className="font-bold text-orange-500">Arsenal</span>
        </h1>
        <p className="text-white/40 text-sm">
          Extend the default arsenal with your own custom cards
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/10">
        {categories.map((cat) => {
          const count = customCards.filter(c => c.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`relative px-4 py-3 text-sm transition-colors ${
                activeCategory === cat.key
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className="mr-2 opacity-60">{cat.icon}</span>
              {cat.label}
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 rounded-full">
                  {count}
                </span>
              )}
              {activeCategory === cat.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-black rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <span>+</span>
          Add Custom {categories.find(c => c.key === activeCategory)?.label.slice(0, -1)}
        </button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categoryCards.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 opacity-20">{categories.find(c => c.key === activeCategory)?.icon}</div>
          <h3 className="text-lg font-medium text-white mb-2">No custom cards yet</h3>
          <p className="text-white/40 text-sm mb-4">
            Add your own {categories.find(c => c.key === activeCategory)?.label.toLowerCase()} to extend the arsenal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {categoryCards.map((card) => (
            <div
              key={card.id}
              className={`group relative p-4 rounded-lg border transition-all ${
                card.is_active
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-white/5 bg-white/[0.01] opacity-50'
              }`}
            >
              {/* Actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggleActive(card)}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    card.is_active 
                      ? 'text-green-500 hover:bg-green-500/10' 
                      : 'text-white/30 hover:bg-white/10'
                  }`}
                  title={card.is_active ? 'Disable' : 'Enable'}
                >
                  {card.is_active ? '✓' : '○'}
                </button>
                <button
                  onClick={() => handleDeleteCard(card)}
                  className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="font-medium text-white mb-1">{card.label}</div>
              <div className="text-xs text-white/40 mb-2">{card.description || 'No description'}</div>
              
              {/* Value Preview */}
              <div className="p-2 bg-black/30 rounded text-[10px] text-white/50 font-mono truncate">
                {card.value}
              </div>

              {/* Platform overrides indicator */}
              {Object.keys(card.platform_values || {}).length > 0 && (
                <div className="mt-2 text-[10px] text-orange-500/60">
                  {Object.keys(card.platform_values).length} platform override(s)
                </div>
              )}

              {/* Status */}
              {!card.is_active && (
                <div className="absolute bottom-2 left-2 text-[10px] text-white/30">
                  Disabled
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-white/[0.02] rounded-lg border border-white/5">
        <h3 className="text-sm font-medium text-white mb-2">💡 Tips</h3>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Custom cards appear alongside default options in the Armory</li>
          <li>• Use platform-specific values to optimize prompts for each AI model</li>
          <li>• Disable cards temporarily instead of deleting them</li>
          <li>• Pro users can create up to 100 custom cards per category</li>
        </ul>
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={activeCategory}
      />
    </div>
  );
}
