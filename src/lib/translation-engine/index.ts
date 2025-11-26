// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ARMORY — Translation Engine
// Orchestrates platform-specific prompt generation
// ═══════════════════════════════════════════════════════════════════════════════

import { MasterState, buildSubjectString, AspectRatio } from '@/types/master-state';
import { PlatformId } from '@/types';
import { 
  TranslationAdapter, 
  BaseAdapter, 
  AdapterConstraints, 
  ValidationResult,
  AdapterRegistry 
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// MIDJOURNEY ADAPTER
// Token-based concatenation with parameter flags
// ═══════════════════════════════════════════════════════════════════════════════

class MidjourneyAdapter extends BaseAdapter {
  platformId: PlatformId = 'midjourney';
  platformName = 'Midjourney v6';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,      // CRITICAL: Movement causes literal interpretation
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 6000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // 1. Subject (required)
    const subject = this.buildSubject(state);
    if (subject) parts.push(subject);
    
    // 2. Camera angle
    if (state.camera.angle) parts.push(state.camera.angle);
    
    // 3. Lens
    if (state.camera.lens) parts.push(state.camera.lens);
    
    // 4. Lighting
    if (state.environment.lighting) parts.push(state.environment.lighting);
    
    // 5. Style
    if (state.aesthetics.style) parts.push(state.aesthetics.style);
    
    // 6. Film stock
    if (state.aesthetics.filmStock) {
      parts.push(`shot on ${state.aesthetics.filmStock}`);
    }
    
    // NOTE: state.camera.movement is INTENTIONALLY IGNORED
    // Including "Push In" in Midjourney causes literal interpretation
    
    // Build base prompt
    let prompt = parts.join(', ');
    
    // Append parameters (MUST be at end)
    const ar = this.mapAspectRatio(state.aesthetics.aspectRatio);
    prompt += ` --ar ${ar} --v ${state.technical.midjourneyVersion} --style ${state.technical.midjourneyStyle}`;
    
    return prompt;
  }
  
  mapAspectRatio(ratio: AspectRatio): string {
    return ratio; // Midjourney uses standard format
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DALL-E 3 ADAPTER
// Natural language with imperative sentences
// ═══════════════════════════════════════════════════════════════════════════════

class DalleAdapter extends BaseAdapter {
  platformId: PlatformId = 'dalle';
  platformName = 'DALL-E 3';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 4000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const sentences: string[] = [];
    
    // Sentence 1: Core request (imperative)
    const style = state.aesthetics.style || 'cinematic';
    const subject = this.buildSubject(state);
    sentences.push(`Create a ${style} image of ${subject || '[your subject]'}.`);
    
    // Sentence 2: Composition (if angle exists)
    if (state.camera.angle) {
      sentences.push(`The shot should be a ${state.camera.angle} to create dramatic tension.`);
    }
    
    // Sentence 3: Technical aesthetic
    const technicalParts: string[] = [];
    if (state.camera.lens) {
      technicalParts.push(`a ${state.camera.lens}`);
    }
    if (state.aesthetics.filmStock) {
      technicalParts.push(`the aesthetic of ${state.aesthetics.filmStock}`);
    }
    if (technicalParts.length > 0) {
      sentences.push(`Emulate ${technicalParts.join(' with ')}.`);
    }
    
    // Sentence 4: Lighting
    if (state.environment.lighting) {
      sentences.push(`The lighting should be ${state.environment.lighting}.`);
    }
    
    // Sentence 5: Quality tags
    sentences.push('Ultra high quality, photorealistic, 8K resolution.');
    
    return sentences.join(' ');
  }
  
  mapAspectRatio(ratio: AspectRatio): string {
    // DALL-E uses specific size strings
    const map: Record<AspectRatio, string> = {
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '1:1': '1024x1024',
      '21:9': '1792x1024', // Closest approximation
    };
    return map[ratio] || '1792x1024';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUNWAY GEN-3 ADAPTER
// Bracketed movement syntax at the beginning
// ═══════════════════════════════════════════════════════════════════════════════

class RunwayAdapter extends BaseAdapter {
  platformId: PlatformId = 'runway';
  platformName = 'Runway Gen-3';
  platformType: 'image' | 'video' = 'video';
  
  constraints: AdapterConstraints = {
    supportsMovement: true,
    supportsFilmStock: true,
    supportsLens: false,          // Often ignored in video
    maxPromptLength: 2000,
    requiresBrackets: true,       // Movement MUST be in brackets
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
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
    sceneDesc += this.buildSubject(state) || '[your subject]';
    parts.push(sceneDesc + '.');
    
    // 3. Atmosphere (lighting + style)
    const atmosphere: string[] = [];
    if (state.environment.lighting) atmosphere.push(state.environment.lighting);
    if (state.aesthetics.style) atmosphere.push(state.aesthetics.style);
    if (atmosphere.length > 0) {
      parts.push(atmosphere.join(' and ') + '.');
    }
    
    // 4. Film stock as color grade
    if (state.aesthetics.filmStock) {
      parts.push(`${state.aesthetics.filmStock} color grade.`);
    }
    
    return parts.join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE VEO ADAPTER
// Rigid slot-based structure
// ═══════════════════════════════════════════════════════════════════════════════

class VeoAdapter extends BaseAdapter {
  platformId: PlatformId = 'veo';
  platformName = 'Google Veo';
  platformType: 'image' | 'video' = 'video';
  
  constraints: AdapterConstraints = {
    supportsMovement: true,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 1500,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const slots: string[] = [];
    
    // Slot 1: Cinematography
    const cinematography: string[] = [];
    if (state.camera.angle) cinematography.push(state.camera.angle);
    if (state.camera.movement) cinematography.push(state.camera.movement);
    if (cinematography.length > 0) {
      slots.push(`Cinematography: ${cinematography.join(', ')}.`);
    }
    
    // Slot 2: Subject
    const subject = this.buildSubject(state);
    slots.push(`Subject: ${subject || '[your subject]'}.`);
    
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
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLUX.1 (GROK) ADAPTER
// Caption-style with EXIF bias
// ═══════════════════════════════════════════════════════════════════════════════

class FluxAdapter extends BaseAdapter {
  platformId: PlatformId = 'grok';
  platformName = 'Grok (Flux.1)';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,
    supportsFilmStock: true,      // Strong EXIF bias
    supportsLens: true,           // Strong lens recognition
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9'],
  };
  
  translate(state: MasterState): string {
    const sentences: string[] = [];
    
    // Sentence 1: Subject (caption style)
    const subject = this.buildSubject(state);
    sentences.push((subject || '[your subject]') + '.');
    
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
    
    // Sentence 4: Lens
    if (state.camera.lens) {
      sentences.push(`Shot with ${state.camera.lens}.`);
    }
    
    // Sentence 5: Lighting
    if (state.environment.lighting) {
      sentences.push(`Emphasis on ${state.environment.lighting}.`);
    }
    
    return sentences.join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STABLE DIFFUSION ADAPTER
// Weighted token syntax
// ═══════════════════════════════════════════════════════════════════════════════

class StableDiffusionAdapter extends BaseAdapter {
  platformId: PlatformId = 'stable';
  platformName = 'Stable Diffusion';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // Subject with high weight
    const subject = this.buildSubject(state);
    if (subject) parts.push(`(${subject}:1.3)`);
    
    // Style with weight
    if (state.aesthetics.style) parts.push(`(${state.aesthetics.style}:1.2)`);
    
    // Camera angle
    if (state.camera.angle) parts.push(`(${state.camera.angle}:1.1)`);
    
    // Lens
    if (state.camera.lens) parts.push(state.camera.lens);
    
    // Lighting with weight
    if (state.environment.lighting) parts.push(`(${state.environment.lighting}:1.2)`);
    
    // Film stock
    if (state.aesthetics.filmStock) parts.push(state.aesthetics.filmStock);
    
    // Quality tags
    parts.push('masterpiece', 'best quality', '8k uhd');
    
    return parts.join(', ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDEOGRAM ADAPTER
// Clean comma-separated with quality tags
// ═══════════════════════════════════════════════════════════════════════════════

class IdeogramAdapter extends BaseAdapter {
  platformId: PlatformId = 'ideogram';
  platformName = 'Ideogram 2.0';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // Subject
    const subject = this.buildSubject(state);
    if (subject) parts.push(subject);
    
    // Style
    if (state.aesthetics.style) {
      parts.push(`${state.aesthetics.style.toLowerCase()} photography`);
    }
    
    // Angle
    if (state.camera.angle) parts.push(state.camera.angle.toLowerCase());
    
    // Lens
    if (state.camera.lens) parts.push(state.camera.lens);
    
    // Lighting
    if (state.environment.lighting) {
      parts.push(`${state.environment.lighting.toLowerCase()} lighting`);
    }
    
    // Film stock
    if (state.aesthetics.filmStock) {
      parts.push(`${state.aesthetics.filmStock} aesthetic`);
    }
    
    // Quality
    parts.push('highly detailed', 'professional quality');
    
    return parts.join(', ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEONARDO ADAPTER
// Pipe-separated categories
// ═══════════════════════════════════════════════════════════════════════════════

class LeonardoAdapter extends BaseAdapter {
  platformId: PlatformId = 'leonardo';
  platformName = 'Leonardo AI';
  platformType: 'image' | 'video' = 'image';
  
  constraints: AdapterConstraints = {
    supportsMovement: false,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const sections: string[] = [];
    
    // Subject section
    const subject = this.buildSubject(state);
    sections.push(`[Subject]: ${subject || '[your subject]'}`);
    
    // Style section
    if (state.aesthetics.style) {
      sections.push(`[Style]: ${state.aesthetics.style}`);
    }
    
    // Camera section
    const camera: string[] = [];
    if (state.camera.angle) camera.push(state.camera.angle);
    if (state.camera.lens) camera.push(state.camera.lens);
    if (camera.length > 0) {
      sections.push(`[Camera]: ${camera.join(', ')}`);
    }
    
    // Lighting section
    if (state.environment.lighting) {
      sections.push(`[Lighting]: ${state.environment.lighting}`);
    }
    
    // Film section
    if (state.aesthetics.filmStock) {
      sections.push(`[Film]: ${state.aesthetics.filmStock}`);
    }
    
    return sections.join(' | ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORA ADAPTER
// Cinematic scene descriptions
// ═══════════════════════════════════════════════════════════════════════════════

class SoraAdapter extends BaseAdapter {
  platformId: PlatformId = 'sora';
  platformName = 'OpenAI Sora';
  platformType: 'image' | 'video' = 'video';
  
  constraints: AdapterConstraints = {
    supportsMovement: true,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // Opening
    const subject = this.buildSubject(state);
    parts.push(`A cinematic scene: ${subject || '[your subject]'}.`);
    
    // Camera
    const camera: string[] = [];
    if (state.camera.angle) camera.push(state.camera.angle);
    if (state.camera.movement) camera.push(state.camera.movement);
    if (camera.length > 0) {
      parts.push(`Camera: ${camera.join(' with ')}.`);
    }
    
    // Lens
    if (state.camera.lens) {
      parts.push(`Shot on ${state.camera.lens}.`);
    }
    
    // Lighting
    if (state.environment.lighting) {
      parts.push(`Lighting: ${state.environment.lighting}.`);
    }
    
    // Style
    if (state.aesthetics.style) {
      parts.push(`Style: ${state.aesthetics.style}.`);
    }
    
    // Film look
    if (state.aesthetics.filmStock) {
      parts.push(`Film look: ${state.aesthetics.filmStock}.`);
    }
    
    // Quality
    parts.push('High production value, cinematic quality.');
    
    return parts.join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIKA ADAPTER
// Motion-focused
// ═══════════════════════════════════════════════════════════════════════════════

class PikaAdapter extends BaseAdapter {
  platformId: PlatformId = 'pika';
  platformName = 'Pika Labs';
  platformType: 'image' | 'video' = 'video';
  
  constraints: AdapterConstraints = {
    supportsMovement: true,
    supportsFilmStock: false,
    supportsLens: false,
    maxPromptLength: 1500,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // Subject with movement
    const subject = this.buildSubject(state);
    const movement = state.camera.movement?.toLowerCase() || 'subtle motion';
    parts.push(`${subject || '[your subject]'} with ${movement}`);
    
    // Angle
    if (state.camera.angle) {
      parts.push(state.camera.angle.toLowerCase());
    }
    
    // Lighting
    if (state.environment.lighting) {
      parts.push(state.environment.lighting.toLowerCase());
    }
    
    // Style
    if (state.aesthetics.style) {
      parts.push(`${state.aesthetics.style.toLowerCase()} style`);
    }
    
    return parts.join(', ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KLING ADAPTER
// Scene/Motion/Angle breakdown
// ═══════════════════════════════════════════════════════════════════════════════

class KlingAdapter extends BaseAdapter {
  platformId: PlatformId = 'kling';
  platformName = 'Kling AI';
  platformType: 'image' | 'video' = 'video';
  
  constraints: AdapterConstraints = {
    supportsMovement: true,
    supportsFilmStock: true,
    supportsLens: true,
    maxPromptLength: 2000,
    requiresBrackets: false,
    supportsAspectRatio: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
  };
  
  translate(state: MasterState): string {
    const parts: string[] = [];
    
    // Scene
    const subject = this.buildSubject(state);
    parts.push(`Scene: ${subject || '[your subject]'}.`);
    
    // Motion
    if (state.camera.movement) {
      parts.push(`Motion: ${state.camera.movement}.`);
    }
    
    // Angle
    if (state.camera.angle) {
      parts.push(`Angle: ${state.camera.angle}.`);
    }
    
    // Light
    if (state.environment.lighting) {
      parts.push(`Light: ${state.environment.lighting}.`);
    }
    
    // Aesthetic
    if (state.aesthetics.style) {
      parts.push(`Aesthetic: ${state.aesthetics.style}.`);
    }
    
    // Lens
    if (state.camera.lens) {
      parts.push(`Lens: ${state.camera.lens}.`);
    }
    
    // Color
    if (state.aesthetics.filmStock) {
      parts.push(`Color: ${state.aesthetics.filmStock}.`);
    }
    
    return parts.join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const adapters: AdapterRegistry = {
  midjourney: new MidjourneyAdapter(),
  dalle: new DalleAdapter(),
  runway: new RunwayAdapter(),
  veo: new VeoAdapter(),
  grok: new FluxAdapter(),
  stable: new StableDiffusionAdapter(),
  ideogram: new IdeogramAdapter(),
  leonardo: new LeonardoAdapter(),
  sora: new SoraAdapter(),
  pika: new PikaAdapter(),
  kling: new KlingAdapter(),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION ENGINE
// Main API for prompt generation
// ═══════════════════════════════════════════════════════════════════════════════

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
      return { 
        isValid: false, 
        warnings: [], 
        errors: [`Unknown platform: ${platform}`] 
      };
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
  static getConstraints(platform: PlatformId): AdapterConstraints | null {
    return adapters[platform]?.constraints ?? null;
  }
  
  /**
   * Check if platform supports a specific feature
   */
  static supportsFeature(
    platform: PlatformId, 
    feature: keyof AdapterConstraints
  ): boolean {
    const constraints = adapters[platform]?.constraints;
    return constraints?.[feature] as boolean ?? false;
  }
  
  /**
   * Get adapter for a platform
   */
  static getAdapter(platform: PlatformId): TranslationAdapter | null {
    return adapters[platform] ?? null;
  }
  
  /**
   * Get all adapters
   */
  static getAllAdapters(): AdapterRegistry {
    return adapters;
  }
  
  /**
   * Get adapters by type (image or video)
   */
  static getAdaptersByType(type: 'image' | 'video'): TranslationAdapter[] {
    return Object.values(adapters).filter(a => a.platformType === type);
  }
}

// Export types
export type { TranslationAdapter, AdapterConstraints, ValidationResult };
