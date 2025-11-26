'use client';

import { useState } from 'react';
import { useCustomCards } from '@/hooks/useCustomCards';
import { CardCategory, PlatformId } from '@/types';
import { platforms } from '@/lib/platforms/index';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CardCategory;
}

const categoryLabels: Record<CardCategory, string> = {
  angle: 'Camera Angle',
  movement: 'Camera Movement',
  lens: 'Lens & Optics',
  lighting: 'Lighting',
  style: 'Visual Style',
  filmStock: 'Film Stock',
};

const categoryPlaceholders: Record<CardCategory, { label: string; value: string; desc: string }> = {
  angle: { label: 'Overhead Shot', value: 'Overhead Shot', desc: 'Top-down perspective' },
  movement: { label: 'Jib Shot', value: 'Jib Shot', desc: 'Smooth vertical motion' },
  lens: { label: 'Hasselblad 50mm', value: 'Hasselblad 50mm medium format lens', desc: 'Classic medium format look' },
  lighting: { label: 'Moonlight', value: 'Soft moonlight', desc: 'Cool nocturnal ambiance' },
  style: { label: 'Wes Anderson', value: 'Wes Anderson style', desc: 'Symmetrical compositions' },
  filmStock: { label: 'Fuji Pro 400H', value: 'Fuji Pro 400H', desc: 'Soft pastel tones' },
};

export function AddCardModal({ isOpen, onClose, category }: AddCardModalProps) {
  const { createCard } = useCustomCards();
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [platformValues, setPlatformValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const placeholder = categoryPlaceholders[category];

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!label.trim() || !value.trim()) return;
    
    setIsSaving(true);
    
    try {
      await createCard.mutateAsync({
        category,
        label: label.trim(),
        value: value.trim(),
        description: description.trim() || null,
        icon: null,
        platform_values: Object.keys(platformValues).length > 0 ? platformValues : {},
        sort_order: 999,
        is_active: true,
      });
      
      // Reset form
      setLabel('');
      setValue('');
      setDescription('');
      setPlatformValues({});
      setShowAdvanced(false);
      onClose();
    } catch (error) {
      console.error('Failed to create card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    // Auto-populate value if empty
    if (!value || value === label) {
      setValue(newLabel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0b] rounded-xl border border-white/10 shadow-2xl animate-slideUp max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0a0a0b]">
          <div>
            <h2 className="text-lg font-medium text-white">Add Custom Card</h2>
            <p className="text-xs text-white/40 mt-1">Category: {categoryLabels[category]}</p>
          </div>
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
              Display Label *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder={placeholder.label}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              autoFocus
            />
            <p className="text-xs text-white/30 mt-1">Shown on the card button</p>
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Prompt Value *
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder.value}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <p className="text-xs text-white/30 mt-1">Text inserted into the prompt</p>
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={placeholder.desc}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <p className="text-xs text-white/30 mt-1">Brief description shown below the label</p>
          </div>

          {/* Advanced: Platform-specific values */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▸</span>
              Platform-Specific Values
              <span className="text-xs text-white/30">(optional)</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-3 animate-slideDown">
                <p className="text-xs text-white/40">
                  Override the prompt value for specific platforms. Leave empty to use the default value.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(platforms).slice(0, 6).map((platform) => (
                    <div key={platform.id}>
                      <label className="block text-xs text-white/40 mb-1">
                        <span style={{ color: platform.color }}>{platform.icon}</span> {platform.shortName}
                      </label>
                      <input
                        type="text"
                        value={platformValues[platform.id] || ''}
                        onChange={(e) => setPlatformValues(prev => ({
                          ...prev,
                          [platform.id]: e.target.value
                        }))}
                        placeholder={value || 'Default value'}
                        className="w-full bg-white/[0.02] border border-white/5 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 text-xs text-white/40">
                  <strong className="text-white/60">Example:</strong> For a Hasselblad lens, you might use:
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    <li>Midjourney: "Hasselblad 50mm medium format"</li>
                    <li>DALL-E: "shot on a Hasselblad 50mm with shallow depth of field"</li>
                    <li>Stable Diffusion: "(Hasselblad 50mm:1.2), medium format"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Preview</div>
            <div className="p-4 bg-white/[0.03] rounded-lg border border-white/10">
              <div className="font-medium text-white mb-1">
                {label || <span className="text-white/30">Card Label</span>}
              </div>
              <div className="text-xs text-white/40">
                {description || <span className="text-white/20">Description text</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 sticky bottom-0 bg-[#0a0a0b]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim() || !value.trim() || isSaving}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Adding...' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  );
}
