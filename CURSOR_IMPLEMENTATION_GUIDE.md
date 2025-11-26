# PROMPT ARMORY — Cursor Implementation Guide
## Step-by-Step Build Checklist

This guide provides the exact sequence of tasks to build Prompt Armory in Cursor IDE. Each step builds on the previous one. Check off tasks as you complete them.

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] At least one AI API key (OpenAI for DALL-E 3 recommended to start)
- [ ] Cursor IDE installed

---

## PHASE 1: Project Setup (Day 1)

### Step 1.1: Initialize Project

```bash
# Create Next.js project
npx create-next-app@latest prompt-armory --typescript --tailwind --eslint --app --src-dir

# Navigate to project
cd prompt-armory

# Install core dependencies
npm install @supabase/ssr @supabase/supabase-js zustand @tanstack/react-query openai replicate stripe
```

### Step 1.2: Copy Starter Files

Copy these files from the starter package into your project:

```
FROM: prompt-armory-starter/
TO: your-project/

Files to copy:
├── src/types/index.ts
├── src/types/master-state.ts
├── src/lib/translation-engine/types.ts
├── src/lib/translation-engine/index.ts
├── src/lib/platforms/index.ts
├── src/lib/supabase/client.ts
├── src/lib/supabase/server.ts
├── src/stores/armory-store.ts
├── src/stores/auth-store.ts
├── middleware.ts
├── .env.example → .env.local
```

### Step 1.3: Setup Supabase

1. Create new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Paste and run the migration from `supabase/migrations/001_initial_schema.sql`
4. Go to Authentication > Providers and enable:
   - Email (default)
   - Google (add OAuth credentials)
   - Discord (add OAuth credentials)
5. Copy your project URL and anon key to `.env.local`

### Step 1.4: Verify Setup

```bash
npm run dev
# Should start without errors
```

**Checkpoint: Project runs, Supabase connected**

---

## PHASE 2: Core State Management (Day 1-2)

### Step 2.1: Create the Armory Store

The store is already provided, but let's verify it works:

```typescript
// src/stores/armory-store.ts - Test in browser console:
// useArmoryStore.getState().masterState
```

### Step 2.2: Build the Subject Input Component

```typescript
// src/components/armory/SubjectInput.tsx

'use client';

import { useArmoryStore } from '@/stores/armory-store';
import { useState } from 'react';

export function SubjectInput() {
  const { masterState, updateMasterState } = useArmoryStore();
  const [modifierInput, setModifierInput] = useState('');

  const handleSubjectChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateMasterState('subject.main', e.target.value);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMasterState('subject.action', e.target.value || null);
  };

  const addModifier = () => {
    if (!modifierInput.trim()) return;
    const newModifiers = [...masterState.subject.modifiers, modifierInput.trim()];
    updateMasterState('subject.modifiers', newModifiers);
    setModifierInput('');
  };

  const removeModifier = (index: number) => {
    const newModifiers = masterState.subject.modifiers.filter((_, i) => i !== index);
    updateMasterState('subject.modifiers', newModifiers);
  };

  return (
    <div className="space-y-4">
      {/* Main Subject */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
          Subject
        </label>
        <textarea
          value={masterState.subject.main}
          onChange={handleSubjectChange}
          placeholder="Cyberpunk Samurai..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
          rows={2}
        />
      </div>

      {/* Action */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
          Action (optional)
        </label>
        <input
          type="text"
          value={masterState.subject.action || ''}
          onChange={handleActionChange}
          placeholder="drawing a katana..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Modifiers */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
          Modifiers
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={modifierInput}
            onChange={(e) => setModifierInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addModifier()}
            placeholder="Add modifier..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={addModifier}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {masterState.subject.modifiers.map((mod, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/70 flex items-center gap-2"
            >
              {mod}
              <button
                onClick={() => removeModifier(index)}
                className="text-white/40 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 2.3: Build the Platform Selector

```typescript
// src/components/armory/PlatformSelector.tsx

'use client';

import { useArmoryStore } from '@/stores/armory-store';
import { platforms } from '@/lib/platforms';
import { PlatformId } from '@/types';

export function PlatformSelector() {
  const { targetPlatform, setTargetPlatform, platformFilter, setPlatformFilter } = useArmoryStore();

  const filteredPlatforms = Object.entries(platforms).filter(([_, p]) => {
    if (platformFilter === 'all') return true;
    return p.type === platformFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'image', 'video'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setPlatformFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === filter
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {filteredPlatforms.map(([id, platform]) => (
          <button
            key={id}
            onClick={() => setTargetPlatform(id as PlatformId)}
            className={`relative p-3 rounded-xl border transition-all duration-300 ${
              targetPlatform === id
                ? 'border-2'
                : 'border-white/10 hover:border-white/20'
            }`}
            style={{
              borderColor: targetPlatform === id ? platform.color : undefined,
              backgroundColor: targetPlatform === id ? `${platform.color}15` : 'transparent',
            }}
          >
            <div className="text-center">
              <div
                className="text-2xl mb-1"
                style={{ color: platform.color }}
              >
                {platform.icon}
              </div>
              <div className="text-xs text-white/70 truncate">
                {platform.shortName}
              </div>
            </div>
            
            {/* Type Badge */}
            <div
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: platform.type === 'video' ? '#22c55e' : '#3b82f6' }}
              title={platform.type}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Checkpoint: Can select platforms, subject input works**

---

## PHASE 3: Arsenal Card System (Day 2-3)

### Step 3.1: Create Polymorphic Card Data

```typescript
// src/lib/arsenal/polymorphic-cards.ts

import { PlatformId } from '@/types';

export interface PolymorphicCard {
  id: string;
  category: 'angle' | 'movement' | 'lens' | 'lighting' | 'filmStock' | 'style';
  label: string;
  stateKey: string;
  description: string;
  icon?: string;
  values: Partial<Record<PlatformId, string | null>>;
  ignoredPlatforms: PlatformId[];
}

export const polymorphicCards: PolymorphicCard[] = [
  // ═══════════════════════════════════════════════════════════════
  // CAMERA ANGLES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'low-angle',
    category: 'angle',
    label: 'Low Angle',
    stateKey: 'camera.angle',
    description: 'Power & dominance',
    icon: '📐',
    values: {
      midjourney: 'Low Angle',
      dalle: 'a Low Angle',
      runway: 'Low Angle',
      veo: 'Low Angle',
      grok: 'Low Angle',
      stable: 'Low Angle',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'high-angle',
    category: 'angle',
    label: 'High Angle',
    stateKey: 'camera.angle',
    description: 'Vulnerability & overview',
    icon: '📐',
    values: {
      midjourney: 'High Angle',
      dalle: 'a High Angle',
      runway: 'High Angle',
      veo: 'High Angle',
      grok: 'High Angle',
      stable: 'High Angle',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'dutch-angle',
    category: 'angle',
    label: 'Dutch Angle',
    stateKey: 'camera.angle',
    description: 'Tension & unease',
    icon: '📐',
    values: {
      midjourney: 'Dutch Angle',
      dalle: 'a Dutch Angle (tilted)',
      runway: 'Dutch Angle',
      veo: 'Dutch Angle',
      grok: 'Dutch Angle',
      stable: 'Dutch Angle',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'eye-level',
    category: 'angle',
    label: 'Eye Level',
    stateKey: 'camera.angle',
    description: 'Neutral & relatable',
    icon: '📐',
    values: {
      midjourney: 'Eye Level',
      dalle: 'eye level shot',
      runway: 'Eye Level',
      veo: 'Eye Level',
      grok: 'Eye Level',
      stable: 'Eye Level',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'birds-eye',
    category: 'angle',
    label: "Bird's Eye",
    stateKey: 'camera.angle',
    description: 'Omniscient & grand',
    icon: '📐',
    values: {
      midjourney: "Bird's Eye View",
      dalle: "a bird's eye view from directly above",
      runway: "Bird's Eye",
      veo: "Bird's Eye View",
      grok: "Bird's Eye View",
      stable: "Bird's Eye View",
    },
    ignoredPlatforms: [],
  },
  {
    id: 'worms-eye',
    category: 'angle',
    label: "Worm's Eye",
    stateKey: 'camera.angle',
    description: 'Extreme power',
    icon: '📐',
    values: {
      midjourney: "Worm's Eye View",
      dalle: "an extreme low angle from ground level",
      runway: "Worm's Eye",
      veo: "Worm's Eye View",
      grok: "Worm's Eye View",
      stable: "Worm's Eye View",
    },
    ignoredPlatforms: [],
  },
  {
    id: 'over-shoulder',
    category: 'angle',
    label: 'Over Shoulder',
    stateKey: 'camera.angle',
    description: 'POV connection',
    icon: '📐',
    values: {
      midjourney: 'Over the Shoulder',
      dalle: 'over the shoulder shot',
      runway: 'Over Shoulder',
      veo: 'Over the Shoulder',
      grok: 'Over the Shoulder',
      stable: 'Over the Shoulder',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'pov',
    category: 'angle',
    label: 'POV Shot',
    stateKey: 'camera.angle',
    description: 'First person immersion',
    icon: '📐',
    values: {
      midjourney: 'POV first person',
      dalle: 'first person point of view',
      runway: 'POV',
      veo: 'POV Shot',
      grok: 'POV first person',
      stable: 'POV first person',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // CAMERA MOVEMENT (Video Only)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'push-in',
    category: 'movement',
    label: 'Push In',
    stateKey: 'camera.movement',
    description: 'Building intensity',
    icon: '🎬',
    values: {
      runway: 'Push In',      // Wrapped in [brackets] by adapter
      veo: 'Push In',
      luma: 'push in',        // Naturalized by adapter: "Smooth push in"
      sora: 'Push In',
      pika: 'push in',
      kling: 'Push In',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'pull-out',
    category: 'movement',
    label: 'Pull Out',
    stateKey: 'camera.movement',
    description: 'Reveal & context',
    icon: '🎬',
    values: {
      runway: 'Pull Out',
      veo: 'Pull Out',
      luma: 'pull out',
      sora: 'Pull Out',
      pika: 'pull out',
      kling: 'Pull Out',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'dolly',
    category: 'movement',
    label: 'Dolly Shot',
    stateKey: 'camera.movement',
    description: 'Smooth tracking',
    icon: '🎬',
    values: {
      runway: 'Dolly',
      veo: 'Dolly Shot',
      luma: 'dolly',
      sora: 'Dolly Shot',
      pika: 'dolly',
      kling: 'Dolly',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'orbit',
    category: 'movement',
    label: 'Orbit',
    stateKey: 'camera.movement',
    description: '360° around subject',
    icon: '🎬',
    values: {
      runway: 'Orbit',
      veo: 'Orbital Shot',
      luma: 'orbit around',
      sora: 'Orbit',
      pika: 'orbit',
      kling: 'Orbit',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'crane-up',
    category: 'movement',
    label: 'Crane Up',
    stateKey: 'camera.movement',
    description: 'Vertical reveal',
    icon: '🎬',
    values: {
      runway: 'Crane Up',
      veo: 'Crane Shot Up',
      luma: 'crane up',
      sora: 'Crane Up',
      pika: 'crane up',
      kling: 'Crane Up',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'pan-left',
    category: 'movement',
    label: 'Pan Left',
    stateKey: 'camera.movement',
    description: 'Horizontal reveal',
    icon: '🎬',
    values: {
      runway: 'Pan Left',
      veo: 'Pan Left',
      luma: 'pan left',
      sora: 'Pan Left',
      pika: 'pan left',
      kling: 'Pan Left',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'pan-right',
    category: 'movement',
    label: 'Pan Right',
    stateKey: 'camera.movement',
    description: 'Horizontal reveal',
    icon: '🎬',
    values: {
      runway: 'Pan Right',
      veo: 'Pan Right',
      luma: 'pan right',
      sora: 'Pan Right',
      pika: 'pan right',
      kling: 'Pan Right',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },
  {
    id: 'zoom-in',
    category: 'movement',
    label: 'Zoom In',
    stateKey: 'camera.movement',
    description: 'Focal length change',
    icon: '🎬',
    values: {
      runway: 'Zoom In',
      veo: 'Zoom In',
      luma: 'zoom in',
      sora: 'Zoom In',
      pika: 'zoom in',
      kling: 'Zoom In',
    },
    ignoredPlatforms: ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'],
  },

  // ═══════════════════════════════════════════════════════════════
  // LENSES
  // ═══════════════════════════════════════════════════════════════
  {
    id: '24mm',
    category: 'lens',
    label: '24mm Wide',
    stateKey: 'camera.lens',
    description: 'Wide environmental',
    icon: '📷',
    values: {
      midjourney: '24mm wide angle',
      dalle: '24mm wide angle lens',
      grok: '24mm',
      stable: '24mm wide angle',
      ideogram: '24mm lens',
      leonardo: '24mm',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: '35mm',
    category: 'lens',
    label: '35mm',
    stateKey: 'camera.lens',
    description: 'Cinematic standard',
    icon: '📷',
    values: {
      midjourney: '35mm',
      dalle: '35mm lens',
      grok: '35mm',
      stable: '35mm',
      ideogram: '35mm lens',
      leonardo: '35mm',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: '50mm',
    category: 'lens',
    label: '50mm',
    stateKey: 'camera.lens',
    description: 'Natural perspective',
    icon: '📷',
    values: {
      midjourney: '50mm',
      dalle: '50mm lens',
      grok: '50mm',
      stable: '50mm',
      ideogram: '50mm lens',
      leonardo: '50mm',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: '85mm',
    category: 'lens',
    label: '85mm Portrait',
    stateKey: 'camera.lens',
    description: 'Flattering compression',
    icon: '📷',
    values: {
      midjourney: '85mm portrait lens',
      dalle: '85mm portrait lens',
      grok: '85mm',
      stable: '85mm portrait',
      ideogram: '85mm portrait lens',
      leonardo: '85mm',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: '135mm',
    category: 'lens',
    label: '135mm',
    stateKey: 'camera.lens',
    description: 'Telephoto compression',
    icon: '📷',
    values: {
      midjourney: '135mm telephoto',
      dalle: '135mm telephoto lens',
      grok: '135mm',
      stable: '135mm telephoto',
      ideogram: '135mm telephoto',
      leonardo: '135mm',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: 'anamorphic',
    category: 'lens',
    label: 'Anamorphic',
    stateKey: 'camera.lens',
    description: 'Cinematic widescreen',
    icon: '📷',
    values: {
      midjourney: 'anamorphic lens, lens flare',
      dalle: 'anamorphic widescreen lens with characteristic lens flares',
      grok: 'anamorphic',
      stable: 'anamorphic lens',
      ideogram: 'anamorphic cinematography',
      leonardo: 'anamorphic',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: 'macro',
    category: 'lens',
    label: 'Macro',
    stateKey: 'camera.lens',
    description: 'Extreme close-up',
    icon: '📷',
    values: {
      midjourney: 'macro lens, extreme detail',
      dalle: 'macro photography, extreme close-up',
      grok: 'macro',
      stable: 'macro photography',
      ideogram: 'macro lens',
      leonardo: 'macro',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },
  {
    id: 'tilt-shift',
    category: 'lens',
    label: 'Tilt-Shift',
    stateKey: 'camera.lens',
    description: 'Miniature effect',
    icon: '📷',
    values: {
      midjourney: 'tilt-shift lens, miniature effect',
      dalle: 'tilt-shift photography creating miniature effect',
      grok: 'tilt-shift',
      stable: 'tilt-shift miniature',
      ideogram: 'tilt-shift lens',
      leonardo: 'tilt-shift',
    },
    ignoredPlatforms: ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'],
  },

  // ═══════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'golden-hour',
    category: 'lighting',
    label: 'Golden Hour',
    stateKey: 'environment.lighting',
    description: 'Warm magic hour',
    icon: '☀️',
    values: {
      midjourney: 'Golden Hour',
      dalle: 'Golden Hour lighting',
      runway: 'Golden Hour light',
      veo: 'Golden Hour',
      grok: 'Golden Hour',
      luma: 'Golden Hour',
      stable: 'Golden Hour',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'blue-hour',
    category: 'lighting',
    label: 'Blue Hour',
    stateKey: 'environment.lighting',
    description: 'Twilight cool tones',
    icon: '🌙',
    values: {
      midjourney: 'Blue Hour',
      dalle: 'Blue Hour twilight lighting',
      runway: 'Blue Hour light',
      veo: 'Blue Hour',
      grok: 'Blue Hour',
      luma: 'Blue Hour',
      stable: 'Blue Hour',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'neon-volumetric',
    category: 'lighting',
    label: 'Neon Volumetric',
    stateKey: 'environment.lighting',
    description: 'Cyberpunk atmosphere',
    icon: '💡',
    values: {
      midjourney: 'Neon Volumetric lighting',
      dalle: 'neon volumetric lighting with visible light rays',
      runway: 'Neon Volumetric',
      veo: 'Neon Volumetric',
      grok: 'Neon Volumetric',
      luma: 'Neon Volumetric',
      stable: '(neon volumetric lighting:1.2)',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'rembrandt',
    category: 'lighting',
    label: 'Rembrandt',
    stateKey: 'environment.lighting',
    description: 'Classic portrait drama',
    icon: '🎨',
    values: {
      midjourney: 'Rembrandt lighting',
      dalle: 'Rembrandt lighting with triangle of light',
      runway: 'Rembrandt lighting',
      veo: 'Rembrandt Lighting',
      grok: 'Rembrandt lighting',
      luma: 'Rembrandt lighting',
      stable: 'Rembrandt lighting',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'rim-light',
    category: 'lighting',
    label: 'Rim Light',
    stateKey: 'environment.lighting',
    description: 'Edge separation',
    icon: '✨',
    values: {
      midjourney: 'rim lighting, backlit',
      dalle: 'dramatic rim lighting separating subject from background',
      runway: 'rim light',
      veo: 'Rim Lighting',
      grok: 'rim lighting',
      luma: 'rim lighting',
      stable: 'rim lighting, backlit',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'harsh-shadows',
    category: 'lighting',
    label: 'Harsh Shadows',
    stateKey: 'environment.lighting',
    description: 'High contrast drama',
    icon: '⬛',
    values: {
      midjourney: 'harsh shadows, high contrast',
      dalle: 'harsh directional lighting with deep shadows',
      runway: 'harsh shadows',
      veo: 'Harsh Shadows',
      grok: 'harsh shadows',
      luma: 'harsh shadows',
      stable: 'harsh shadows, high contrast',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'soft-diffused',
    category: 'lighting',
    label: 'Soft Diffused',
    stateKey: 'environment.lighting',
    description: 'Gentle flattering light',
    icon: '☁️',
    values: {
      midjourney: 'soft diffused lighting',
      dalle: 'soft diffused lighting with gentle shadows',
      runway: 'soft diffused light',
      veo: 'Soft Diffused',
      grok: 'soft diffused lighting',
      luma: 'soft diffused',
      stable: 'soft diffused lighting',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'silhouette',
    category: 'lighting',
    label: 'Silhouette',
    stateKey: 'environment.lighting',
    description: 'Backlit dramatic',
    icon: '🌅',
    values: {
      midjourney: 'silhouette, backlit',
      dalle: 'dramatic silhouette against bright background',
      runway: 'silhouette',
      veo: 'Silhouette',
      grok: 'silhouette',
      luma: 'silhouette',
      stable: 'silhouette, backlit',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // FILM STOCKS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'portra-400',
    category: 'filmStock',
    label: 'Kodak Portra 400',
    stateKey: 'aesthetics.filmStock',
    description: 'Portrait classic',
    icon: '🎞️',
    values: {
      midjourney: 'Kodak Portra 400',
      dalle: 'the aesthetic of Kodak Portra 400 film',
      runway: 'Kodak Portra 400',
      veo: 'Kodak Portra 400 look',
      grok: 'Kodak Portra 400',
      luma: 'Portra 400',
      stable: 'Kodak Portra 400',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'cinestill-800t',
    category: 'filmStock',
    label: 'CineStill 800T',
    stateKey: 'aesthetics.filmStock',
    description: 'Tungsten cinema',
    icon: '🎞️',
    values: {
      midjourney: 'CineStill 800T',
      dalle: 'the aesthetic of CineStill 800T tungsten film',
      runway: 'CineStill 800T',
      veo: 'CineStill 800T look',
      grok: 'CineStill 800T',
      luma: 'CineStill 800T',
      stable: 'CineStill 800T, halation',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'ektar-100',
    category: 'filmStock',
    label: 'Kodak Ektar 100',
    stateKey: 'aesthetics.filmStock',
    description: 'Vivid saturated',
    icon: '🎞️',
    values: {
      midjourney: 'Kodak Ektar 100',
      dalle: 'the aesthetic of Kodak Ektar 100 film',
      runway: 'Kodak Ektar 100',
      veo: 'Kodak Ektar 100 look',
      grok: 'Kodak Ektar 100',
      luma: 'Ektar 100',
      stable: 'Kodak Ektar 100',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'tri-x',
    category: 'filmStock',
    label: 'Kodak Tri-X 400',
    stateKey: 'aesthetics.filmStock',
    description: 'Classic B&W grain',
    icon: '🎞️',
    values: {
      midjourney: 'Kodak Tri-X 400, black and white',
      dalle: 'black and white Kodak Tri-X 400 film aesthetic',
      runway: 'Tri-X black and white',
      veo: 'Kodak Tri-X 400 B&W',
      grok: 'Kodak Tri-X 400',
      luma: 'Tri-X black and white',
      stable: 'Kodak Tri-X 400, black and white, film grain',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'velvia-50',
    category: 'filmStock',
    label: 'Fuji Velvia 50',
    stateKey: 'aesthetics.filmStock',
    description: 'Saturated landscape',
    icon: '🎞️',
    values: {
      midjourney: 'Fuji Velvia 50',
      dalle: 'the aesthetic of Fuji Velvia 50 slide film',
      runway: 'Fuji Velvia 50',
      veo: 'Fuji Velvia 50 look',
      grok: 'Fuji Velvia 50',
      luma: 'Velvia 50',
      stable: 'Fuji Velvia 50, saturated',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'superia-400',
    category: 'filmStock',
    label: 'Fuji Superia 400',
    stateKey: 'aesthetics.filmStock',
    description: 'Consumer nostalgia',
    icon: '🎞️',
    values: {
      midjourney: 'Fuji Superia 400',
      dalle: 'the aesthetic of Fuji Superia 400 film',
      runway: 'Fuji Superia 400',
      veo: 'Fuji Superia 400 look',
      grok: 'Fuji Superia 400',
      luma: 'Superia 400',
      stable: 'Fuji Superia 400',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'vision3-500t',
    category: 'filmStock',
    label: 'Kodak Vision3 500T',
    stateKey: 'aesthetics.filmStock',
    description: 'Hollywood cinema',
    icon: '🎞️',
    values: {
      midjourney: 'Kodak Vision3 500T',
      dalle: 'the aesthetic of Kodak Vision3 500T motion picture film',
      runway: 'Kodak Vision3 500T',
      veo: 'Kodak Vision3 500T look',
      grok: 'Kodak Vision3 500T',
      luma: 'Vision3 500T',
      stable: 'Kodak Vision3 500T',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'hp5-plus',
    category: 'filmStock',
    label: 'Ilford HP5 Plus',
    stateKey: 'aesthetics.filmStock',
    description: 'Documentary B&W',
    icon: '🎞️',
    values: {
      midjourney: 'Ilford HP5 Plus, black and white',
      dalle: 'black and white Ilford HP5 Plus film aesthetic',
      runway: 'HP5 black and white',
      veo: 'Ilford HP5 Plus B&W',
      grok: 'Ilford HP5 Plus',
      luma: 'HP5 black and white',
      stable: 'Ilford HP5 Plus, black and white, film grain',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // VISUAL STYLES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinematic',
    category: 'style',
    label: 'Cinematic',
    stateKey: 'aesthetics.style',
    description: 'Film production quality',
    icon: '🎬',
    values: {
      midjourney: 'Cinematic',
      dalle: 'cinematic',
      runway: 'Cinematic style',
      veo: 'Cinematic',
      grok: 'Cinematic',
      luma: 'Cinematic',
      stable: '(Cinematic:1.2)',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'documentary',
    category: 'style',
    label: 'Documentary',
    stateKey: 'aesthetics.style',
    description: 'Raw authentic feel',
    icon: '📹',
    values: {
      midjourney: 'Documentary style',
      dalle: 'documentary photography style',
      runway: 'Documentary',
      veo: 'Documentary',
      grok: 'Documentary',
      luma: 'Documentary',
      stable: 'documentary style',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'film-noir',
    category: 'style',
    label: 'Film Noir',
    stateKey: 'aesthetics.style',
    description: 'High contrast shadows',
    icon: '🕵️',
    values: {
      midjourney: 'Film Noir, high contrast, dramatic shadows',
      dalle: 'Film Noir style with dramatic shadows and high contrast',
      runway: 'Film Noir',
      veo: 'Film Noir',
      grok: 'Film Noir',
      luma: 'Film Noir',
      stable: '(Film Noir:1.3), high contrast',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'cyberpunk',
    category: 'style',
    label: 'Cyberpunk',
    stateKey: 'aesthetics.style',
    description: 'Neon-lit dystopia',
    icon: '🌃',
    values: {
      midjourney: 'Cyberpunk',
      dalle: 'Cyberpunk aesthetic',
      runway: 'Cyberpunk style',
      veo: 'Cyberpunk',
      grok: 'Cyberpunk',
      luma: 'Cyberpunk',
      stable: '(Cyberpunk:1.2), neon',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'vintage',
    category: 'style',
    label: 'Vintage',
    stateKey: 'aesthetics.style',
    description: 'Retro nostalgia',
    icon: '📻',
    values: {
      midjourney: 'Vintage, retro',
      dalle: 'vintage retro aesthetic',
      runway: 'Vintage',
      veo: 'Vintage',
      grok: 'Vintage',
      luma: 'Vintage',
      stable: 'vintage, retro',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'anime',
    category: 'style',
    label: 'Anime',
    stateKey: 'aesthetics.style',
    description: 'Japanese animation',
    icon: '🎌',
    values: {
      midjourney: 'Anime style',
      dalle: 'anime art style',
      runway: 'Anime',
      veo: 'Anime',
      grok: 'Anime',
      luma: 'Anime',
      stable: '(Anime:1.2)',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'hyperrealistic',
    category: 'style',
    label: 'Hyperrealistic',
    stateKey: 'aesthetics.style',
    description: 'Ultra photorealism',
    icon: '📸',
    values: {
      midjourney: 'Hyperrealistic, photorealistic',
      dalle: 'hyperrealistic photorealistic',
      runway: 'Hyperrealistic',
      veo: 'Hyperrealistic',
      grok: 'Hyperrealistic',
      luma: 'Hyperrealistic',
      stable: '(photorealistic:1.4), hyperdetailed',
    },
    ignoredPlatforms: [],
  },
  {
    id: 'ethereal',
    category: 'style',
    label: 'Ethereal',
    stateKey: 'aesthetics.style',
    description: 'Dreamy otherworldly',
    icon: '✨',
    values: {
      midjourney: 'Ethereal, dreamy',
      dalle: 'ethereal dreamy quality',
      runway: 'Ethereal',
      veo: 'Ethereal',
      grok: 'Ethereal',
      luma: 'Ethereal',
      stable: 'ethereal, dreamy',
    },
    ignoredPlatforms: [],
  },
];

// Helper to get cards by category
export function getCardsByCategory(category: PolymorphicCard['category']): PolymorphicCard[] {
  return polymorphicCards.filter(card => card.category === category);
}

// All categories
export const categories = [
  { id: 'angle', label: 'Camera Angles', icon: '📐' },
  { id: 'movement', label: 'Movement', icon: '🎬' },
  { id: 'lens', label: 'Lens & Optics', icon: '📷' },
  { id: 'lighting', label: 'Lighting', icon: '💡' },
  { id: 'filmStock', label: 'Film Stock', icon: '🎞️' },
  { id: 'style', label: 'Visual Style', icon: '🎨' },
] as const;
```

### Step 3.2: Build the Card Grid Component

```typescript
// src/components/armory/CardGrid.tsx

'use client';

import { useArmoryStore } from '@/stores/armory-store';
import { polymorphicCards, categories, getCardsByCategory, PolymorphicCard } from '@/lib/arsenal/polymorphic-cards';
import { getStateValue, setStateValue } from '@/types/master-state';
import { useState } from 'react';

export function CardGrid() {
  const { masterState, setMasterState, targetPlatform } = useArmoryStore();
  const [activeCategory, setActiveCategory] = useState<string>('angle');

  const cards = getCardsByCategory(activeCategory as PolymorphicCard['category']);

  const isCardActive = (card: PolymorphicCard): boolean => {
    const currentValue = getStateValue(masterState, card.stateKey);
    return currentValue === card.label;
  };

  const isCardIgnored = (card: PolymorphicCard): boolean => {
    return card.ignoredPlatforms.includes(targetPlatform);
  };

  const handleCardClick = (card: PolymorphicCard) => {
    const currentValue = getStateValue(masterState, card.stateKey);
    const newValue = currentValue === card.label ? null : card.label;
    const newState = setStateValue(masterState, card.stateKey, newValue);
    setMasterState(newState);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const active = isCardActive(card);
          const ignored = isCardIgnored(card);

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={ignored}
              className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                ignored
                  ? 'opacity-30 cursor-not-allowed border-white/5'
                  : active
                  ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {/* Ignored Badge */}
              {ignored && (
                <div className="absolute top-2 right-2 text-xs text-white/30">
                  N/A
                </div>
              )}

              {/* Card Content */}
              <div className="text-lg mb-1">{card.icon}</div>
              <div className={`font-medium ${active ? 'text-cyan-400' : 'text-white'}`}>
                {card.label}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {card.description}
              </div>

              {/* Active Indicator */}
              {active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Checkpoint: Cards can be selected and update MasterState**

---

## PHASE 4: Translation Engine Integration (Day 3-4)

### Step 4.1: Connect Store to Translation Engine

Update the armory store to regenerate prompts automatically:

```typescript
// Update src/stores/armory-store.ts

import { TranslationEngine } from '@/lib/translation-engine';

// In the store, add these computed values:

regeneratePrompts: () => {
  const { masterState, targetPlatform } = get();
  
  // Generate prompt for current platform
  const currentPrompt = TranslationEngine.translate(masterState, targetPlatform);
  
  // Validate
  const validation = TranslationEngine.validate(masterState, targetPlatform);
  
  set({
    currentPrompt,
    validationWarnings: validation.warnings,
    validationErrors: validation.errors,
  });
},
```

### Step 4.2: Build the Animated Output Display

```typescript
// src/components/armory/PromptOutput.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useArmoryStore } from '@/stores/armory-store';
import { TranslationEngine } from '@/lib/translation-engine';
import { platforms } from '@/lib/platforms';

// Scramble characters
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()█▓▒░╔╗╚╝║═';

export function PromptOutput() {
  const { masterState, targetPlatform } = useArmoryStore();
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevPlatformRef = useRef(targetPlatform);
  
  const platform = platforms[targetPlatform];
  const prompt = TranslationEngine.translate(masterState, targetPlatform);
  const validation = TranslationEngine.validate(masterState, targetPlatform);

  // Scramble animation when platform changes
  useEffect(() => {
    if (prevPlatformRef.current !== targetPlatform) {
      setIsAnimating(true);
      
      let frame = 0;
      const totalFrames = 20;
      
      const animate = () => {
        frame++;
        const progress = frame / totalFrames;
        
        // Generate scrambled text
        let result = '';
        for (let i = 0; i < prompt.length; i++) {
          if (i < prompt.length * progress) {
            result += prompt[i];
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplayText(result);
        
        if (frame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          setDisplayText(prompt);
          setIsAnimating(false);
        }
      };
      
      animate();
      prevPlatformRef.current = targetPlatform;
    } else {
      setDisplayText(prompt);
    }
  }, [targetPlatform, prompt]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-white/40 uppercase tracking-wider">
            Output — {platform.name}
          </span>
        </div>
        
        {isAnimating && (
          <div className="flex items-center gap-2 text-xs" style={{ color: platform.color }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: platform.color }} />
            TRANSLATING...
          </div>
        )}
      </div>

      {/* Prompt Display */}
      <div 
        className="p-6 font-mono text-sm leading-relaxed min-h-[150px]"
        style={{ color: isAnimating ? platform.color : 'rgba(255,255,255,0.8)' }}
      >
        {displayText || (
          <span className="text-white/30 italic">
            Select cards and enter a subject to generate your prompt...
          </span>
        )}
      </div>

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div className="px-4 py-2 border-t border-white/10 bg-yellow-500/10">
          {validation.warnings.map((warning, i) => (
            <div key={i} className="text-xs text-yellow-400 flex items-center gap-2">
              <span>⚠️</span>
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
        <div className="text-xs text-white/30">
          {prompt.length} characters
        </div>
        
        <button
          onClick={handleCopy}
          disabled={!prompt || isAnimating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{ 
            backgroundColor: `${platform.color}20`,
            color: platform.color,
          }}
        >
          {copied ? (
            <>✓ Copied!</>
          ) : (
            <>📋 Copy for {platform.shortName}</>
          )}
        </button>
      </div>
    </div>
  );
}
```

**Checkpoint: Prompt updates live, cipher animation works**

---

## PHASE 5: Main Armory Page Assembly (Day 4)

### Step 5.1: Build the Main Armory Component

```typescript
// src/app/dashboard/page.tsx

'use client';

import { SubjectInput } from '@/components/armory/SubjectInput';
import { PlatformSelector } from '@/components/armory/PlatformSelector';
import { CardGrid } from '@/components/armory/CardGrid';
import { PromptOutput } from '@/components/armory/PromptOutput';
import { AspectRatioSelector } from '@/components/armory/AspectRatioSelector';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            PROMPT ARMORY
          </h1>
          <p className="text-white/50 mt-2">
            Polymorphic prompt engineering for generative AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Construction Bay */}
          <div className="space-y-6">
            {/* Platform Selector */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <h2 className="text-sm text-white/50 uppercase tracking-wider mb-4">
                Target Platform
              </h2>
              <PlatformSelector />
            </section>

            {/* Subject Input */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <h2 className="text-sm text-white/50 uppercase tracking-wider mb-4">
                Subject
              </h2>
              <SubjectInput />
            </section>

            {/* Aspect Ratio */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <h2 className="text-sm text-white/50 uppercase tracking-wider mb-4">
                Aspect Ratio
              </h2>
              <AspectRatioSelector />
            </section>
          </div>

          {/* Right Column: Output + Arsenal */}
          <div className="space-y-6">
            {/* Output */}
            <PromptOutput />

            {/* Arsenal Cards */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <h2 className="text-sm text-white/50 uppercase tracking-wider mb-4">
                Arsenal
              </h2>
              <CardGrid />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 5.2: Add Aspect Ratio Selector

```typescript
// src/components/armory/AspectRatioSelector.tsx

'use client';

import { useArmoryStore } from '@/stores/armory-store';
import { AspectRatio } from '@/types/master-state';

const aspectRatios: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '🖥️' },
  { value: '9:16', label: '9:16', icon: '📱' },
  { value: '1:1', label: '1:1', icon: '⬜' },
  { value: '21:9', label: '21:9', icon: '🎬' },
];

export function AspectRatioSelector() {
  const { masterState, updateMasterState } = useArmoryStore();

  return (
    <div className="flex gap-3">
      {aspectRatios.map((ratio) => (
        <button
          key={ratio.value}
          onClick={() => updateMasterState('aesthetics.aspectRatio', ratio.value)}
          className={`flex-1 py-3 rounded-xl border transition-all ${
            masterState.aesthetics.aspectRatio === ratio.value
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'border-white/10 text-white/50 hover:border-white/20'
          }`}
        >
          <div className="text-lg mb-1">{ratio.icon}</div>
          <div className="text-sm">{ratio.label}</div>
        </button>
      ))}
    </div>
  );
}
```

**Checkpoint: Full Armory UI working with live translation**

---

## PHASE 6: API Integration (Day 5)

### Step 6.1: Implement DALL-E 3 Generation

The route is already created. Add a generate button:

```typescript
// src/components/armory/GenerateButton.tsx

'use client';

import { useState } from 'react';
import { useArmoryStore } from '@/stores/armory-store';
import { TranslationEngine } from '@/lib/translation-engine';
import { platforms } from '@/lib/platforms';

export function GenerateButton() {
  const { masterState, targetPlatform } = useArmoryStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const platform = platforms[targetPlatform];
  const prompt = TranslationEngine.translate(masterState, targetPlatform);

  const canGenerate = ['dalle', 'grok', 'stable'].includes(targetPlatform);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Map platform to API route
      const routeMap: Record<string, string> = {
        dalle: '/api/generate/dalle',
        grok: '/api/generate/flux',
        stable: '/api/generate/stable-diffusion',
      };

      const route = routeMap[targetPlatform];
      if (!route) throw new Error('Platform not supported for generation');

      const response = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: masterState.aesthetics.aspectRatio,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult(data.mediaUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canGenerate) {
    return (
      <div className="text-center p-4 text-white/50 text-sm">
        Copy the prompt and use it in {platform.name}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
        style={{
          backgroundColor: platform.color,
          color: 'black',
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⚙️</span>
            Generating...
          </span>
        ) : (
          `Generate with ${platform.shortName}`
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img src={result} alt="Generated" className="w-full" />
        </div>
      )}
    </div>
  );
}
```

**Checkpoint: Can generate images with DALL-E 3**

---

## PHASE 7: Polish & Deploy (Day 6-7)

### Step 7.1: Add Loading States

### Step 7.2: Add Error Boundaries

### Step 7.3: Mobile Responsive Polish

### Step 7.4: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `src/types/master-state.ts` | MasterState schema |
| `src/lib/translation-engine/index.ts` | All 11 platform adapters |
| `src/lib/arsenal/polymorphic-cards.ts` | Card definitions |
| `src/stores/armory-store.ts` | Global state management |
| `src/components/armory/*.tsx` | UI components |
| `src/app/api/generate/*/route.ts` | AI generation endpoints |

---

## Testing Checklist

- [ ] Platform switch triggers cipher animation
- [ ] Cards show as N/A when ignored for platform
- [ ] Movement cards hidden/disabled for image platforms
- [ ] Prompt regenerates on any state change
- [ ] Copy button copies correct platform prompt
- [ ] DALL-E 3 generation works
- [ ] Flux generation works
- [ ] Mobile layout works

---

## Next Enhancements (After MVP)

1. **Custom Cards** — User can add their own cards (Hasselblad 50mm, etc.)
2. **Presets** — Save/load complete state configurations
3. **History** — View past generations
4. **Library** — Save prompts for later
5. **Notes** — Attach notes to prompts
6. **Billing** — Stripe subscription integration

---

**You're ready to build! Start with Phase 1 and work through sequentially.**
