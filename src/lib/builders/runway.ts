import { VideoPromptInput } from './schemas';

export function buildRunwayPrompt(input: VideoPromptInput): string {
  // Syntax: [Camera Movement]: [Subject Action].
  
  // 1. Camera Movement (Strict Separation)
  let movement = input.cameraMovement || input.camera?.movement || 'Static';
  
  // Negative -> Positive Conversion Logic
  // Simple replacement map for common negative motion terms
  const negativeMap: Record<string, string> = {
    'no shaking': 'Smooth steady cam',
    'no blur': 'Sharp focus',
    'steady': 'Locked off',
    'stable': 'Steadicam',
  };
  
  // Check if movement is in our map (case-insensitive check)
  const lowerMove = movement.toLowerCase();
  for (const [neg, pos] of Object.entries(negativeMap)) {
    if (lowerMove.includes(neg)) {
      movement = pos;
      break;
    }
  }

  // 2. Subject Action
  let action = input.subject; // Subject is the core
  if (input.subjectAction) {
    action += ` ${input.subjectAction}`;
  } else if (input.action) {
    action += ` ${input.action}`;
  }
  
  // 3. Aesthetics (appended after action)
  const aesthetics: string[] = [];
  if (input.environment) aesthetics.push(input.environment);
  if (input.lighting) aesthetics.push(input.lighting);
  if (input.style) aesthetics.push(`${input.style} aesthetic`);
  if (input.filmStock) aesthetics.push(`${input.filmStock} color grade`);
  
  const aestheticString = aesthetics.length > 0 ? `. ${aesthetics.join(', ')}` : '';

  // Final Assembly
  return `[${movement}]: ${action}${aestheticString}.`;
}


