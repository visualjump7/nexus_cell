import { LightingPreset } from '@/types/lighting.types';

export const studioLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Three-Point Lighting',
    category: 'Studio Lighting',
    description: 'Professional setup with balanced key, fill, and rim lights for dimensional subject lighting',
    prompt: 'three-point lighting, key fill rim, professional studio setup, balanced dimensional lighting'
  },
  {
    id: crypto.randomUUID(),
    name: 'Rembrandt Lighting',
    category: 'Studio Lighting',
    description: '45-degree key light creating characteristic triangle highlight under eye',
    prompt: 'Rembrandt lighting, 45-degree key light, triangle highlight under eye, dramatic portrait lighting'
  },
  {
    id: crypto.randomUUID(),
    name: 'Butterfly Lighting',
    category: 'Studio Lighting',
    description: 'Overhead key light positioned above subject creating butterfly-shaped shadow under nose',
    prompt: 'butterfly lighting, overhead key light, butterfly shadow under nose, glamour portrait style'
  },
  {
    id: crypto.randomUUID(),
    name: 'High-Key Lighting',
    category: 'Studio Lighting',
    description: 'Bright even lighting with minimal shadows against white background',
    prompt: 'high-key lighting, bright even illumination, minimal shadows, white background, clean commercial style'
  },
  {
    id: crypto.randomUUID(),
    name: 'Low-Key Lighting',
    category: 'Studio Lighting',
    description: 'Dramatic lighting with high contrast and predominant shadows against dark background',
    prompt: 'low-key lighting, dramatic high contrast, deep shadows, dark background, moody atmospheric'
  }
];

