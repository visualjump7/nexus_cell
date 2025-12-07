import { LightingPreset } from '@/types/lighting.types';

export const naturalLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Golden Hour',
    category: 'Natural Lighting',
    description: 'Warm sunset glow with soft low-angle sunlight creating beautiful natural atmosphere',
    prompt: 'golden hour lighting, warm sunset glow, soft low-angle sunlight, beautiful natural light, magic hour'
  },
  {
    id: crypto.randomUUID(),
    name: 'Blue Hour',
    category: 'Natural Lighting',
    description: 'Cool twilight with pre-dawn soft light creating serene blue-toned atmosphere',
    prompt: 'blue hour lighting, cool twilight, pre-dawn soft light, serene blue tones, magical atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Overcast Soft',
    category: 'Natural Lighting',
    description: 'Diffused cloudy sky creating even soft lighting with no harsh shadows',
    prompt: 'overcast soft lighting, diffused cloudy sky, even soft illumination, gentle shadowless, natural portrait light'
  },
  {
    id: crypto.randomUUID(),
    name: 'Harsh Midday',
    category: 'Natural Lighting',
    description: 'Bright overhead sun creating hard shadows and high contrast lighting',
    prompt: 'harsh midday lighting, bright overhead sun, hard shadows, high contrast, intense direct sunlight'
  },
  {
    id: crypto.randomUUID(),
    name: 'Soft Window Light',
    category: 'Natural Lighting',
    description: 'Diffused directional natural indoor window light creating gentle illumination',
    prompt: 'soft window light, diffused directional, natural indoor lighting, gentle window glow, soft wraparound'
  }
];

