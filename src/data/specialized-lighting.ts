import { LightingPreset } from '@/types/lighting.types';

export const specializedLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Volumetric Lighting',
    category: 'Specialized Lighting',
    description: 'Visible light beams cutting through fog and haze, creating dramatic atmospheric rays',
    prompt: 'volumetric lighting, visible light beams, fog, haze, atmospheric rays, light shafts, cinematic atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Lens Flare',
    category: 'Specialized Lighting',
    description: 'Sun or bright light source in frame creating optical artifacts and bright highlights',
    prompt: 'lens flare, sun in frame, optical artifacts, bright highlights, anamorphic flare, light bloom'
  },
  {
    id: crypto.randomUUID(),
    name: 'Backlighting',
    category: 'Specialized Lighting',
    description: 'Light source behind subject creating rim light, silhouette effect, and edge glow',
    prompt: 'backlighting, rim light, silhouette, edge glow, backlit subject, contour lighting'
  },
  {
    id: crypto.randomUUID(),
    name: 'Mixed Color Temperature',
    category: 'Specialized Lighting',
    description: 'Warm and cool light sources creating color opposition and dynamic contrast',
    prompt: 'mixed color temperature, warm-cool contrast, color opposition, dual temperature, orange teal split'
  },
  {
    id: crypto.randomUUID(),
    name: 'Eye Light',
    category: 'Specialized Lighting',
    description: 'Catchlight reflections creating sparkle and life in portrait subject eyes',
    prompt: 'eye light, catchlight reflections, sparkle in eyes, portrait lighting, life in eyes, ocular highlights'
  }
];

