# PROMPT ARMORY — Complete Architectural Implementation Plan
## Polymorphic Prompt Engineering + SaaS Platform

---

## Executive Summary

This plan integrates the **Polymorphic Prompt Architecture** (from the specification document) with the **SaaS Foundation** we've already built. The result is a production-ready system that:

1. **Decouples User Intent from Model Syntax** — Users select concepts; the system translates to platform-specific syntax
2. **Maintains a Master State Object** — A normalized JSON structure that persists across platform switches
3. **Uses Translation Adapters** — Platform-specific functions that generate optimized prompts
4. **Provides Polymorphic Card Mapping** — Each card has different output values per platform
5. **Includes Visual Feedback** — Cipher/scramble animation reinforces the "translation" metaphor
6. **Scales to SaaS** — Auth, billing, user customization, and monetization built-in

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Platform   │  │   Arsenal   │  │   Preset    │  │   Subject Input     │ │
│  │  Switcher   │  │    Cards    │  │   Panel     │  │   (Text Field)      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MASTER STATE OBJECT                                 │
│  {                                                                          │
│    subject: { main, action, modifiers[] },                                  │
│    camera: { angle, lens, movement, intensity },                            │
│    environment: { setting, lighting, weather },                             │
│    aesthetics: { style, filmStock, mood, aspectRatio }                      │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │  State remains constant when switching platforms
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRANSLATION ENGINE                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Midjourney │ │  DALL-E 3  │ │   Runway   │ │ Google Veo │ │   Flux.1   │ │
│  │  Adapter   │ │  Adapter   │ │  Adapter   │ │  Adapter   │ │  Adapter   │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ │
│        │              │              │              │              │        │
│        ▼              ▼              ▼              ▼              ▼        │
│  "subject,       "Create a      "[Push In]:   "Cinemato-    "Subject.     │
│   Low Angle,      cinematic      Low Angle     graphy:       Captured      │
│   35mm...         image of..."   shot of..."   Low Angle..." from a..."    │
│   --ar 16:9"                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │  Cipher Animation (scramble → resolve)
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT DISPLAY                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Push In]: Low Angle shot of Cyberpunk Samurai drawing a katana.   │   │
│  │ Neon Volumetric and Cinematic.                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                        [Copy for Runway Gen-3]  [Generate]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Enhanced Data Architecture

### 1.1 Master State Object Schema

Replace the simple `PromptState` with a richer nested structure:

```typescript
// src/types/master-state.ts

export interface SubjectState {
  main: string;                    // "Cyberpunk Samurai"
  action: string | null;           // "drawing a katana"
  modifiers: string[];             // ["neon tattoos", "chrome armor"]
}

export interface CameraState {
  angle: string | null;            // "Low Angle"
  lens: string | null;             // "35mm"
  movement: string | null;         // "Push In"
  intensity: string | null;        // "Fast", "Slow", "Smooth"
}

export interface EnvironmentState {
  setting: string | null;          // "Rainy Neo-Tokyo street"
  lighting: string | null;         // "Neon Volumetric"
  weather: string | null;          // "Heavy Rain"
}

export interface AestheticsState {
  style: string | null;            // "Cinematic"
  filmStock: string | null;        // "Kodak Portra 400"
  mood: string | null;             // "Dramatic"
  aspectRatio: AspectRatio;        // "16:9"
}

export interface TechnicalState {
  seed: number | null;
  midjourneyVersion: string;       // "6.0"
  runwayMode: string;              // "gen-3-alpha"
}

export interface MasterState {
  subject: SubjectState;
  camera: CameraState;
  environment: EnvironmentState;
  aesthetics: AestheticsState;
  technical: TechnicalState;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

export const defaultMasterState: MasterState = {
  subject: {
    main: '',
    action: null,
    modifiers: [],
  },
  camera: {
    angle: null,
    lens: null,
    movement: null,
    intensity: null,
  },
  environment: {
    setting: null,
    lighting: null,
    weather: null,
  },
  aesthetics: {
    style: null,
    filmStock: null,
    mood: null,
    aspectRatio: '16:9',
  },
  technical: {
    seed: null,
    midjourneyVersion: '6.0',
    runwayMode: 'gen-3-alpha',
  },
};
```

### 1.2 Polymorphic Card Structure

Each card now carries platform-specific values:

```typescript
// src/types/arsenal-card.ts

export interface PolymorphicCardValues {
  midjourney: string | null;       // "Low Angle" or null if ignored
  dalle: string | null;            // "a Low Angle" (with article)
  runway: string | null;           // "Low Angle" (for brackets)
  veo: string | null;              // "Low Angle" (for slots)
  flux: string | null;             // "Low Angle"
  luma: string | null;             // "Low Angle"
  sora: string | null;             // Future-proofing
  pika: string | null;
  kling: string | null;
  ideogram: string | null;
  leonardo: string | null;
  stable: string | null;
}

export interface PolymorphicCard {
  id: string;
  category: CardCategory;
  label: string;                   // Display name in UI
  stateKey: string;                // Which state key this updates (e.g., "camera.angle")
  description: string;
  icon?: string;
  
  // Platform-specific output values
  values: PolymorphicCardValues;
  
  // Special behaviors
  behaviors: {
    ignoredPlatforms: PlatformId[];     // Platforms where this card is stripped
    transformations: Record<PlatformId, CardTransformation>;
  };
  
  // For user-created cards
  isCustom?: boolean;
  userId?: string;
}

export interface CardTransformation {
  prefix?: string;      // "Smooth " for Luma movement
  suffix?: string;      // " lighting" for some platforms
  wrapper?: string;     // "[{value}]" for Runway brackets
}
```

### 1.3 Updated Database Schema

```sql
-- Add to existing migration or create new one

-- Enhanced custom_cards table with polymorphic values
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_midjourney TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_dalle TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_runway TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_veo TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_flux TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_luma TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_sora TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_pika TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_kling TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_ideogram TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_leonardo TEXT;
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS values_stable TEXT;

-- State key mapping (which part of MasterState this card updates)
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS state_key TEXT NOT NULL DEFAULT 'camera.angle';

-- Behaviors JSON
ALTER TABLE custom_cards ADD COLUMN IF NOT EXISTS behaviors JSONB DEFAULT '{}';

-- Update prompts table to store MasterState instead of flat fields
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS master_state JSONB;

-- Migrate existing data (run once)
UPDATE prompts SET master_state = jsonb_build_object(
  'subject', jsonb_build_object('main', COALESCE(subject, ''), 'action', null, 'modifiers', '[]'::jsonb),
  'camera', jsonb_build_object('angle', angle, 'lens', lens, 'movement', movement, 'intensity', null),
  'environment', jsonb_build_object('setting', null, 'lighting', lighting, 'weather', null),
  'aesthetics', jsonb_build_object('style', style, 'filmStock', film_stock, 'mood', null, 'aspectRatio', aspect_ratio)
) WHERE master_state IS NULL;
```

---

## Phase 2: Translation Engine Architecture

### 2.1 Adapter Interface

```typescript
// src/lib/translation-engine/types.ts

export interface TranslationAdapter {
  platformId: PlatformId;
  platformName: string;
  platformType: 'image' | 'video';
  
  // Core translation function
  translate(state: MasterState): string;
  
  // Validation
  validate(state: MasterState): ValidationResult;
  
  // Platform-specific constraints
  constraints: {
    supportsMovement: boolean;
    supportsFilmStock: boolean;
    maxPromptLength: number;
    requiresBrackets: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];        // Non-blocking issues
  errors: string[];          // Blocking issues
}
```

### 2.2 Adapter Implementations

```typescript
// src/lib/translation-engine/adapters/midjourney.ts

import { TranslationAdapter, MasterState } from '../types';

export const midjourneyAdapter: TranslationAdapter = {
  platformId: 'midjourney',
  platformName: 'Midjourney v6',
  platformType: 'image',
  
  constraints: {
    supportsMovement: false,    // CRITICAL: Movement is ignored
    supportsFilmStock: true,
    maxPromptLength: 6000,
    requiresBrackets: false,
  },
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // 1. Subject (required)
    const subject = this.buildSubjectString(state.subject);
    if (subject) parts.push(subject);
    
    // 2. Camera angle (optional)
    if (state.camera.angle) {
      parts.push(state.camera.angle);
    }
    
    // 3. Lens (optional)
    if (state.camera.lens) {
      parts.push(state.camera.lens);
    }
    
    // 4. Lighting (optional)
    if (state.environment.lighting) {
      parts.push(state.environment.lighting);
    }
    
    // 5. Style (optional)
    if (state.aesthetics.style) {
      parts.push(state.aesthetics.style);
    }
    
    // 6. Film stock (optional)
    if (state.aesthetics.filmStock) {
      parts.push(`shot on ${state.aesthetics.filmStock}`);
    }
    
    // NOTE: state.camera.movement is INTENTIONALLY IGNORED
    // Including "Push In" in Midjourney causes literal interpretation
    
    // Build base prompt
    let prompt = parts.join(', ');
    
    // Append parameters (must be at end)
    const aspectRatio = this.mapAspectRatio(state.aesthetics.aspectRatio);
    prompt += ` --ar ${aspectRatio} --v ${state.technical.midjourneyVersion || '6.0'} --style raw`;
    
    return prompt;
  },
  
  buildSubjectString(subject: SubjectState): string {
    let str = subject.main;
    if (subject.action) {
      str += ` ${subject.action}`;
    }
    if (subject.modifiers.length > 0) {
      str += `, ${subject.modifiers.join(', ')}`;
    }
    return str;
  },
  
  mapAspectRatio(ratio: AspectRatio): string {
    const map = {
      '16:9': '16:9',
      '9:16': '9:16',
      '1:1': '1:1',
      '21:9': '21:9',
    };
    return map[ratio] || '16:9';
  },
  
  validate(state: MasterState): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    if (!state.subject.main) {
      errors.push('Subject is required');
    }
    
    if (state.camera.movement) {
      warnings.push('Camera movement will be ignored for Midjourney (static images only)');
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  },
};
```

```typescript
// src/lib/translation-engine/adapters/runway.ts

export const runwayAdapter: TranslationAdapter = {
  platformId: 'runway',
  platformName: 'Runway Gen-3',
  platformType: 'video',
  
  constraints: {
    supportsMovement: true,
    supportsFilmStock: true,
    maxPromptLength: 2000,
    requiresBrackets: true,   // Movement must be in [brackets]
  },
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // 1. Movement bracket (MUST be first for Gen-3)
    if (state.camera.movement) {
      const intensity = state.camera.intensity ? `${state.camera.intensity} ` : '';
      parts.push(`[${intensity}${state.camera.movement}]:`);
    }
    
    // 2. Camera angle + subject
    let sceneDesc = '';
    if (state.camera.angle) {
      sceneDesc += `${state.camera.angle} shot of `;
    }
    sceneDesc += this.buildSubjectString(state.subject);
    parts.push(sceneDesc + '.');
    
    // 3. Atmosphere (lighting + style)
    const atmosphere: string[] = [];
    if (state.environment.lighting) {
      atmosphere.push(state.environment.lighting);
    }
    if (state.aesthetics.style) {
      atmosphere.push(state.aesthetics.style);
    }
    if (atmosphere.length > 0) {
      parts.push(atmosphere.join(' and ') + '.');
    }
    
    // 4. Film stock as color grade
    if (state.aesthetics.filmStock) {
      parts.push(`${state.aesthetics.filmStock} color grade.`);
    }
    
    return parts.join(' ');
  },
  
  // ... validation, helpers
};
```

```typescript
// src/lib/translation-engine/adapters/dalle.ts

export const dalleAdapter: TranslationAdapter = {
  platformId: 'dalle',
  platformName: 'DALL-E 3',
  platformType: 'image',
  
  constraints: {
    supportsMovement: false,    // Static images
    supportsFilmStock: true,
    maxPromptLength: 4000,
    requiresBrackets: false,
  },
  
  translate(state: MasterState): string {
    const sentences: string[] = [];
    
    // Sentence 1: Core request (imperative)
    const style = state.aesthetics.style || 'cinematic';
    const subject = this.buildSubjectString(state.subject);
    sentences.push(`Create a ${style} image of ${subject}.`);
    
    // Sentence 2: Composition (if angle exists)
    if (state.camera.angle) {
      sentences.push(`The shot should be a ${state.camera.angle} to create dramatic tension.`);
    }
    
    // Sentence 3: Technical aesthetic
    const technicalParts: string[] = [];
    if (state.camera.lens) {
      technicalParts.push(state.camera.lens);
    }
    if (state.aesthetics.filmStock) {
      technicalParts.push(`the aesthetic of ${state.aesthetics.filmStock}`);
    }
    if (technicalParts.length > 0) {
      sentences.push(`Emulate ${technicalParts.join(' with ')}.`);
    }
    
    // Sentence 4: Lighting (if exists)
    if (state.environment.lighting) {
      sentences.push(`The lighting should be ${state.environment.lighting}.`);
    }
    
    // Sentence 5: Quality tags
    sentences.push('Ultra high quality, photorealistic, 8K resolution.');
    
    return sentences.join(' ');
  },
  
  // ... validation, helpers
};
```

```typescript
// src/lib/translation-engine/adapters/veo.ts

export const veoAdapter: TranslationAdapter = {
  platformId: 'veo',
  platformName: 'Google Veo',
  platformType: 'video',
  
  constraints: {
    supportsMovement: true,
    supportsFilmStock: true,
    maxPromptLength: 1500,
    requiresBrackets: false,
  },
  
  translate(state: MasterState): string {
    // Veo uses rigid slot-based structure
    const slots: string[] = [];
    
    // Slot 1: Cinematography
    const cinematography: string[] = [];
    if (state.camera.angle) cinematography.push(state.camera.angle);
    if (state.camera.movement) cinematography.push(state.camera.movement);
    if (cinematography.length > 0) {
      slots.push(`Cinematography: ${cinematography.join(', ')}.`);
    }
    
    // Slot 2: Subject
    const subject = this.buildSubjectString(state.subject);
    slots.push(`Subject: ${subject}.`);
    
    // Slot 3: Context
    const context: string[] = [];
    if (state.environment.lighting) context.push(state.environment.lighting);
    if (state.environment.setting) context.push(state.environment.setting);
    if (state.aesthetics.style) context.push(state.aesthetics.style);
    if (context.length > 0) {
      slots.push(`Context: ${context.join(', ')}.`);
    }
    
    // Slot 4: Technical (optional)
    if (state.camera.lens) {
      slots.push(`Technical: ${state.camera.lens}.`);
    }
    
    return slots.join(' ');
  },
  
  // ... validation, helpers
};
```

```typescript
// src/lib/translation-engine/adapters/luma.ts

export const lumaAdapter: TranslationAdapter = {
  platformId: 'luma',
  platformName: 'Luma Dream Machine',
  platformType: 'video',
  
  constraints: {
    supportsMovement: true,
    supportsFilmStock: true,
    maxPromptLength: 2000,
    requiresBrackets: false,   // Uses natural language for movement
  },
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // 1. Movement (naturalized, not bracketed)
    if (state.camera.movement) {
      const naturalizedMovement = this.naturalizeMovement(
        state.camera.movement,
        state.camera.intensity
      );
      parts.push(naturalizedMovement);
    }
    
    // 2. Angle + Subject
    let sceneDesc = '';
    if (state.camera.angle) {
      sceneDesc += `${state.camera.angle} shot of `;
    }
    sceneDesc += this.buildSubjectString(state.subject);
    parts.push(sceneDesc + '.');
    
    // 3. Atmosphere
    const atmosphere: string[] = [];
    if (state.environment.lighting) atmosphere.push(state.environment.lighting);
    if (state.aesthetics.style) atmosphere.push(state.aesthetics.style);
    if (atmosphere.length > 0) {
      parts.push(atmosphere.join(' and ') + '.');
    }
    
    return parts.join(' ');
  },
  
  // Luma prefers "Smooth push in" over "[Push In]"
  naturalizeMovement(movement: string, intensity: string | null): string {
    const intensityWord = intensity?.toLowerCase() || 'smooth';
    const movementLower = movement.toLowerCase();
    
    const naturalizations: Record<string, string> = {
      'push in': `${intensityWord} push in`,
      'pull out': `${intensityWord} pull out`,
      'dolly shot': `${intensityWord} dolly`,
      'crane shot': `${intensityWord} crane up`,
      'orbital shot': `${intensityWord} orbit around`,
      'whip pan': 'quick whip pan',
      'pan right': `${intensityWord} pan right`,
      'pan left': `${intensityWord} pan left`,
    };
    
    return naturalizations[movementLower] || `${intensityWord} ${movementLower}`;
  },
  
  // ... validation, helpers
};
```

```typescript
// src/lib/translation-engine/adapters/flux.ts

export const fluxAdapter: TranslationAdapter = {
  platformId: 'grok', // Grok uses Flux.1
  platformName: 'Grok (Flux.1)',
  platformType: 'image',
  
  constraints: {
    supportsMovement: false,
    supportsFilmStock: true,    // Strong EXIF bias
    maxPromptLength: 2000,
    requiresBrackets: false,
  },
  
  translate(state: MasterState): string {
    const sentences: string[] = [];
    
    // Sentence 1: Subject (caption style)
    sentences.push(this.buildSubjectString(state.subject) + '.');
    
    // Sentence 2: Angle
    if (state.camera.angle) {
      sentences.push(`Captured from a ${state.camera.angle}.`);
    }
    
    // Sentence 3: Style/Film Stock (EXIF-style)
    if (state.aesthetics.filmStock) {
      sentences.push(`Style of ${state.aesthetics.filmStock}.`);
    } else if (state.aesthetics.style) {
      sentences.push(`${state.aesthetics.style} style.`);
    }
    
    // Sentence 4: Lens (Flux responds well to lens specs)
    if (state.camera.lens) {
      sentences.push(`Shot with ${state.camera.lens}.`);
    }
    
    // Sentence 5: Lighting
    if (state.environment.lighting) {
      sentences.push(`Emphasis on ${state.environment.lighting}.`);
    }
    
    return sentences.join(' ');
  },
  
  // ... validation, helpers
};
```

### 2.3 Translation Engine Orchestrator

```typescript
// src/lib/translation-engine/index.ts

import { MasterState, PlatformId, TranslationAdapter } from './types';
import { midjourneyAdapter } from './adapters/midjourney';
import { dalleAdapter } from './adapters/dalle';
import { runwayAdapter } from './adapters/runway';
import { veoAdapter } from './adapters/veo';
import { lumaAdapter } from './adapters/luma';
import { fluxAdapter } from './adapters/flux';
// ... import other adapters

const adapters: Record<PlatformId, TranslationAdapter> = {
  midjourney: midjourneyAdapter,
  dalle: dalleAdapter,
  runway: runwayAdapter,
  veo: veoAdapter,
  luma: lumaAdapter,
  grok: fluxAdapter,
  // ... other adapters
};

export class TranslationEngine {
  /**
   * Translate MasterState to platform-specific prompt
   */
  static translate(state: MasterState, platform: PlatformId): string {
    const adapter = adapters[platform];
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platform}`);
    }
    return adapter.translate(state);
  }
  
  /**
   * Validate state for a specific platform
   */
  static validate(state: MasterState, platform: PlatformId): ValidationResult {
    const adapter = adapters[platform];
    if (!adapter) {
      return { isValid: false, warnings: [], errors: [`Unknown platform: ${platform}`] };
    }
    return adapter.validate(state);
  }
  
  /**
   * Get all translations at once (for caching/display)
   */
  static translateAll(state: MasterState): Record<PlatformId, string> {
    const result: Partial<Record<PlatformId, string>> = {};
    for (const [platformId, adapter] of Object.entries(adapters)) {
      result[platformId as PlatformId] = adapter.translate(state);
    }
    return result as Record<PlatformId, string>;
  }
  
  /**
   * Get platform constraints
   */
  static getConstraints(platform: PlatformId) {
    return adapters[platform]?.constraints;
  }
  
  /**
   * Check if platform supports a specific feature
   */
  static supportsFeature(platform: PlatformId, feature: keyof TranslationAdapter['constraints']): boolean {
    const constraints = adapters[platform]?.constraints;
    return constraints?.[feature] ?? false;
  }
}
```

---

## Phase 3: Card-to-State Mapping System

### 3.1 Polymorphic Arsenal Data

```typescript
// src/lib/arsenal/polymorphic-cards.ts

export const polymorphicArsenal: PolymorphicCard[] = [
  // ═══════════════════════════════════════════════════════════════
  // CAMERA ANGLES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'low-angle',
    category: 'angle',
    label: 'Low Angle',
    stateKey: 'camera.angle',
    description: 'Power & dominance',
    values: {
      midjourney: 'Low Angle',
      dalle: 'a Low Angle',        // Article for DALL-E
      runway: 'Low Angle',
      veo: 'Low Angle',
      flux: 'Low Angle',
      luma: 'Low Angle',
      sora: 'Low Angle',
      pika: 'low angle',
      kling: 'Low Angle',
      ideogram: 'low angle shot',
      leonardo: 'Low Angle',
      stable: 'Low Angle',
    },
    behaviors: {
      ignoredPlatforms: [],
      transformations: {},
    },
  },
  {
    id: 'high-angle',
    category: 'angle',
    label: 'High Angle',
    stateKey: 'camera.angle',
    description: 'Vulnerability & scope',
    values: {
      midjourney: 'High Angle',
      dalle: 'a High Angle',
      runway: 'High Angle',
      veo: 'High Angle',
      flux: 'High Angle',
      luma: 'High Angle',
      sora: 'High Angle',
      pika: 'high angle',
      kling: 'High Angle',
      ideogram: 'high angle shot',
      leonardo: 'High Angle',
      stable: 'High Angle',
    },
    behaviors: {
      ignoredPlatforms: [],
      transformations: {},
    },
  },
  // ... more angles
  
  // ═══════════════════════════════════════════════════════════════
  // CAMERA MOVEMENT (Video-specific handling)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'push-in',
    category: 'movement',
    label: 'Push In',
    stateKey: 'camera.movement',
    description: 'Building intensity',
    values: {
      midjourney: null,            // IGNORED - causes literal interpretation
      dalle: null,                 // IGNORED - static images
      runway: 'Push In',           // Wrapped in brackets by adapter
      veo: 'Push In',
      flux: null,                  // IGNORED - static images
      luma: 'push in',             // Naturalized by adapter
      sora: 'Push In',
      pika: 'push in',
      kling: 'Push In',
      ideogram: null,
      leonardo: null,
      stable: null,
    },
    behaviors: {
      ignoredPlatforms: ['midjourney', 'dalle', 'flux', 'ideogram', 'leonardo', 'stable'],
      transformations: {
        runway: { wrapper: '[{value}]:' },
        luma: { prefix: 'Smooth ' },
      },
    },
  },
  {
    id: 'dolly-shot',
    category: 'movement',
    label: 'Dolly Shot',
    stateKey: 'camera.movement',
    description: 'Smooth tracking',
    values: {
      midjourney: null,
      dalle: null,
      runway: 'Dolly',
      veo: 'Dolly Shot',
      flux: null,
      luma: 'dolly',
      sora: 'Dolly Shot',
      pika: 'dolly shot',
      kling: 'Dolly Shot',
      ideogram: null,
      leonardo: null,
      stable: null,
    },
    behaviors: {
      ignoredPlatforms: ['midjourney', 'dalle', 'flux', 'ideogram', 'leonardo', 'stable'],
      transformations: {
        runway: { wrapper: '[{value}]:' },
        luma: { prefix: 'Smooth ' },
      },
    },
  },
  // ... more movements
  
  // ═══════════════════════════════════════════════════════════════
  // LENSES
  // ═══════════════════════════════════════════════════════════════
  {
    id: '35mm',
    category: 'lens',
    label: '35mm',
    stateKey: 'camera.lens',
    description: 'Cinematic standard',
    values: {
      midjourney: '35mm',
      dalle: '35mm lens',
      runway: null,                // Often ignored in video
      veo: null,
      flux: '35mm',
      luma: null,
      sora: '35mm lens',
      pika: null,
      kling: null,
      ideogram: '35mm lens',
      leonardo: '35mm',
      stable: '35mm',
    },
    behaviors: {
      ignoredPlatforms: ['runway', 'veo', 'luma', 'pika', 'kling'],
      transformations: {},
    },
  },
  // ... more lenses
  
  // ═══════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'golden-hour',
    category: 'lighting',
    label: 'Golden Hour',
    stateKey: 'environment.lighting',
    description: 'Warm magic',
    values: {
      midjourney: 'Golden Hour',
      dalle: 'Golden Hour lighting',
      runway: 'Golden Hour light',
      veo: 'Golden Hour',
      flux: 'Golden Hour',
      luma: 'Golden Hour',
      sora: 'Golden Hour lighting',
      pika: 'golden hour',
      kling: 'Golden Hour',
      ideogram: 'golden hour lighting',
      leonardo: 'Golden Hour',
      stable: 'Golden Hour',
    },
    behaviors: {
      ignoredPlatforms: [],
      transformations: {},
    },
  },
  // ... more lighting
  
  // ═══════════════════════════════════════════════════════════════
  // FILM STOCKS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'kodak-portra-400',
    category: 'filmStock',
    label: 'Kodak Portra 400',
    stateKey: 'aesthetics.filmStock',
    description: 'Portrait beauty',
    values: {
      midjourney: 'Kodak Portra 400',
      dalle: 'the aesthetic of Kodak Portra 400',
      runway: 'Kodak Portra 400',
      veo: 'Kodak Portra 400 look',
      flux: 'Kodak Portra 400',       // Strong EXIF recognition
      luma: 'Kodak Portra 400',
      sora: 'Kodak Portra 400 color grade',
      pika: 'Portra 400',
      kling: 'Kodak Portra 400',
      ideogram: 'Kodak Portra 400 film',
      leonardo: 'Kodak Portra 400',
      stable: 'Kodak Portra 400',
    },
    behaviors: {
      ignoredPlatforms: [],
      transformations: {},
    },
  },
  // ... more film stocks
  
  // ═══════════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinematic',
    category: 'style',
    label: 'Cinematic',
    stateKey: 'aesthetics.style',
    description: 'Film production quality',
    values: {
      midjourney: 'Cinematic',
      dalle: 'cinematic',
      runway: 'Cinematic style',
      veo: 'Cinematic',
      flux: 'Cinematic',
      luma: 'Cinematic',
      sora: 'Cinematic',
      pika: 'cinematic',
      kling: 'Cinematic',
      ideogram: 'cinematic photography',
      leonardo: 'Cinematic',
      stable: '(Cinematic:1.2)',      // SD weighted syntax
    },
    behaviors: {
      ignoredPlatforms: [],
      transformations: {
        stable: { wrapper: '({value}:1.2)' },
      },
    },
  },
  // ... more styles
];
```

### 3.2 Card Selection Logic

```typescript
// src/lib/arsenal/card-selector.ts

import { MasterState, PolymorphicCard, PlatformId } from '../types';

export class CardSelector {
  /**
   * Apply a card selection to the MasterState
   */
  static applyCard(state: MasterState, card: PolymorphicCard): MasterState {
    const newState = JSON.parse(JSON.stringify(state)); // Deep clone
    
    // Parse the stateKey (e.g., "camera.angle" -> ["camera", "angle"])
    const keys = card.stateKey.split('.');
    
    // Navigate to parent and set value
    let current: any = newState;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const finalKey = keys[keys.length - 1];
    
    // Toggle behavior: if same value, clear it
    if (current[finalKey] === card.label) {
      current[finalKey] = null;
    } else {
      current[finalKey] = card.label;
    }
    
    return newState;
  }
  
  /**
   * Get the platform-specific value for a card
   */
  static getCardValue(card: PolymorphicCard, platform: PlatformId): string | null {
    // Check if ignored for this platform
    if (card.behaviors.ignoredPlatforms.includes(platform)) {
      return null;
    }
    
    // Get base value
    let value = card.values[platform];
    if (!value) return null;
    
    // Apply transformations if any
    const transform = card.behaviors.transformations[platform];
    if (transform) {
      if (transform.prefix) {
        value = transform.prefix + value;
      }
      if (transform.suffix) {
        value = value + transform.suffix;
      }
      if (transform.wrapper) {
        value = transform.wrapper.replace('{value}', value);
      }
    }
    
    return value;
  }
  
  /**
   * Check if a card is active in the current state
   */
  static isCardActive(state: MasterState, card: PolymorphicCard): boolean {
    const keys = card.stateKey.split('.');
    let current: any = state;
    for (const key of keys) {
      current = current?.[key];
    }
    return current === card.label;
  }
}
```

---

## Phase 4: Cipher Animation System

### 4.1 Scramble Hook

```typescript
// src/hooks/useScramble.ts

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrambleOptions {
  text: string;
  speed?: number;           // ms per character
  tick?: number;            // scramble iterations per character
  step?: number;            // characters revealed per tick
  scramble?: number;        // randomness (0-1)
  seed?: number;
  overflow?: boolean;
  playOnMount?: boolean;
  onComplete?: () => void;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω█▓▒░╔╗╚╝║═';

export function useScramble({
  text,
  speed = 50,
  tick = 3,
  step = 1,
  scramble = 1,
  playOnMount = true,
  onComplete,
}: UseScrambleOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const indexRef = useRef(0);
  const tickRef = useRef(0);

  const getRandomChar = useCallback(() => {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }, []);

  const scrambleText = useCallback((revealed: number, total: string) => {
    let result = '';
    for (let i = 0; i < total.length; i++) {
      if (i < revealed) {
        result += total[i];
      } else if (Math.random() < scramble) {
        result += getRandomChar();
      } else {
        result += total[i];
      }
    }
    return result;
  }, [scramble, getRandomChar]);

  const animate = useCallback(() => {
    if (indexRef.current >= text.length) {
      setDisplayText(text);
      setIsAnimating(false);
      onComplete?.();
      return;
    }

    tickRef.current++;
    
    if (tickRef.current >= tick) {
      tickRef.current = 0;
      indexRef.current += step;
    }

    setDisplayText(scrambleText(indexRef.current, text));
    
    frameRef.current = window.setTimeout(() => {
      requestAnimationFrame(animate);
    }, speed);
  }, [text, speed, tick, step, scrambleText, onComplete]);

  const play = useCallback(() => {
    indexRef.current = 0;
    tickRef.current = 0;
    setIsAnimating(true);
    animate();
  }, [animate]);

  const stop = useCallback(() => {
    if (frameRef.current) {
      clearTimeout(frameRef.current);
    }
    setDisplayText(text);
    setIsAnimating(false);
  }, [text]);

  // Play on mount or text change
  useEffect(() => {
    if (playOnMount) {
      play();
    } else {
      setDisplayText(text);
    }

    return () => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
      }
    };
  }, [text, playOnMount, play]);

  return {
    displayText,
    isAnimating,
    play,
    stop,
  };
}
```

### 4.2 Animated Output Component

```typescript
// src/components/armory/AnimatedOutput.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useScramble } from '@/hooks/useScramble';
import { PlatformId } from '@/types';
import { platforms } from '@/lib/platforms';

interface AnimatedOutputProps {
  prompt: string;
  platform: PlatformId;
  onCopy: () => void;
}

export function AnimatedOutput({ prompt, platform, onCopy }: AnimatedOutputProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevPlatformRef = useRef<PlatformId>(platform);
  
  const currentPlatform = platforms[platform];
  
  // Trigger scramble animation when platform changes
  const shouldAnimate = prevPlatformRef.current !== platform;
  
  const { displayText, isAnimating, play } = useScramble({
    text: prompt,
    speed: 30,
    tick: 2,
    step: 2,
    scramble: 0.8,
    playOnMount: shouldAnimate,
    onComplete: () => setIsLocked(false),
  });
  
  useEffect(() => {
    if (prevPlatformRef.current !== platform) {
      setIsLocked(true);
      play();
      prevPlatformRef.current = platform;
    }
  }, [platform, play]);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-white/30 ml-3">
            OUTPUT — {currentPlatform.name}
          </span>
        </div>
        
        {isAnimating && (
          <div className="flex items-center gap-2 text-xs" style={{ color: currentPlatform.color }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentPlatform.color }} />
            TRANSLATING...
          </div>
        )}
      </div>
      
      {/* Prompt Display */}
      <div 
        className="p-6 font-mono text-sm leading-relaxed min-h-[120px]"
        style={{
          color: isAnimating ? currentPlatform.color : 'rgba(255,255,255,0.8)',
          opacity: isLocked ? 0.7 : 1,
        }}
      >
        {displayText || <span className="text-white/30 italic">Your generated prompt will appear here...</span>}
      </div>
      
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.01]">
        <div className="text-xs text-white/30">
          {prompt.length} characters
        </div>
        
        <button
          onClick={handleCopy}
          disabled={isAnimating || !prompt}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: `${currentPlatform.color}20`,
            color: currentPlatform.color,
            borderColor: `${currentPlatform.color}40`,
          }}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy for {currentPlatform.shortName}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## Phase 5: Updated Store Architecture

### 5.1 Enhanced Armory Store

```typescript
// src/stores/armory-store.ts (Updated)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  MasterState, 
  defaultMasterState, 
  PlatformId, 
  PolymorphicCard 
} from '@/types';
import { TranslationEngine } from '@/lib/translation-engine';
import { CardSelector } from '@/lib/arsenal/card-selector';

interface ArmoryStore {
  // Master State (the source of truth)
  masterState: MasterState;
  setMasterState: (state: Partial<MasterState>) => void;
  updateMasterState: (path: string, value: any) => void;
  resetMasterState: () => void;
  
  // Card Selection
  applyCard: (card: PolymorphicCard) => void;
  isCardActive: (card: PolymorphicCard) => boolean;
  
  // Platform
  targetPlatform: PlatformId;
  setTargetPlatform: (platform: PlatformId) => void;
  
  // Generated Prompts (cached)
  generatedPrompts: Record<PlatformId, string>;
  regeneratePrompts: () => void;
  getCurrentPrompt: () => string;
  
  // Validation
  validationWarnings: string[];
  validationErrors: string[];
  
  // UI State
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  showPresets: boolean;
  setShowPresets: (show: boolean) => void;
  activePreset: string | null;
  setActivePreset: (id: string | null) => void;
  platformFilter: 'all' | 'image' | 'video';
  setPlatformFilter: (filter: 'all' | 'image' | 'video') => void;
  
  // Animation State
  isTranslating: boolean;
  setIsTranslating: (value: boolean) => void;
  
  // Generation State
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const useArmoryStore = create<ArmoryStore>()(
  persist(
    (set, get) => ({
      // Master State
      masterState: defaultMasterState,
      
      setMasterState: (newState) => {
        set((state) => ({
          masterState: { ...state.masterState, ...newState },
          activePreset: null,
        }));
        get().regeneratePrompts();
      },
      
      updateMasterState: (path, value) => {
        const keys = path.split('.');
        set((state) => {
          const newMasterState = JSON.parse(JSON.stringify(state.masterState));
          let current = newMasterState;
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          return { masterState: newMasterState, activePreset: null };
        });
        get().regeneratePrompts();
      },
      
      resetMasterState: () => {
        set({ masterState: defaultMasterState, activePreset: null });
        get().regeneratePrompts();
      },
      
      // Card Selection
      applyCard: (card) => {
        const newState = CardSelector.applyCard(get().masterState, card);
        set({ masterState: newState, activePreset: null });
        get().regeneratePrompts();
      },
      
      isCardActive: (card) => {
        return CardSelector.isCardActive(get().masterState, card);
      },
      
      // Platform
      targetPlatform: 'midjourney',
      setTargetPlatform: (platform) => {
        set({ targetPlatform: platform, isTranslating: true });
        // Animation will set isTranslating back to false
      },
      
      // Generated Prompts
      generatedPrompts: {} as Record<PlatformId, string>,
      
      regeneratePrompts: () => {
        const { masterState, targetPlatform } = get();
        const prompts = TranslationEngine.translateAll(masterState);
        const validation = TranslationEngine.validate(masterState, targetPlatform);
        
        set({
          generatedPrompts: prompts,
          validationWarnings: validation.warnings,
          validationErrors: validation.errors,
        });
      },
      
      getCurrentPrompt: () => {
        const { generatedPrompts, targetPlatform } = get();
        return generatedPrompts[targetPlatform] || '';
      },
      
      // Validation
      validationWarnings: [],
      validationErrors: [],
      
      // UI State
      activeCategory: 'camera',
      setActiveCategory: (category) => set({ activeCategory: category }),
      showPresets: false,
      setShowPresets: (show) => set({ showPresets: show }),
      activePreset: null,
      setActivePreset: (id) => set({ activePreset: id }),
      platformFilter: 'all',
      setPlatformFilter: (filter) => set({ platformFilter: filter }),
      
      // Animation State
      isTranslating: false,
      setIsTranslating: (value) => set({ isTranslating: value }),
      
      // Generation State
      isGenerating: false,
      setIsGenerating: (value) => set({ isGenerating: value }),
    }),
    {
      name: 'prompt-armory-store',
      partialize: (state) => ({
        targetPlatform: state.targetPlatform,
        platformFilter: state.platformFilter,
        masterState: state.masterState,
      }),
    }
  )
);
```

---

## Phase 6: Implementation Roadmap

### Week 1: Foundation Refactor

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Implement `MasterState` types | `src/types/master-state.ts` |
| 1 | Implement `PolymorphicCard` types | `src/types/arsenal-card.ts` |
| 2 | Create Translation Engine base | `src/lib/translation-engine/types.ts` |
| 2 | Implement Midjourney adapter | `src/lib/translation-engine/adapters/midjourney.ts` |
| 3 | Implement DALL-E 3 adapter | `adapters/dalle.ts` |
| 3 | Implement Runway Gen-3 adapter | `adapters/runway.ts` |
| 4 | Implement Google Veo adapter | `adapters/veo.ts` |
| 4 | Implement Luma adapter | `adapters/luma.ts` |
| 5 | Implement Flux.1 adapter | `adapters/flux.ts` |
| 5 | Implement remaining adapters | `adapters/*.ts` |

### Week 2: Arsenal System

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create polymorphic card data | `src/lib/arsenal/polymorphic-cards.ts` |
| 1 | Implement CardSelector class | `src/lib/arsenal/card-selector.ts` |
| 2 | Update database migration | `supabase/migrations/002_polymorphic_cards.sql` |
| 2 | Update custom cards hook | `src/hooks/useCustomCards.ts` |
| 3 | Create useArsenal hook (merge default + custom) | `src/hooks/useArsenal.ts` |
| 3 | Update Zustand store | `src/stores/armory-store.ts` |
| 4 | Build polymorphic card editor UI | `src/components/custom-cards/PolymorphicCardEditor.tsx` |
| 5 | Test card → state → prompt flow | Integration tests |

### Week 3: UI & Animation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Implement useScramble hook | `src/hooks/useScramble.ts` |
| 1 | Build AnimatedOutput component | `src/components/armory/AnimatedOutput.tsx` |
| 2 | Update PlatformSelector with animation trigger | `src/components/armory/PlatformSelector.tsx` |
| 2 | Add validation warnings UI | `src/components/armory/ValidationWarnings.tsx` |
| 3 | Build subject input with modifiers | `src/components/armory/SubjectInput.tsx` |
| 3 | Update card grid with polymorphic display | `src/components/armory/CardGrid.tsx` |
| 4 | Integrate all components | `src/components/armory/PromptArmory.tsx` |
| 5 | Polish animations and transitions | CSS + component refinement |

### Week 4: Integration & Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Generate "Golden Set" prompts | Test fixtures |
| 1 | Test Midjourney outputs | Validation report |
| 2 | Test DALL-E 3 outputs | Validation report |
| 2 | Test Runway Gen-3 outputs | Validation report |
| 3 | Test remaining platforms | Validation report |
| 3 | Fix adapter issues based on testing | Bug fixes |
| 4 | Performance optimization | Memoization, debouncing |
| 5 | Final integration testing | QA sign-off |

### Week 5: SaaS Integration

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Wire up save to Library | Database integration |
| 1 | Implement load from Library | State restoration |
| 2 | Add generation history | Backend + UI |
| 2 | Implement usage limits | Subscription enforcement |
| 3 | Add Notes attachment | Per-prompt notes |
| 3 | Polish settings pages | UI completion |
| 4 | Deploy to staging | Vercel preview |
| 5 | Beta testing | User feedback |

---

## Phase 7: File Structure Summary

```
src/
├── types/
│   ├── index.ts
│   ├── master-state.ts          # MasterState interface
│   └── arsenal-card.ts          # PolymorphicCard interface
├── lib/
│   ├── translation-engine/
│   │   ├── index.ts             # TranslationEngine class
│   │   ├── types.ts             # Adapter interfaces
│   │   └── adapters/
│   │       ├── midjourney.ts
│   │       ├── dalle.ts
│   │       ├── runway.ts
│   │       ├── veo.ts
│   │       ├── luma.ts
│   │       ├── flux.ts
│   │       ├── sora.ts
│   │       ├── pika.ts
│   │       ├── kling.ts
│   │       ├── ideogram.ts
│   │       ├── leonardo.ts
│   │       └── stable.ts
│   ├── arsenal/
│   │   ├── polymorphic-cards.ts # Default card definitions
│   │   └── card-selector.ts     # Card → State logic
│   ├── platforms/
│   │   └── index.ts             # Platform metadata
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useArsenal.ts            # Merged default + custom cards
│   ├── useCustomCards.ts
│   ├── usePrompts.ts
│   ├── useNotes.ts
│   ├── usePresets.ts
│   ├── useGeneration.ts
│   └── useScramble.ts           # Cipher animation
├── stores/
│   ├── armory-store.ts          # Enhanced with MasterState
│   └── auth-store.ts
├── components/
│   ├── armory/
│   │   ├── PromptArmory.tsx     # Main component
│   │   ├── PlatformSelector.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── CardGrid.tsx
│   │   ├── SubjectInput.tsx     # With modifiers
│   │   ├── AnimatedOutput.tsx   # Cipher animation
│   │   ├── ValidationWarnings.tsx
│   │   └── PresetPanel.tsx
│   ├── custom-cards/
│   │   ├── PolymorphicCardEditor.tsx
│   │   ├── PlatformValueInputs.tsx
│   │   └── AddCardModal.tsx
│   └── ... (other components)
└── app/
    └── ... (routes)
```

---

## Summary

This architectural plan transforms the Prompt Armory from a simple text concatenation tool into a **sophisticated polymorphic translation engine**. The key innovations are:

1. **Master State Object** — User intent is captured once, translated many times
2. **Translation Adapters** — Platform-specific logic encapsulated in modular functions
3. **Polymorphic Cards** — Each card carries 11+ platform-specific output values
4. **Intelligent Filtering** — Movement cards automatically ignored for static image platforms
5. **Cipher Animation** — Visual feedback reinforces the "translation" metaphor
6. **Extensible Architecture** — Adding new platforms requires only a new adapter file

The implementation roadmap is structured for progressive delivery, with each week producing testable functionality. By the end of Week 5, you'll have a production-ready SaaS application that serves as the premier interface for cross-platform generative media.

**Ready for Cursor implementation.**
