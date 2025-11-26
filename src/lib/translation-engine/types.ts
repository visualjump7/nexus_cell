// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ARMORY — Translation Engine Types
// Defines the adapter interface for platform-specific prompt generation
// ═══════════════════════════════════════════════════════════════════════════════

import { MasterState, buildSubjectString, AspectRatio } from '@/types/master-state';
import { PlatformId } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];        // Non-blocking issues (e.g., "Movement ignored for images")
  errors: string[];          // Blocking issues (e.g., "Subject is required")
}

// ─────────────────────────────────────────────────────────────────────────────────
// ADAPTER CONSTRAINTS
// Defines what each platform supports
// ─────────────────────────────────────────────────────────────────────────────────

export interface AdapterConstraints {
  supportsMovement: boolean;      // Can the platform use camera movement?
  supportsFilmStock: boolean;     // Does film stock affect output?
  supportsLens: boolean;          // Does lens specification affect output?
  maxPromptLength: number;        // Character limit
  requiresBrackets: boolean;      // Does movement need [brackets]?
  supportsAspectRatio: boolean;   // Can aspect ratio be specified?
  supportedAspectRatios: AspectRatio[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// TRANSLATION ADAPTER INTERFACE
// Each platform implements this interface
// ─────────────────────────────────────────────────────────────────────────────────

export interface TranslationAdapter {
  // Identity
  platformId: PlatformId;
  platformName: string;
  platformType: 'image' | 'video';
  
  // Constraints
  constraints: AdapterConstraints;
  
  /**
   * Transform MasterState into a platform-specific prompt string
   * This is the core function of each adapter
   */
  translate(state: MasterState): string;
  
  /**
   * Validate the state for this platform
   * Returns warnings (non-blocking) and errors (blocking)
   */
  validate(state: MasterState): ValidationResult;
  
  /**
   * Map aspect ratio to platform-specific format
   */
  mapAspectRatio(ratio: AspectRatio): string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BASE ADAPTER CLASS
// Provides common functionality for all adapters
// ─────────────────────────────────────────────────────────────────────────────────

export abstract class BaseAdapter implements TranslationAdapter {
  abstract platformId: PlatformId;
  abstract platformName: string;
  abstract platformType: 'image' | 'video';
  abstract constraints: AdapterConstraints;
  
  abstract translate(state: MasterState): string;
  
  /**
   * Build the subject portion of the prompt
   */
  protected buildSubject(state: MasterState): string {
    return buildSubjectString(state.subject);
  }
  
  /**
   * Default validation logic
   */
  validate(state: MasterState): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Subject is always required
    if (!state.subject.main) {
      errors.push('Subject is required');
    }
    
    // Warn about movement on image platforms
    if (!this.constraints.supportsMovement && state.camera.movement) {
      warnings.push(`Camera movement will be ignored for ${this.platformName} (static images only)`);
    }
    
    // Warn about lens if not supported
    if (!this.constraints.supportsLens && state.camera.lens) {
      warnings.push(`Lens specification may be ignored by ${this.platformName}`);
    }
    
    // Check prompt length (estimate)
    const prompt = this.translate(state);
    if (prompt.length > this.constraints.maxPromptLength) {
      warnings.push(`Prompt exceeds recommended length for ${this.platformName} (${prompt.length}/${this.constraints.maxPromptLength})`);
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }
  
  /**
   * Default aspect ratio mapping
   */
  mapAspectRatio(ratio: AspectRatio): string {
    return ratio;
  }
  
  /**
   * Helper: Join non-null values with a separator
   */
  protected joinParts(parts: (string | null | undefined)[], separator: string = ', '): string {
    return parts.filter(Boolean).join(separator);
  }
  
  /**
   * Helper: Wrap value if present
   */
  protected wrapIfPresent(value: string | null | undefined, prefix: string = '', suffix: string = ''): string {
    if (!value) return '';
    return `${prefix}${value}${suffix}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// ADAPTER REGISTRY TYPE
// ─────────────────────────────────────────────────────────────────────────────────

export type AdapterRegistry = Record<PlatformId, TranslationAdapter>;
