'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// POLYMORPHIC PROMPT ARMORY — ULTIMATE EDITION
// Clean AAA Cinematic Design with Multi-Platform Output & Preset System
// ═══════════════════════════════════════════════════════════════════════════════

interface PromptState {
  subject: string;
  angle: string | null;
  movement: string | null;
  lens: string | null;
  lighting: string | null;
  style: string | null;
  filmStock: string | null;
  aspectRatio: string;
}

interface Platform {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  type: string;
  description: string;
}

interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  config: Partial<PromptState>;
}

interface ArsenalCard {
  id: string;
  label: string;
  value: string;
  desc: string;
}

interface ArsenalCategory {
  label: string;
  icon: string;
  stateKey: keyof PromptState;
  cards: ArsenalCard[];
}

const PromptArmory = () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  const [targetMode, setTargetMode] = useState('midjourney');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('camera');
  const [showPresets, setShowPresets] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  
  // Core prompt state object - the "DNA" of our prompt
  const [promptState, setPromptState] = useState<PromptState>({
    subject: '',
    angle: null,
    movement: null,
    lens: null,
    lighting: null,
    style: null,
    filmStock: null,
    aspectRatio: '16:9'
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PLATFORM CONFIGURATIONS (11 Platforms)
  // ─────────────────────────────────────────────────────────────────────────────
  
  const platforms: Record<string, Platform> = {
    // IMAGE GENERATORS
    midjourney: {
      id: 'midjourney',
      name: 'Midjourney v6',
      shortName: 'MJ',
      icon: '◆',
      color: '#ff6b35',
      type: 'image',
      description: 'Comma-separated with parameters'
    },
    dalle: {
      id: 'dalle',
      name: 'DALL-E 3',
      shortName: 'D3',
      icon: '○',
      color: '#10b981',
      type: 'image',
      description: 'Natural language descriptions'
    },
    ideogram: {
      id: 'ideogram',
      name: 'Ideogram 2.0',
      shortName: 'ID',
      icon: '◐',
      color: '#ec4899',
      type: 'image',
      description: 'Text-aware generation'
    },
    leonardo: {
      id: 'leonardo',
      name: 'Leonardo AI',
      shortName: 'LEO',
      icon: '◇',
      color: '#a855f7',
      type: 'image',
      description: 'Precise control prompts'
    },
    stable: {
      id: 'stable',
      name: 'Stable Diffusion',
      shortName: 'SD',
      icon: '◈',
      color: '#6366f1',
      type: 'image',
      description: 'Weighted token syntax'
    },
    grok: {
      id: 'grok',
      name: 'Grok (Flux.1)',
      shortName: 'GRK',
      icon: '✕',
      color: '#f59e0b',
      type: 'image',
      description: 'Technical precision'
    },
    // VIDEO GENERATORS
    runway: {
      id: 'runway',
      name: 'Runway Gen-3',
      shortName: 'RW',
      icon: '▸',
      color: '#8b5cf6',
      type: 'video',
      description: 'Movement-first syntax'
    },
    veo: {
      id: 'veo',
      name: 'Google Veo',
      shortName: 'VEO',
      icon: '◎',
      color: '#3b82f6',
      type: 'video',
      description: 'Structured cinematography'
    },
    sora: {
      id: 'sora',
      name: 'OpenAI Sora',
      shortName: 'SRA',
      icon: '◉',
      color: '#14b8a6',
      type: 'video',
      description: 'Cinematic scene description'
    },
    pika: {
      id: 'pika',
      name: 'Pika Labs',
      shortName: 'PIK',
      icon: '▹',
      color: '#f43f5e',
      type: 'video',
      description: 'Motion-focused prompts'
    },
    kling: {
      id: 'kling',
      name: 'Kling AI',
      shortName: 'KLG',
      icon: '◭',
      color: '#22d3ee',
      type: 'video',
      description: 'Dynamic scene control'
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESET CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const presets: Preset[] = [
    {
      id: 'epic-hero',
      name: 'Epic Hero Shot',
      icon: '⚔',
      description: 'Low angle power stance with dramatic rim lighting',
      color: '#ff6b35',
      config: {
        angle: 'Low Angle',
        movement: 'Push In',
        lens: 'Anamorphic lens',
        lighting: 'Dramatic rim lighting',
        style: 'Cinematic',
        filmStock: 'Kodak Vision3 500T',
        aspectRatio: '21:9'
      }
    },
    {
      id: 'intimate-doc',
      name: 'Intimate Documentary',
      icon: '◎',
      description: 'Handheld eye-level with natural practical lighting',
      color: '#10b981',
      config: {
        angle: 'Eye Level',
        movement: 'Handheld',
        lens: '35mm lens',
        lighting: 'Practical lighting',
        style: 'Documentary style',
        filmStock: 'Kodak Portra 400',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'cyberpunk-chase',
      name: 'Cyberpunk Chase',
      icon: '↗',
      description: 'Dutch angle whip pan with neon noir aesthetics',
      color: '#8b5cf6',
      config: {
        angle: 'Dutch Angle',
        movement: 'Whip Pan',
        lens: '24mm wide lens',
        lighting: 'Neon noir lighting',
        style: 'Epic sci-fi',
        filmStock: 'CineStill 800T',
        aspectRatio: '21:9'
      }
    },
    {
      id: 'noir-mystery',
      name: 'Film Noir Mystery',
      icon: '◐',
      description: 'High contrast shadows with venetian blind lighting',
      color: '#64748b',
      config: {
        angle: 'High Angle',
        movement: 'Dolly Shot',
        lens: '50mm lens',
        lighting: 'Chiaroscuro lighting',
        style: 'Film Noir style',
        filmStock: 'Ilford HP5 B&W',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'dreamlike-fantasy',
      name: 'Dreamlike Fantasy',
      icon: '✧',
      description: 'Ethereal crane shot with volumetric god rays',
      color: '#a855f7',
      config: {
        angle: "Bird's Eye View",
        movement: 'Crane Shot',
        lens: '85mm portrait lens',
        lighting: 'Volumetric god rays',
        style: 'Dark fantasy',
        filmStock: 'Fujifilm Eterna',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'action-sequence',
      name: 'Action Sequence',
      icon: '⚡',
      description: 'Dynamic steadicam with motion blur emphasis',
      color: '#ef4444',
      config: {
        angle: 'Low Angle',
        movement: 'Steadicam Shot',
        lens: '14mm ultra-wide lens',
        lighting: 'Dramatic rim lighting',
        style: 'Cinematic',
        filmStock: 'Kodak Vision3 500T',
        aspectRatio: '21:9'
      }
    },
    {
      id: 'horror-tension',
      name: 'Horror Tension',
      icon: '◈',
      description: 'Slow push-in with deep shadows and isolation',
      color: '#1e293b',
      config: {
        angle: "Worm's Eye View",
        movement: 'Push In',
        lens: '24mm wide lens',
        lighting: 'Silhouette backlight',
        style: 'Dark fantasy',
        filmStock: 'Kodak Tri-X 400',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'romantic-golden',
      name: 'Romantic Golden Hour',
      icon: '☀',
      description: 'Soft telephoto compression with warm backlight',
      color: '#f59e0b',
      config: {
        angle: 'Eye Level',
        movement: 'Orbital Shot',
        lens: '135mm telephoto',
        lighting: 'Golden hour lighting',
        style: 'Cinematic',
        filmStock: 'Kodak Portra 400',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'anime-epic',
      name: 'Anime Cinematic',
      icon: '◇',
      description: 'Dynamic angles with stylized lighting',
      color: '#ec4899',
      config: {
        angle: 'Low Angle',
        movement: 'Push In',
        lens: '35mm lens',
        lighting: 'Dramatic rim lighting',
        style: 'Anime cinematic',
        filmStock: null,
        aspectRatio: '16:9'
      }
    },
    {
      id: 'vintage-retro',
      name: 'Vintage 70s Film',
      icon: '◔',
      description: 'Soft focus with grain and warm color cast',
      color: '#d97706',
      config: {
        angle: 'Eye Level',
        movement: 'Dolly Shot',
        lens: '50mm lens',
        lighting: 'Practical lighting',
        style: 'Retro 70s film',
        filmStock: 'Kodak Ektar 100',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'macro-detail',
      name: 'Extreme Macro',
      icon: '◉',
      description: 'Ultra close-up with shallow depth of field',
      color: '#06b6d4',
      config: {
        angle: 'Eye Level',
        movement: null,
        lens: 'Macro lens',
        lighting: 'Practical lighting',
        style: 'Hyperrealistic',
        filmStock: 'Kodak Vision3 250D',
        aspectRatio: '1:1'
      }
    },
    {
      id: 'surveillance',
      name: 'Surveillance Footage',
      icon: '◫',
      description: 'High angle static shot with harsh lighting',
      color: '#475569',
      config: {
        angle: 'High Angle',
        movement: null,
        lens: '24mm wide lens',
        lighting: 'Practical lighting',
        style: 'Documentary style',
        filmStock: null,
        aspectRatio: '16:9'
      }
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // ARSENAL CARDS DATA
  // ─────────────────────────────────────────────────────────────────────────────
  
  const arsenal: Record<string, ArsenalCategory> = {
    camera: {
      label: 'Camera Angles',
      icon: '◇',
      stateKey: 'angle',
      cards: [
        { id: 'low', label: 'Low Angle', value: 'Low Angle', desc: 'Power & dominance' },
        { id: 'high', label: 'High Angle', value: 'High Angle', desc: 'Vulnerability' },
        { id: 'dutch', label: 'Dutch Angle', value: 'Dutch Angle', desc: 'Tension & unease' },
        { id: 'eye', label: 'Eye Level', value: 'Eye Level', desc: 'Neutral & intimate' },
        { id: 'birds', label: "Bird's Eye", value: "Bird's Eye View", desc: 'Godlike perspective' },
        { id: 'worms', label: "Worm's Eye", value: "Worm's Eye View", desc: 'Extreme drama' },
        { id: 'over', label: 'Over Shoulder', value: 'Over-the-Shoulder', desc: 'POV intimacy' },
        { id: 'pov', label: 'POV Shot', value: 'POV Shot', desc: 'First person' }
      ]
    },
    movement: {
      label: 'Camera Movement',
      icon: '↗',
      stateKey: 'movement',
      cards: [
        { id: 'push', label: 'Push In', value: 'Push In', desc: 'Building intensity' },
        { id: 'pull', label: 'Pull Out', value: 'Pull Out', desc: 'Revealing context' },
        { id: 'dolly', label: 'Dolly Shot', value: 'Dolly Shot', desc: 'Smooth tracking' },
        { id: 'crane', label: 'Crane Shot', value: 'Crane Shot', desc: 'Sweeping motion' },
        { id: 'orbit', label: 'Orbit', value: 'Orbital Shot', desc: '360° revolution' },
        { id: 'whip', label: 'Whip Pan', value: 'Whip Pan', desc: 'Rapid transition' },
        { id: 'handheld', label: 'Handheld', value: 'Handheld', desc: 'Raw & visceral' },
        { id: 'steadicam', label: 'Steadicam', value: 'Steadicam Shot', desc: 'Floating stability' }
      ]
    },
    lens: {
      label: 'Lens & Optics',
      icon: '◉',
      stateKey: 'lens',
      cards: [
        { id: '14mm', label: '14mm Ultra Wide', value: '14mm ultra-wide lens', desc: 'Extreme distortion' },
        { id: '24mm', label: '24mm Wide', value: '24mm wide lens', desc: 'Environmental' },
        { id: '35mm', label: '35mm', value: '35mm lens', desc: 'Cinematic standard' },
        { id: '50mm', label: '50mm', value: '50mm lens', desc: 'Natural eye' },
        { id: '85mm', label: '85mm Portrait', value: '85mm portrait lens', desc: 'Compression beauty' },
        { id: '135mm', label: '135mm Telephoto', value: '135mm telephoto', desc: 'Isolated focus' },
        { id: 'macro', label: 'Macro', value: 'Macro lens', desc: 'Extreme detail' },
        { id: 'anamorphic', label: 'Anamorphic', value: 'Anamorphic lens', desc: 'Cinematic flares' }
      ]
    },
    lighting: {
      label: 'Lighting',
      icon: '☀',
      stateKey: 'lighting',
      cards: [
        { id: 'golden', label: 'Golden Hour', value: 'Golden hour lighting', desc: 'Warm magic' },
        { id: 'blue', label: 'Blue Hour', value: 'Blue hour lighting', desc: 'Cool mystery' },
        { id: 'neon', label: 'Neon Noir', value: 'Neon noir lighting', desc: 'Cyberpunk glow' },
        { id: 'rim', label: 'Rim Light', value: 'Dramatic rim lighting', desc: 'Edge definition' },
        { id: 'chiaroscuro', label: 'Chiaroscuro', value: 'Chiaroscuro lighting', desc: 'Renaissance drama' },
        { id: 'volumetric', label: 'Volumetric', value: 'Volumetric god rays', desc: 'Ethereal beams' },
        { id: 'practical', label: 'Practical', value: 'Practical lighting', desc: 'In-scene sources' },
        { id: 'silhouette', label: 'Silhouette', value: 'Silhouette backlight', desc: 'Mystery shape' }
      ]
    },
    style: {
      label: 'Visual Style',
      icon: '◈',
      stateKey: 'style',
      cards: [
        { id: 'cinematic', label: 'Cinematic', value: 'Cinematic', desc: 'Film production' },
        { id: 'hyperreal', label: 'Hyperrealistic', value: 'Hyperrealistic', desc: '8K photorealism' },
        { id: 'noir', label: 'Film Noir', value: 'Film Noir style', desc: 'Shadow & mystery' },
        { id: 'scifi', label: 'Sci-Fi Epic', value: 'Epic sci-fi', desc: 'Future worlds' },
        { id: 'anime', label: 'Anime Cinematic', value: 'Anime cinematic', desc: 'Japanese animation' },
        { id: 'fantasy', label: 'Dark Fantasy', value: 'Dark fantasy', desc: 'Gothic wonder' },
        { id: 'documentary', label: 'Documentary', value: 'Documentary style', desc: 'Raw authenticity' },
        { id: 'retro', label: 'Retro Film', value: 'Retro 70s film', desc: 'Vintage aesthetic' }
      ]
    },
    filmStock: {
      label: 'Film Stock',
      icon: '▣',
      stateKey: 'filmStock',
      cards: [
        { id: 'kodak5219', label: 'Kodak Vision3 500T', value: 'Kodak Vision3 500T', desc: 'Hollywood standard' },
        { id: 'kodak5207', label: 'Kodak Vision3 250D', value: 'Kodak Vision3 250D', desc: 'Daylight master' },
        { id: 'fuji', label: 'Fujifilm Eterna', value: 'Fujifilm Eterna', desc: 'Soft elegance' },
        { id: 'portra', label: 'Kodak Portra 400', value: 'Kodak Portra 400', desc: 'Portrait beauty' },
        { id: 'ektar', label: 'Kodak Ektar 100', value: 'Kodak Ektar 100', desc: 'Vivid saturation' },
        { id: 'cinestill', label: 'CineStill 800T', value: 'CineStill 800T', desc: 'Neon halation' },
        { id: 'ilford', label: 'Ilford HP5', value: 'Ilford HP5 B&W', desc: 'Classic monochrome' },
        { id: 'trix', label: 'Kodak Tri-X', value: 'Kodak Tri-X 400', desc: 'Gritty contrast' }
      ]
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PROMPT GENERATORS (Platform-Specific Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  
  const generatePrompt = useCallback((state: PromptState, platform: string) => {
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
        
        const arParam = aspectRatio === '21:9' ? '--ar 21:9' :
                        aspectRatio === '9:16' ? '--ar 9:16' : 
                        aspectRatio === '1:1' ? '--ar 1:1' : '--ar 16:9';
        
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
        const context = [lighting, style, filmStock ? `${filmStock} look` : null].filter(Boolean).join(', ') || 'Natural environment';
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
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CIPHER DECODE ANIMATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  const cipherChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`αβγδεζηθικλμνξοπρστυφχψω';
  const animationRef = useRef<number | null>(null);
  
  const animateCipherDecode = useCallback((targetText: string) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const duration = 800;
    const startTime = performance.now();
    const textLength = targetText.length;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const revealedCount = Math.floor(textLength * easedProgress);
      
      let displayString = '';
      for (let i = 0; i < textLength; i++) {
        if (i < revealedCount) {
          displayString += targetText[i];
        } else {
          displayString += cipherChars[Math.floor(Math.random() * cipherChars.length)];
        }
      }
      
      setDisplayText(displayString);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(targetText);
        setIsTransitioning(false);
      }
    };
    
    setIsTransitioning(true);
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const newPrompt = generatePrompt(promptState, targetMode);
    animateCipherDecode(newPrompt);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [promptState, targetMode, generatePrompt, animateCipherDecode]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleCardSelect = (category: string, card: ArsenalCard) => {
    const stateKey = arsenal[category].stateKey;
    setPromptState(prev => ({
      ...prev,
      [stateKey]: prev[stateKey] === card.value ? null : card.value
    }));
    setActivePreset(null);
  };
  
  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id);
    setPromptState(prev => ({
      ...prev,
      ...preset.config
    }));
  };
  
  const handlePlatformChange = (platformId: string) => {
    setTargetMode(platformId);
  };
  
  const handleCopy = async () => {
    const finalText = generatePrompt(promptState, targetMode);
    await navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleClear = () => {
    setActivePreset(null);
    setPromptState({
      subject: '',
      angle: null,
      movement: null,
      lens: null,
      lighting: null,
      style: null,
      filmStock: null,
      aspectRatio: '16:9'
    });
  };

  const isCardSelected = (category: string, cardValue: string) => {
    const stateKey = arsenal[category].stateKey;
    return promptState[stateKey] === cardValue;
  };

  const getActiveSelectionsCount = () => {
    return Object.entries(promptState).filter(([k, v]) => v !== null && v !== '' && k !== 'aspectRatio').length;
  };

  const getFilteredPlatforms = () => {
    if (platformFilter === 'all') return Object.values(platforms);
    return Object.values(platforms).filter(p => p.type === platformFilter);
  };

  const currentPlatform = platforms[targetMode];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS (Original v1 Style)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Radial glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-30 transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at center, ${currentPlatform.color}15 0%, transparent 70%)`
          }}
        />
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-white/10" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-white/10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-white/10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-white/10" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentPlatform.color }} />
                <span className="text-xs tracking-[0.3em] text-white/40 uppercase">System Online</span>
              </div>
              <h1 className="text-4xl font-extralight tracking-tight mb-1">
                PROMPT <span className="font-bold">ARMORY</span>
              </h1>
              <p className="text-white/40 text-sm tracking-wide">
                Polymorphic Generation System • {getActiveSelectionsCount()} Parameters Active
              </p>
            </div>
            
            {/* Preset Toggle Button */}
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg border transition-all duration-300 ${
                showPresets 
                  ? 'border-white/30 bg-white/10 text-white' 
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-lg">◈</span>
              <span className="text-sm font-medium">Cinematic Presets</span>
              <span className={`text-xs transition-transform duration-300 ${showPresets ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            PRESETS PANEL (Collapsible)
        ───────────────────────────────────────────────────────────────────── */}
        <div className={`overflow-hidden transition-all duration-500 ease-out ${showPresets ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Select a Preset</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`group relative p-4 rounded-lg border text-left transition-all duration-300 overflow-hidden ${
                    activePreset === preset.id
                      ? 'border-white/40 bg-white/10 scale-[1.02]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  {activePreset === preset.id && (
                    <div className="absolute inset-0 opacity-20" style={{
                      background: `radial-gradient(ellipse at top left, ${preset.color} 0%, transparent 60%)`
                    }}/>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="text-lg"
                        style={{ color: activePreset === preset.id ? preset.color : 'rgba(255,255,255,0.5)' }}
                      >
                        {preset.icon}
                      </span>
                    </div>
                    <div className={`text-sm font-medium mb-1 ${activePreset === preset.id ? 'text-white' : 'text-white/80'}`}>
                      {preset.name}
                    </div>
                    <p className="text-[10px] text-white/40 leading-tight line-clamp-2">{preset.description}</p>
                  </div>
                  
                  <div 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${activePreset === preset.id ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: preset.color }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            TARGET OUTPUT MODE SELECTOR
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Target Output</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/5">
              {['all', 'image', 'video'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPlatformFilter(filter)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                    platformFilter === filter 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {getFilteredPlatforms().map((platform) => {
              const isActive = targetMode === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform.id)}
                  className={`
                    relative group p-3 rounded-lg border transition-all duration-300 overflow-hidden
                    ${isActive 
                      ? 'border-white/30 bg-white/5' 
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(ellipse at center, ${platform.color} 0%, transparent 70%)`
                      }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span 
                        className="text-xl"
                        style={{ color: isActive ? platform.color : 'rgba(255,255,255,0.5)' }}
                      >
                        {platform.icon}
                      </span>
                      {isActive && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: platform.color }}
                        />
                      )}
                    </div>
                    <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {platform.shortName}
                    </div>
                    <div className={`text-[9px] uppercase tracking-wide mt-0.5 ${platform.type === 'video' ? 'text-purple-400/60' : 'text-blue-400/60'}`}>
                      {platform.type}
                    </div>
                  </div>
                  
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: platform.color }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            SUBJECT INPUT
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Subject</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          
          <div className="relative group">
            <input
              type="text"
              value={promptState.subject}
              onChange={(e) => setPromptState(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Describe your subject... (e.g., 'a lone samurai standing in rainfall')"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">
              {promptState.subject.length > 0 && `${promptState.subject.length} chars`}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            ARSENAL CATEGORIES & CARDS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Construction Bay</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white/[0.02] rounded-lg border border-white/5">
            {Object.entries(arsenal).map(([key, category]) => {
              const isActive = activeCategory === key;
              const hasSelection = promptState[category.stateKey] !== null;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-md text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  <span className="opacity-60">{category.icon}</span>
                  <span>{category.label}</span>
                  {hasSelection && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: currentPlatform.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Cards Grid */}
          <div className="grid grid-cols-4 gap-3">
            {arsenal[activeCategory].cards.map((card) => {
              const isSelected = isCardSelected(activeCategory, card.value);
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(activeCategory, card)}
                  className={`
                    group relative p-4 rounded-lg border text-left transition-all duration-300 overflow-hidden
                    ${isSelected 
                      ? 'border-white/40 bg-white/10 scale-[1.02]' 
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }
                  `}
                >
                  {isSelected && (
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(ellipse at top left, ${currentPlatform.color} 0%, transparent 60%)`
                      }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {card.label}
                      </span>
                      {isSelected && (
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: currentPlatform.color }}
                        >
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/40">{card.desc}</p>
                  </div>
                  
                  <div 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${isSelected ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: currentPlatform.color }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            ASPECT RATIO SELECTOR
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Aspect Ratio</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          
          <div className="flex gap-3">
            {[
              { value: '16:9', label: '16:9', icon: '▬' },
              { value: '9:16', label: '9:16', icon: '▮' },
              { value: '1:1', label: '1:1', icon: '■' },
              { value: '21:9', label: '21:9', icon: '━' }
            ].map((ratio) => {
              const isActive = promptState.aspectRatio === ratio.value;
              return (
                <button
                  key={ratio.value}
                  onClick={() => setPromptState(prev => ({ ...prev, aspectRatio: ratio.value }))}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                    ${isActive 
                      ? 'border-white/30 bg-white/10 text-white' 
                      : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-xs">{ratio.icon}</span>
                  <span className="text-sm">{ratio.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            OUTPUT DISPLAY
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs tracking-[0.2em] text-white/50 uppercase">Generated Output</span>
              <div 
                className="px-2 py-0.5 rounded text-xs transition-colors duration-300"
                style={{ 
                  backgroundColor: `${currentPlatform.color}20`,
                  color: currentPlatform.color
                }}
              >
                {currentPlatform.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTransitioning && (
                <span className="text-xs text-white/30 animate-pulse">Encoding...</span>
              )}
            </div>
          </div>
          
          {/* Output Box */}
          <div 
            className="relative rounded-xl border overflow-hidden"
            style={{ 
              borderColor: `${currentPlatform.color}30`,
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}
          >
            {/* Header bar */}
            <div 
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ 
                borderColor: `${currentPlatform.color}20`,
                background: `linear-gradient(90deg, ${currentPlatform.color}10 0%, transparent 100%)`
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: currentPlatform.color }}>{currentPlatform.icon}</span>
                <span className="text-sm text-white/60">{currentPlatform.name} Format</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            
            {/* Text content */}
            <div className="p-5 min-h-[120px]">
              <p 
                className={`font-mono text-sm leading-relaxed transition-opacity duration-200 ${isTransitioning ? 'text-white/50' : 'text-white/90'}`}
                style={{ wordBreak: 'break-word' }}
              >
                {displayText || 'Select parameters to generate your prompt...'}
              </p>
            </div>
            
            {/* Bottom accent */}
            <div 
              className="h-1"
              style={{ 
                background: `linear-gradient(90deg, ${currentPlatform.color}50 0%, ${currentPlatform.color}20 50%, transparent 100%)`
              }}
            />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            ACTION BUTTONS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="flex items-center gap-4">
          <button
            onClick={handleCopy}
            disabled={isTransitioning}
            className="group relative flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden"
            style={{ 
              backgroundColor: copied ? '#10b981' : currentPlatform.color,
              color: 'black'
            }}
          >
            <span className="relative z-10">
              {copied ? (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>Copy for {currentPlatform.name}</>
              )}
            </span>
          </button>
          
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-5 py-3 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
          
          <div className="flex-1" />
          
          {/* Platform quick switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">Quick:</span>
            {Object.values(platforms).slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => handlePlatformChange(p.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  targetMode === p.id ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                }`}
                style={{ color: targetMode === p.id ? p.color : 'rgba(255,255,255,0.4)' }}
                title={p.name}
              >
                {p.icon}
              </button>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────────────────────────────────── */}
        <footer className="mt-12 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>PROMPT ARMORY v3.0 — Polymorphic Generation System</span>
            <span>11 Platforms • 12 Presets • Press cards to toggle • Switch platforms to transform</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PromptArmory;
