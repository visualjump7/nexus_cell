// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ARMORY — Master State Types
// The normalized JSON structure that serves as the "source of truth"
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// ASPECT RATIOS
// ─────────────────────────────────────────────────────────────────────────────────

export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

// ─────────────────────────────────────────────────────────────────────────────────
// SUBJECT STATE
// Captures what the image/video is about
// ─────────────────────────────────────────────────────────────────────────────────

export interface SubjectState {
  main: string;                    // "Cyberpunk Samurai"
  action: string | null;           // "drawing a katana"
  modifiers: string[];             // ["neon tattoos", "chrome armor"]
}

// ─────────────────────────────────────────────────────────────────────────────────
// CAMERA STATE
// Captures camera configuration
// ─────────────────────────────────────────────────────────────────────────────────

export interface CameraState {
  angle: string | null;            // "Low Angle", "High Angle", "Dutch Angle"
  lens: string | null;             // "35mm", "85mm", "Anamorphic"
  movement: string | null;         // "Push In", "Dolly Shot", "Orbit"
  intensity: string | null;        // "Fast", "Slow", "Smooth"
}

// ─────────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT STATE
// Captures scene environment
// ─────────────────────────────────────────────────────────────────────────────────

export interface EnvironmentState {
  setting: string | null;          // "Rainy Neo-Tokyo street"
  lighting: string | null;         // "Neon Volumetric", "Golden Hour"
  weather: string | null;          // "Heavy Rain", "Fog", "Snow"
}

// ─────────────────────────────────────────────────────────────────────────────────
// AESTHETICS STATE
// Captures visual style
// ─────────────────────────────────────────────────────────────────────────────────

export interface AestheticsState {
  style: string | null;            // "Cinematic", "Film Noir", "Anime"
  filmStock: string | null;        // "Kodak Portra 400", "CineStill 800T"
  mood: string | null;             // "Dramatic", "Serene", "Tense"
  aspectRatio: AspectRatio;        // "16:9", "9:16", "1:1", "21:9"
}

// ─────────────────────────────────────────────────────────────────────────────────
// TECHNICAL STATE
// Platform-specific technical parameters
// ─────────────────────────────────────────────────────────────────────────────────

export interface TechnicalState {
  seed: number | null;
  midjourneyVersion: string;       // "6.0"
  midjourneyStyle: string;         // "raw", "default"
  runwayMode: string;              // "gen-3-alpha"
}

// ─────────────────────────────────────────────────────────────────────────────────
// MASTER STATE
// The complete normalized state object
// ─────────────────────────────────────────────────────────────────────────────────

export interface MasterState {
  subject: SubjectState;
  camera: CameraState;
  environment: EnvironmentState;
  aesthetics: AestheticsState;
  technical: TechnicalState;
}

// ─────────────────────────────────────────────────────────────────────────────────
// DEFAULT STATE
// ─────────────────────────────────────────────────────────────────────────────────

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
    midjourneyStyle: 'raw',
    runwayMode: 'gen-3-alpha',
  },
};

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Build a complete subject string from SubjectState
 */
export function buildSubjectString(subject: SubjectState): string {
  if (!subject.main) return '';
  
  let str = subject.main;
  
  if (subject.action) {
    str += ` ${subject.action}`;
  }
  
  if (subject.modifiers.length > 0) {
    str += `, ${subject.modifiers.join(', ')}`;
  }
  
  return str;
}

/**
 * Get a nested value from MasterState using dot notation
 * @example getValue(state, 'camera.angle') => 'Low Angle'
 */
export function getStateValue(state: MasterState, path: string): any {
  const keys = path.split('.');
  let current: any = state;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Set a nested value in MasterState using dot notation
 * Returns a new state object (immutable)
 * @example setStateValue(state, 'camera.angle', 'Low Angle')
 */
export function setStateValue(state: MasterState, path: string, value: any): MasterState {
  const newState = JSON.parse(JSON.stringify(state)); // Deep clone
  const keys = path.split('.');
  
  let current: any = newState;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  
  return newState;
}

/**
 * Check if the state has any meaningful content
 */
export function isStateEmpty(state: MasterState): boolean {
  return (
    !state.subject.main &&
    !state.camera.angle &&
    !state.camera.lens &&
    !state.camera.movement &&
    !state.environment.lighting &&
    !state.aesthetics.style &&
    !state.aesthetics.filmStock
  );
}

/**
 * Count how many selections have been made
 */
export function countSelections(state: MasterState): number {
  let count = 0;
  
  if (state.subject.main) count++;
  if (state.subject.action) count++;
  count += state.subject.modifiers.length;
  if (state.camera.angle) count++;
  if (state.camera.lens) count++;
  if (state.camera.movement) count++;
  if (state.camera.intensity) count++;
  if (state.environment.setting) count++;
  if (state.environment.lighting) count++;
  if (state.environment.weather) count++;
  if (state.aesthetics.style) count++;
  if (state.aesthetics.filmStock) count++;
  if (state.aesthetics.mood) count++;
  
  return count;
}
