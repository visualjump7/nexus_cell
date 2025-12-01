import { VisualPromptInput } from './schemas';

const TAG_TO_SENTENCE_MAP: Record<string, string> = {
  'Dutch Angle': 'The camera is tilted on its axis to create a sense of disorientation.',
  'Low Angle': 'The camera is positioned low, looking up at the subject to create a sense of power.',
  'High Angle': 'The camera is positioned high, looking down to create a sense of vulnerability.',
  'Wide Angle': 'A wide field of view captures the expansive environment.',
  'Close Up': 'The frame is filled with the subject, focusing on intimate details.',
  'Golden Hour': 'The scene is bathed in warm, soft sunlight from low in the sky.',
  'Blue Hour': 'The scene is illuminated by the deep blue twilight before sunrise or after sunset.',
  'Cinematic': 'The image features dramatic lighting, shallow depth of field, and high production value.',
  'Hyperrealistic': 'The image is indistinguishable from a high-resolution photograph.',
  'Film Noir': 'High contrast lighting and deep shadows create a moody, mysterious atmosphere.',
};

function convertTagToSentence(tag: string): string {
  // Direct match
  if (TAG_TO_SENTENCE_MAP[tag]) {
    return TAG_TO_SENTENCE_MAP[tag];
  }
  // Fallback pattern for generic tags
  return `The image features ${tag.toLowerCase()}.`;
}

export function buildDallePrompt(input: VisualPromptInput): string {
  const sentences: string[] = [];

  // 1. Core Narrative (Subject + Action + Environment)
  let coreSentence = `Create an image of ${input.subject}`;
  if (input.action) {
    coreSentence += ` who is ${input.action}`;
  }
  if (input.environment) {
    coreSentence += ` in ${input.environment}`;
  }
  sentences.push(coreSentence + '.');

  // 2. Lens & Camera Settings
  if (input.lensSettings) {
    sentences.push((input.lensSettings as string) + '.');
  }
  
  // 3. Film Grain & Texture
  if (input.grainSettings) {
    sentences.push(input.grainSettings + '.');
  }

  // 3. Camera / Angle Translation
  if (input.camera?.angle) {
    sentences.push(convertTagToSentence(input.camera.angle));
  }
  if (input.camera?.lens) {
    sentences.push(`Use a ${input.camera.lens} to capture the scene.`);
  }

  // 4. Lighting & Atmosphere
  if (input.lighting) {
    sentences.push(`The lighting is ${input.lighting.toLowerCase()}.`);
  }
  if (input.style) {
    sentences.push(convertTagToSentence(input.style));
  }
  if (input.filmStock) {
    sentences.push(`The color grading mimics ${input.filmStock} film stock.`);
  }

  // 5. Meta-Instruction Wrapper (Protection)
  const narrativeBlock = sentences.join(' ');
  
  return `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: "${narrativeBlock}"`;
}

