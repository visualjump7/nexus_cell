import { LightingPreset } from '@/types/lighting.types';

export const cinematicLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Film Noir',
    category: 'Cinematic Lighting',
    description: 'High contrast with hard shadows creating dramatic chiaroscuro mood',
    prompt: 'film noir lighting, high contrast, hard shadows, dramatic chiaroscuro, venetian blind patterns, mystery atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Neon Cyberpunk',
    category: 'Cinematic Lighting',
    description: 'Saturated colored lights with neon glow creating urban night atmosphere',
    prompt: 'neon cyberpunk lighting, saturated colored lights, neon glow, urban night, vibrant reflections, futuristic mood'
  },
  {
    id: crypto.randomUUID(),
    name: 'Horror Low-Key',
    category: 'Cinematic Lighting',
    description: 'Minimal key light with deep shadows creating underlit suspenseful mood',
    prompt: 'horror low-key lighting, minimal key light, deep shadows, underlit, ominous atmosphere, suspenseful dark'
  },
  {
    id: crypto.randomUUID(),
    name: 'Sci-Fi Cool',
    category: 'Cinematic Lighting',
    description: 'Blue-teal tones with futuristic clean clinical lighting',
    prompt: 'sci-fi cool lighting, blue-teal tones, futuristic atmosphere, clean clinical, technological precision, cool color grading'
  },
  {
    id: crypto.randomUUID(),
    name: 'Romance Soft Glow',
    category: 'Cinematic Lighting',
    description: 'Diffused warm light with flattering soft focus creating intimate romantic mood',
    prompt: 'romance soft glow lighting, diffused warm, flattering soft focus, intimate atmosphere, dreamy romantic, gentle glow'
  }
];

