import { VisualPromptInput } from './schemas';

export function buildMidjourneyPrompt(input: VisualPromptInput): string {
  const parts: string[] = [];

  // 1. Subject & Action (Atomic Core)
  let core = input.subject;
  if (input.action) {
    core += ` ${input.action}`;
  }
  parts.push(core);

  // 2. Environment
  if (input.environment) {
    parts.push(input.environment);
  }

  // 3. Lighting / Film Stock / Style / Lens / Angle
  const attributes: string[] = [];
  
  if (input.camera?.angle) attributes.push(input.camera.angle);
  if (input.camera?.lens) attributes.push(input.camera.lens);
  if (input.lighting) attributes.push(input.lighting);
  
  // Logic: If style is 'Hyperrealistic', inject raw style + Vision3 500T
  if (input.style === 'Hyperrealistic') {
    attributes.push('Hyperrealistic');
    if (!input.filmStock) {
      attributes.push('shot on Kodak Vision3 500T');
    }
  } else if (input.style) {
    attributes.push(input.style);
  }

  if (input.filmStock) {
    // Avoid duplicate if already added by hyperrealistic logic
    if (input.style !== 'Hyperrealistic' || input.filmStock !== 'Kodak Vision3 500T') {
       parts.push(`shot on ${input.filmStock}`);
    }
  }

  // Add collected attributes to main parts
  parts.push(...attributes);

  // 4. Parameters (Must be last)
  let params = `--v 6.0`;
  
  // Aspect Ratio
  if (input.aspectRatio) {
    params += ` --ar ${input.aspectRatio}`;
  }

  // Style Raw injection
  if (input.style === 'Hyperrealistic' || input.style?.includes('raw')) {
    params += ` --style raw`;
  }

  // Negative Prompt (Midjourney uses --no)
  if (input.negativePrompt) {
    params += ` --no ${input.negativePrompt}`;
  }

  return `${parts.join(', ')} ${params}`;
}

