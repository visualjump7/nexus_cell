import { LightingPreset } from '@/types/lighting.types';

export const environmentalLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Cathedral Light',
    category: 'Environmental Lighting',
    description: 'Tall window shafts creating volumetric god rays in sacred space',
    prompt: 'cathedral lighting, tall window shafts, volumetric god rays, dramatic beams, sacred atmospheric illumination'
  },
  {
    id: crypto.randomUUID(),
    name: 'Forest Canopy',
    category: 'Environmental Lighting',
    description: 'Dappled green-filtered natural light through dense tree foliage',
    prompt: 'forest canopy lighting, dappled green-filtered natural light, through trees, organic shadow patterns, woodland atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Underwater',
    category: 'Environmental Lighting',
    description: 'Diffused blue-green light with volumetric aquatic glow',
    prompt: 'underwater lighting, diffused blue-green, volumetric aquatic glow, caustic light rays, oceanic atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Desert Sun',
    category: 'Environmental Lighting',
    description: 'Harsh overhead bright sunlight with heat haze shimmer',
    prompt: 'desert sun lighting, harsh overhead bright, heat haze shimmer, intense arid atmosphere, scorching sunlight'
  },
  {
    id: crypto.randomUUID(),
    name: 'Urban Night',
    category: 'Environmental Lighting',
    description: 'Mixed color temperature with city lights creating ambient urban glow',
    prompt: 'urban night lighting, mixed color temperature, city lights, ambient glow, metropolitan nocturnal atmosphere'
  }
];

