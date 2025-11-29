import { VideoPromptInput } from './schemas';

export function buildKlingPrompt(input: VideoPromptInput): string {
  // Formula: [Subject] + [Action] + [Scene] + [Camera] + [Lighting] + [Atmosphere]
  
  const parts: string[] = [];

  // 1. Subject
  parts.push(input.subject);

  // 2. Action
  const action = input.subjectAction || input.action;
  if (action) {
    parts.push(action);
  }

  // 3. Scene (Environment)
  if (input.environment) {
    parts.push(input.environment);
  }

  // 4. Camera
  const cameraParts: string[] = [];
  const movement = input.cameraMovement || input.camera?.movement;
  if (movement) cameraParts.push(movement);
  if (input.camera?.angle) cameraParts.push(input.camera.angle);
  if (input.camera?.lens) cameraParts.push(input.camera.lens);
  
  if (cameraParts.length > 0) {
    parts.push(cameraParts.join(' '));
  }

  // 5. Lighting
  if (input.lighting) {
    parts.push(input.lighting);
  }

  // 6. Atmosphere (Style/Film)
  const atmosphere: string[] = [];
  if (input.style) atmosphere.push(input.style);
  if (input.filmStock) atmosphere.push(input.filmStock);
  
  if (atmosphere.length > 0) {
    parts.push(atmosphere.join(' '));
  }

  return parts.join(', ');
}
