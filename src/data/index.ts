import { studioLighting } from './studio-lighting';
import { naturalLighting } from './natural-lighting';
import { cinematicLighting } from './cinematic-lighting';
import { practicalLighting } from './practical-lighting';
import { environmentalLighting } from './environmental-lighting';
import { specializedLighting } from './specialized-lighting';

// Combined array of all lighting presets
export const allLightingPresets = [
  ...studioLighting,
  ...naturalLighting,
  ...cinematicLighting,
  ...practicalLighting,
  ...environmentalLighting,
  ...specializedLighting
];

// Lighting presets organized by category
export const lightingByCategory = {
  'Studio Lighting': studioLighting,
  'Natural Lighting': naturalLighting,
  'Cinematic Lighting': cinematicLighting,
  'Practical & Motivated': practicalLighting,
  'Environmental': environmentalLighting,
  'Specialized Techniques': specializedLighting
};

// Export individual categories for convenience
export {
  studioLighting,
  naturalLighting,
  cinematicLighting,
  practicalLighting,
  environmentalLighting,
  specializedLighting
};

