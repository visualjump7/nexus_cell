// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ARMORY — Polymorphic Arsenal Cards
// Each card contains platform-specific values for translation
// ═══════════════════════════════════════════════════════════════════════════════

import { PlatformId } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export type CardCategory = 'angle' | 'movement' | 'lens' | 'lighting' | 'filmStock' | 'style';

export interface PolymorphicCard {
  id: string;
  category: CardCategory;
  label: string;
  stateKey: string;
  description: string;
  icon?: string;
  values: Partial<Record<PlatformId, string | null>>;
  ignoredPlatforms: PlatformId[];
}

export interface CardCategoryMeta {
  id: CardCategory;
  label: string;
  icon: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// CATEGORY METADATA
// ─────────────────────────────────────────────────────────────────────────────────

export const categories: CardCategoryMeta[] = [
  { id: 'angle', label: 'Camera Angles', icon: '📐', description: 'Perspective and viewpoint' },
  { id: 'movement', label: 'Movement', icon: '🎬', description: 'Camera motion (video only)' },
  { id: 'lens', label: 'Lens & Optics', icon: '📷', description: 'Focal length and effects' },
  { id: 'lighting', label: 'Lighting', icon: '💡', description: 'Light quality and direction' },
  { id: 'filmStock', label: 'Film Stock', icon: '🎞️', description: 'Color science and grain' },
  { id: 'style', label: 'Visual Style', icon: '🎨', description: 'Aesthetic and mood' },
];

// ─────────────────────────────────────────────────────────────────────────────────
// IMAGE-ONLY PLATFORMS (movement cards ignored)
// ─────────────────────────────────────────────────────────────────────────────────

const IMAGE_PLATFORMS: PlatformId[] = ['midjourney', 'dalle', 'grok', 'stable', 'ideogram', 'leonardo'];

// VIDEO PLATFORMS (lens often ignored)
const VIDEO_PLATFORMS: PlatformId[] = ['runway', 'veo', 'luma', 'sora', 'pika', 'kling'];

// ─────────────────────────────────────────────────────────────────────────────────
// POLYMORPHIC CARDS DATA
// ─────────────────────────────────────────────────────────────────────────────────

export const polymorphicCards: PolymorphicCard[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // CAMERA ANGLES
  // ═══════════════════════════════════════════════════════════════════════════════
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
      luma: 'Low Angle',
      stable: 'Low Angle',
      sora: 'Low Angle',
      pika: 'low angle',
      kling: 'Low Angle',
      ideogram: 'low angle shot',
      leonardo: 'Low Angle',
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
      luma: 'High Angle',
      stable: 'High Angle',
      sora: 'High Angle',
      pika: 'high angle',
      kling: 'High Angle',
      ideogram: 'high angle shot',
      leonardo: 'High Angle',
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
      luma: 'Dutch Angle',
      stable: 'Dutch Angle',
      sora: 'Dutch Angle',
      pika: 'dutch angle',
      kling: 'Dutch Angle',
      ideogram: 'dutch angle shot',
      leonardo: 'Dutch Angle',
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
      luma: 'Eye Level',
      stable: 'Eye Level',
      sora: 'Eye Level',
      pika: 'eye level',
      kling: 'Eye Level',
      ideogram: 'eye level',
      leonardo: 'Eye Level',
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
      luma: "Bird's Eye",
      stable: "Bird's Eye View",
      sora: "Bird's Eye View",
      pika: "birds eye",
      kling: "Bird's Eye",
      ideogram: "bird's eye view",
      leonardo: "Bird's Eye View",
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
      luma: "Worm's Eye",
      stable: "Worm's Eye View",
      sora: "Worm's Eye View",
      pika: "worms eye",
      kling: "Worm's Eye",
      ideogram: "worm's eye view",
      leonardo: "Worm's Eye View",
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
      luma: 'Over Shoulder',
      stable: 'Over the Shoulder',
      sora: 'Over the Shoulder',
      pika: 'over shoulder',
      kling: 'Over Shoulder',
      ideogram: 'over the shoulder',
      leonardo: 'Over the Shoulder',
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
      luma: 'POV',
      stable: 'POV first person',
      sora: 'POV Shot',
      pika: 'pov',
      kling: 'POV',
      ideogram: 'first person pov',
      leonardo: 'POV Shot',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CAMERA MOVEMENT (Video Only)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'push-in',
    category: 'movement',
    label: 'Push In',
    stateKey: 'camera.movement',
    description: 'Building intensity',
    icon: '🎬',
    values: {
      runway: 'Push In',
      veo: 'Push In',
      luma: 'push in',
      sora: 'Push In',
      pika: 'push in',
      kling: 'Push In',
    },
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
  },
  {
    id: 'crane-down',
    category: 'movement',
    label: 'Crane Down',
    stateKey: 'camera.movement',
    description: 'Descending reveal',
    icon: '🎬',
    values: {
      runway: 'Crane Down',
      veo: 'Crane Shot Down',
      luma: 'crane down',
      sora: 'Crane Down',
      pika: 'crane down',
      kling: 'Crane Down',
    },
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
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
    ignoredPlatforms: IMAGE_PLATFORMS,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LENSES (Image platforms primarily)
  // ═══════════════════════════════════════════════════════════════════════════════
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
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
    ignoredPlatforms: VIDEO_PLATFORMS,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════════════════════
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
      sora: 'Golden Hour',
      pika: 'golden hour',
      kling: 'Golden Hour',
      ideogram: 'golden hour lighting',
      leonardo: 'Golden Hour',
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
      sora: 'Blue Hour',
      pika: 'blue hour',
      kling: 'Blue Hour',
      ideogram: 'blue hour lighting',
      leonardo: 'Blue Hour',
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
      sora: 'Neon Volumetric',
      pika: 'neon volumetric',
      kling: 'Neon Volumetric',
      ideogram: 'neon volumetric lighting',
      leonardo: 'Neon Volumetric',
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
      sora: 'Rembrandt lighting',
      pika: 'rembrandt lighting',
      kling: 'Rembrandt',
      ideogram: 'Rembrandt lighting',
      leonardo: 'Rembrandt lighting',
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
      sora: 'rim lighting',
      pika: 'rim light',
      kling: 'Rim Light',
      ideogram: 'rim lighting',
      leonardo: 'rim lighting',
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
      sora: 'harsh shadows',
      pika: 'harsh shadows',
      kling: 'Harsh Shadows',
      ideogram: 'harsh shadows',
      leonardo: 'harsh shadows',
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
      sora: 'soft diffused',
      pika: 'soft diffused',
      kling: 'Soft Diffused',
      ideogram: 'soft diffused lighting',
      leonardo: 'soft diffused lighting',
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
      sora: 'silhouette',
      pika: 'silhouette',
      kling: 'Silhouette',
      ideogram: 'silhouette',
      leonardo: 'silhouette',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILM STOCKS
  // ═══════════════════════════════════════════════════════════════════════════════
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
      sora: 'Kodak Portra 400',
      pika: 'Portra 400',
      kling: 'Kodak Portra 400',
      ideogram: 'Kodak Portra 400 film',
      leonardo: 'Kodak Portra 400',
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
      sora: 'CineStill 800T',
      pika: 'CineStill 800T',
      kling: 'CineStill 800T',
      ideogram: 'CineStill 800T film',
      leonardo: 'CineStill 800T',
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
      sora: 'Kodak Ektar 100',
      pika: 'Ektar 100',
      kling: 'Kodak Ektar 100',
      ideogram: 'Kodak Ektar 100 film',
      leonardo: 'Kodak Ektar 100',
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
      sora: 'Kodak Tri-X 400 B&W',
      pika: 'Tri-X B&W',
      kling: 'Kodak Tri-X 400',
      ideogram: 'Kodak Tri-X 400 black and white',
      leonardo: 'Kodak Tri-X 400',
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
      sora: 'Fuji Velvia 50',
      pika: 'Velvia 50',
      kling: 'Fuji Velvia 50',
      ideogram: 'Fuji Velvia 50 film',
      leonardo: 'Fuji Velvia 50',
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
      sora: 'Fuji Superia 400',
      pika: 'Superia 400',
      kling: 'Fuji Superia 400',
      ideogram: 'Fuji Superia 400 film',
      leonardo: 'Fuji Superia 400',
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
      sora: 'Kodak Vision3 500T',
      pika: 'Vision3 500T',
      kling: 'Kodak Vision3 500T',
      ideogram: 'Kodak Vision3 500T film',
      leonardo: 'Kodak Vision3 500T',
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
      sora: 'Ilford HP5 Plus B&W',
      pika: 'HP5 B&W',
      kling: 'Ilford HP5 Plus',
      ideogram: 'Ilford HP5 Plus black and white',
      leonardo: 'Ilford HP5 Plus',
    },
    ignoredPlatforms: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // VISUAL STYLES
  // ═══════════════════════════════════════════════════════════════════════════════
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
      sora: 'Cinematic',
      pika: 'cinematic',
      kling: 'Cinematic',
      ideogram: 'cinematic photography',
      leonardo: 'Cinematic',
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
      sora: 'Documentary',
      pika: 'documentary',
      kling: 'Documentary',
      ideogram: 'documentary photography',
      leonardo: 'Documentary',
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
      sora: 'Film Noir',
      pika: 'film noir',
      kling: 'Film Noir',
      ideogram: 'film noir style',
      leonardo: 'Film Noir',
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
      sora: 'Cyberpunk',
      pika: 'cyberpunk',
      kling: 'Cyberpunk',
      ideogram: 'cyberpunk aesthetic',
      leonardo: 'Cyberpunk',
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
      sora: 'Vintage',
      pika: 'vintage',
      kling: 'Vintage',
      ideogram: 'vintage aesthetic',
      leonardo: 'Vintage',
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
      sora: 'Anime',
      pika: 'anime',
      kling: 'Anime',
      ideogram: 'anime art style',
      leonardo: 'Anime',
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
      sora: 'Hyperrealistic',
      pika: 'hyperrealistic',
      kling: 'Hyperrealistic',
      ideogram: 'hyperrealistic photography',
      leonardo: 'Hyperrealistic',
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
      sora: 'Ethereal',
      pika: 'ethereal',
      kling: 'Ethereal',
      ideogram: 'ethereal dreamy',
      leonardo: 'Ethereal',
    },
    ignoredPlatforms: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Get cards by category
 */
export function getCardsByCategory(category: CardCategory): PolymorphicCard[] {
  return polymorphicCards.filter(card => card.category === category);
}

/**
 * Get a card by ID
 */
export function getCardById(id: string): PolymorphicCard | undefined {
  return polymorphicCards.find(card => card.id === id);
}

/**
 * Get all cards for a specific state key
 */
export function getCardsByStateKey(stateKey: string): PolymorphicCard[] {
  return polymorphicCards.filter(card => card.stateKey === stateKey);
}

/**
 * Check if a card is ignored for a platform
 */
export function isCardIgnoredForPlatform(card: PolymorphicCard, platform: PlatformId): boolean {
  return card.ignoredPlatforms.includes(platform);
}

/**
 * Get the platform-specific value for a card
 */
export function getCardValueForPlatform(card: PolymorphicCard, platform: PlatformId): string | null {
  if (card.ignoredPlatforms.includes(platform)) {
    return null;
  }
  return card.values[platform] ?? null;
}

/**
 * Get all available cards for a platform (excluding ignored)
 */
export function getAvailableCardsForPlatform(platform: PlatformId): PolymorphicCard[] {
  return polymorphicCards.filter(card => !card.ignoredPlatforms.includes(platform));
}

/**
 * Get category stats
 */
export function getCategoryStats(category: CardCategory): { total: number; imageOnly: number; videoOnly: number; universal: number } {
  const cards = getCardsByCategory(category);
  return {
    total: cards.length,
    imageOnly: cards.filter(c => c.ignoredPlatforms.some(p => VIDEO_PLATFORMS.includes(p))).length,
    videoOnly: cards.filter(c => c.ignoredPlatforms.some(p => IMAGE_PLATFORMS.includes(p))).length,
    universal: cards.filter(c => c.ignoredPlatforms.length === 0).length,
  };
}
