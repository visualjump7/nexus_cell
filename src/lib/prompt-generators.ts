import { PlatformId, PromptState } from '@/types';

export function generatePrompt(state: PromptState, platform: PlatformId): string {
  const { subject, angle, movement, lens, lighting, style, filmStock, aspectRatio } = state;
  const subjectText = subject || '[Your Subject]';

  switch (platform) {
    case 'midjourney': {
      const parts = [subjectText];
      if (angle) parts.push(angle);
      if (movement) parts.push(movement);
      if (lens) parts.push(lens);
      if (lighting) parts.push(lighting);
      if (style) parts.push(style);
      if (filmStock) parts.push(`shot on ${filmStock}`);

      const arParam =
        aspectRatio === '21:9'
          ? '--ar 21:9'
          : aspectRatio === '9:16'
          ? '--ar 9:16'
          : aspectRatio === '1:1'
          ? '--ar 1:1'
          : '--ar 16:9';

      return `${parts.join(', ')} ${arParam} --v 6.0 --style raw`;
    }

    case 'dalle': {
      let prompt = `Create a ${style || 'cinematic'} image of ${subjectText}.`;
      if (angle) prompt += ` The shot is captured from a ${angle} to create dramatic tension.`;
      if (lens) prompt += ` Emulate the aesthetic of a ${lens} with its characteristic depth and perspective.`;
      if (lighting) prompt += ` The scene is illuminated with ${lighting}.`;
      if (filmStock) prompt += ` The color grading mimics ${filmStock} film stock.`;
      if (movement) prompt += ` Convey the sense of a ${movement} in progress.`;
      prompt += ` Ultra high quality, photorealistic, 8K resolution.`;
      return prompt;
    }

    case 'runway': {
      const move = movement || 'Static';
      let prompt = `[${move}]: `;
      if (angle) prompt += `${angle} shot of `;
      prompt += `${subjectText}. `;
      if (lighting) prompt += `${lighting}. `;
      if (style) prompt += `${style} aesthetic. `;
      if (lens) prompt += `Shot with ${lens}. `;
      if (filmStock) prompt += `${filmStock} color grade.`;
      return prompt.trim();
    }

    case 'veo': {
      const cinematography = [angle, movement].filter(Boolean).join(', ') || 'Standard composition';
      const context =
        [lighting, style, filmStock ? `${filmStock} look` : null].filter(Boolean).join(', ') ||
        'Natural environment';
      let prompt = `Cinematography: ${cinematography}. Subject: ${subjectText}. Context: ${context}.`;
      if (lens) prompt += ` Technical: ${lens}.`;
      return prompt;
    }

    case 'grok': {
      let prompt = `${subjectText}. `;
      if (angle) prompt += `Captured from a ${angle}. `;
      if (filmStock) prompt += `Style of ${filmStock}. `;
      else if (style) prompt += `${style} visual style. `;
      if (lighting) prompt += `Emphasis on ${lighting}. `;
      if (lens) prompt += `${lens} characteristics. `;
      if (movement) prompt += `${movement} dynamics.`;
      return prompt.trim();
    }

    case 'ideogram': {
      let prompt = `${subjectText}, ${style || 'cinematic photography'}`;
      if (angle) prompt += `, ${angle}`;
      if (lens) prompt += `, ${lens}`;
      if (lighting) prompt += `, ${lighting}`;
      if (filmStock) prompt += `, ${filmStock} aesthetic`;
      prompt += `, highly detailed, professional quality`;
      return prompt;
    }

    case 'leonardo': {
      let prompt = `[Subject]: ${subjectText}`;
      if (style) prompt += ` | [Style]: ${style}`;
      if (angle) prompt += ` | [Camera]: ${angle}`;
      if (lens) prompt += `, ${lens}`;
      if (lighting) prompt += ` | [Lighting]: ${lighting}`;
      if (filmStock) prompt += ` | [Film]: ${filmStock}`;
      if (movement) prompt += ` | [Motion]: ${movement}`;
      return prompt;
    }

    case 'stable': {
      const parts = [`(${subjectText}:1.3)`];
      if (style) parts.push(`(${style}:1.2)`);
      if (angle) parts.push(`(${angle}:1.1)`);
      if (lens) parts.push(`${lens}`);
      if (lighting) parts.push(`(${lighting}:1.2)`);
      if (filmStock) parts.push(`${filmStock}`);
      parts.push('masterpiece', 'best quality', '8k uhd');
      return parts.join(', ');
    }

    case 'sora': {
      let prompt = `A cinematic scene: ${subjectText}. `;
      if (angle && movement) prompt += `Camera: ${angle} with ${movement}. `;
      else if (angle) prompt += `Camera: ${angle}. `;
      else if (movement) prompt += `Camera: ${movement}. `;
      if (lens) prompt += `Shot on ${lens}. `;
      if (lighting) prompt += `Lighting: ${lighting}. `;
      if (style) prompt += `Style: ${style}. `;
      if (filmStock) prompt += `Film look: ${filmStock}. `;
      prompt += `High production value, cinematic quality.`;
      return prompt;
    }

    case 'pika': {
      const move = movement || 'subtle motion';
      let prompt = `${subjectText} with ${move}`;
      if (angle) prompt += `, ${angle}`;
      if (lighting) prompt += `, ${lighting}`;
      if (style) prompt += `, ${style} style`;
      if (lens) prompt += `, ${lens} look`;
      return prompt;
    }

    case 'kling': {
      let prompt = `Scene: ${subjectText}. `;
      if (movement) prompt += `Motion: ${movement}. `;
      if (angle) prompt += `Angle: ${angle}. `;
      if (lighting) prompt += `Light: ${lighting}. `;
      if (style) prompt += `Aesthetic: ${style}. `;
      if (lens) prompt += `Lens: ${lens}. `;
      if (filmStock) prompt += `Color: ${filmStock}.`;
      return prompt.trim();
    }

    default:
      return subjectText;
  }
}

// Generate prompts for all platforms at once
export function generateAllPrompts(state: PromptState): Record<PlatformId, string> {
  const platformIds: PlatformId[] = [
    'midjourney',
    'dalle',
    'ideogram',
    'leonardo',
    'stable',
    'grok',
    'runway',
    'veo',
    'sora',
    'pika',
    'kling',
  ];

  return platformIds.reduce((acc, platform) => {
    acc[platform] = generatePrompt(state, platform);
    return acc;
  }, {} as Record<PlatformId, string>);
}
