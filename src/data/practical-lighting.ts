import { LightingPreset } from '@/types/lighting.types';

export const practicalLighting: LightingPreset[] = [
  {
    id: crypto.randomUUID(),
    name: 'Fireplace Glow',
    category: 'Practical Lighting',
    description: 'Warm flickering orange ambient fire light creating cozy atmosphere',
    prompt: 'fireplace glow lighting, warm flickering orange, ambient fire light, cozy intimate, practical flame illumination'
  },
  {
    id: crypto.randomUUID(),
    name: 'Candlelight',
    category: 'Practical Lighting',
    description: 'Intimate warm glow with low-level soft flicker creating romantic mood',
    prompt: 'candlelight, intimate warm glow, low-level soft flicker, romantic atmosphere, gentle flame light'
  },
  {
    id: crypto.randomUUID(),
    name: 'Neon Signs',
    category: 'Practical Lighting',
    description: 'Colored hard accent light from urban storefront creating vibrant atmosphere',
    prompt: 'neon signs lighting, colored hard accent light, urban storefront, vibrant practical glow, nightlife atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Street Lamp',
    category: 'Practical Lighting',
    description: 'Warm-cool urban pooled light creating night exterior atmosphere',
    prompt: 'street lamp lighting, warm-cool urban pooled light, night exterior, sodium vapor glow, street lighting atmosphere'
  },
  {
    id: crypto.randomUUID(),
    name: 'Moonlight',
    category: 'Practical Lighting',
    description: 'Cool blue-white light with hard shadows creating night exterior ambiance',
    prompt: 'moonlight, cool blue-white, hard shadows, night exterior, lunar illumination, serene nocturnal atmosphere'
  }
];

