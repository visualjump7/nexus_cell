import { VisualPromptInput } from './schemas';

export function buildFluxPrompt(input: VisualPromptInput): string {
  // HYBRID PROTOCOL: [T5 Natural Language Sentence], [CLIP Tag List]

  // Part 1: T5 Natural Language Sentence (Descriptive)
  // Front-load subject, action, and environment
  let sentence = `A photo of ${input.subject}`;
  
  if (input.action) {
    sentence += ` performing ${input.action}`;
  }
  
  if (input.environment) {
    sentence += ` located in ${input.environment}`;
  }
  
  // Ensure sentence ends with punctuation
  if (!sentence.endsWith('.')) {
    sentence += '.';
  }

  // Part 2: CLIP Tag List (Aesthetic Tokens)
  // Back-load style, lighting, camera, film stock
  const tags: string[] = [];

  if (input.style) tags.push(input.style);
  if (input.lighting) tags.push(input.lighting);
  if (input.camera?.angle) tags.push(input.camera.angle);
  if (input.camera?.lens) tags.push(input.camera.lens);
  if (input.filmStock) tags.push(`shot on ${input.filmStock}`);
  
  // Combine with separator
  // Structure: "Sentence. Tag, Tag, Tag."
  const tagString = tags.length > 0 ? tags.join(', ') : '';
  
  return `${sentence} ${tagString}`.trim();
}
