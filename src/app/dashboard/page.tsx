'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CameraModeToggle } from '@/components/CameraModeToggle';
import { DashboardHeaderControls } from '@/components/DashboardHeaderControls';
import { CollapsibleSection } from '@/components/CollapsibleSection';
// import { useViewMode } from '@/hooks/useViewMode'; // Replaced with cameraMode


import { motion } from 'framer-motion';
import { 
  buildMidjourneyPrompt, 
  buildDallePrompt, 
  buildFluxPrompt, 
  buildRunwayPrompt, 
  buildKlingPrompt, 
  VisualPromptInput, 
  VideoPromptInput 
} from '@/lib/builders';


// ═══════════════════════════════════════════════════════════════════════════════
// LENS & CAMERA CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STANDARD_FOCAL_LENGTHS = [
  14, 16, 18, 20,           // Ultra-wide
  21, 24, 28, 35,           // Wide angle
  40, 50, 55,               // Standard
  75, 85, 100, 105,         // Portrait
  135, 150, 180, 200,       // Telephoto
  300, 400, 600             // Super telephoto
];

const F_STOPS = [1.2, 1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16, 22];

const ISO_VALUES = [
  50,    // Extremely fine grain, studio quality
  100,   // Fine grain, daylight standard
  200,   // Slight grain, versatile
  400,   // Moderate grain, film stock standard
  800,   // Noticeable grain, low light
  1600,  // Heavy grain, evening/indoor
  3200,  // Very heavy grain, night scenes
  6400,  // Extreme grain, gritty aesthetic
  12800  // Maximum grain, ultra low light
];

// Aspect ratios
const PHOTO_ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', value: '1:1' },
  { id: '4:5', label: 'Portrait', value: '4:5' },
  { id: '3:2', label: 'Classic Photo', value: '3:2' },
  { id: '16:9', label: 'Wide', value: '16:9' },
];

const CINEMA_ASPECT_RATIOS = [
  { id: '16:9', label: 'HD Standard', value: '16:9' },
  { id: '1.85:1', label: 'Academy Flat', value: '1.85:1' },
  { id: '2.39:1', label: 'Anamorphic', value: '2.39:1' },
  { id: '1.43:1', label: 'IMAX', value: '1.43:1' },
];

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
  
  const [targetMode, setTargetMode] = useState('universal');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [infoModal, setInfoModal] = useState<string | null>(null);
  // const [isSubjectEmpty, setIsSubjectEmpty] = useState(true); // Removed - no longer using subject input
  const [presetBorderColor, setPresetBorderColor] = useState('#ffffff'); // Default white for border glow
  
  // Lens & Camera state
  const [isLensSectionOpen, setIsLensSectionOpen] = useState(false);
  const [focalLengthIndex, setFocalLengthIndex] = useState(10); // Default to 50mm (index 10)
  const [specialtyLens, setSpecialtyLens] = useState<'none' | 'macro' | 'fisheye' | 'tilt-shift'>('none');
  const [apertureIndex, setApertureIndex] = useState(5); // Default to f/5.6 (index 5)
  const [isoIndex, setIsoIndex] = useState(3); // Default to ISO 400 (index 3)
  const [lensEffects, setLensEffects] = useState<string[]>([]);
  const [lensStyle, setLensStyle] = useState<string>('modern');
  
  // Camera Angles & Movement state
  const [isCameraAnglesSectionOpen, setIsCameraAnglesSectionOpen] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string | null>(null);
  const [isCameraMovementSectionOpen, setIsCameraMovementSectionOpen] = useState(false);
  const [selectedCameraMovement, setSelectedCameraMovement] = useState<string | null>(null);
  
  // Film Grain & Texture state
  const [grainAmount, setGrainAmount] = useState(0); // 0=none, 1=subtle, 2=medium, 3=heavy
  const [grainType, setGrainType] = useState<'fine' | 'coarse' | 'digital' | null>(null);
  
  // Aspect Ratio category state
  const [aspectCategory, setAspectCategory] = useState<'photo' | 'cinema'>('cinema');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | null>(null);
  
  // Helper to get current values from indices
  const currentFocalLength = STANDARD_FOCAL_LENGTHS[focalLengthIndex];
  const currentAperture = F_STOPS[apertureIndex];
  const currentISO = ISO_VALUES[isoIndex];
  
  // Debug: Component initialization and constants verification
  useEffect(() => {
    console.log('🚀 === COMPONENT INITIALIZED ===');
    console.log('Constants check:', {
      STANDARD_FOCAL_LENGTHS: STANDARD_FOCAL_LENGTHS?.length,
      F_STOPS: F_STOPS?.length,
      ISO_VALUES: ISO_VALUES?.length
    });
    console.log('Initial indices:', {
      focalLengthIndex,
      apertureIndex,
      isoIndex
    });
    console.log('Initial computed values:', {
      currentFocalLength,
      currentAperture,
      currentISO
    });
  }, []);
  
  const [cameraMode, setCameraMode] = useState<'photography' | 'cinematography'>('photography');
  
  // Collapsible section states - controlled by viewMode
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [targetOutputOpen, setTargetOutputOpen] = useState(true);
  
  // Reset collapsible states when cameraMode changes
  useEffect(() => {
    if (cameraMode === 'photography') {
      // Photography mode: hide camera movement, expand relevant sections
      setTargetOutputOpen(true);
      setPresetsOpen(true);
      setIsLensSectionOpen(true);
      setIsCameraAnglesSectionOpen(true);
      setIsCameraMovementSectionOpen(false); // Hide in photography mode
    } else {
      // Cinematography mode: show all sections including camera movement
      setPresetsOpen(true);
      setTargetOutputOpen(true);
      setIsLensSectionOpen(true);
      setIsCameraAnglesSectionOpen(true);
      setIsCameraMovementSectionOpen(true); // Show in cinematography mode
    }
  }, [cameraMode]);
  
  // Core prompt state object - the "DNA" of our prompt
  const [promptState, setPromptState] = useState<PromptState>({
    // subject removed - prompts now generated from selections only
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
    // UNIVERSAL
    universal: {
      id: 'universal',
      name: 'Universal Standard',
      shortName: 'UNI',
      icon: '✦',
      color: '#ffffff',
      type: 'all',
      description: 'Neutral default. Works with any model.'
    },
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
  
  
  // Camera angles and movement data (used by standalone sections above)
  const cameraAnglesData = {
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
    }
  };
  
  // Aspect ratio categories data
  const aspectRatios = {
    photo: [
      { value: '1:1', label: 'Square', desc: 'Instagram, medium format' },
      { value: '4:5', label: 'Portrait', desc: 'Mobile vertical, stories' },
      { value: '3:2', label: 'Classic Photo', desc: '35mm photo standard' },
      { value: '4:3', label: 'Standard', desc: 'Traditional photography' },
      { value: '16:9', label: 'Panoramic', desc: 'Wide landscapes' }
    ],
    cinema: [
      { value: '16:9', label: 'Widescreen', desc: 'Standard HD video' },
      { value: '1.85:1', label: 'Academy Flat', desc: 'Standard cinema' },
      { value: '2.39:1', label: 'Anamorphic', desc: 'Epic cinema scope' },
      { value: '2.40:1', label: 'Scope', desc: 'Ultra widescreen' },
      { value: '1.43:1', label: 'IMAX', desc: 'Tall immersive format' },
      { value: '1.90:1', label: 'IMAX Digital', desc: 'Modern IMAX' },
      { value: '1.66:1', label: 'Super 16mm', desc: 'Indie film aesthetic' },
      { value: '2.76:1', label: 'Ultra Panavision', desc: 'Ultra-wide epic' },
      { value: '1.37:1', label: 'Classic Academy', desc: 'Old Hollywood' }
    ]
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DETAILED DESCRIPTIONS FOR ALL CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  const cardInfo: Record<string, { name: string; info: string }> = {
    // ═══ PLATFORMS ═══
    'universal': {
      name: 'Universal Standard',
      info: 'A neutral, high-quality default setting designed to work with any AI model. It produces clean, descriptive prompts without model-specific parameters or syntax. Perfect for general use or when switching between different platforms.'
    },
    'midjourney': {
      name: 'Midjourney v6',
      info: 'Known for its high-fidelity, artistic, and painterly results. Midjourney excels at creative interpretation and beautiful compositions with minimal prompting. It has a distinct "opinionated" style that tends towards aesthetically pleasing results. Best for conceptual art, illustrations, and when you want the AI to fill in the gaps with artistic flair. Less precise with complex spatial instructions than DALL-E.'
    },
    'dalle': {
      name: 'DALL-E 3',
      info: 'OpenAI\'s model, integrated with ChatGPT. Unrivaled in natural language understanding and adherence to complex prompt instructions. Can handle specific text rendering and precise spatial relationships better than most models. The aesthetic is cleaner and more "digital" than Midjourney. Great for specific scenes, diagrams, and when exact composition is critical.'
    },
    'ideogram': {
      name: 'Ideogram 2.0',
      info: 'Specialized in typography and text integration within images. If you need a sign, a logo, or a poster with correct spelling, this is the top choice. Also delivers high-quality photorealism and illustration. Balances prompt adherence with artistic quality effectively. Perfect for graphic design tasks and typographic art.'
    },
    'leonardo': {
      name: 'Leonardo AI',
      info: 'Built on Stable Diffusion but with a highly polished user interface and custom fine-tuned models. Offers extensive control features like Image Guidance, Elements, and real-time canvas editing. Great for game assets, character design, and consistent style generation. A bridge between raw Stable Diffusion power and user-friendly design.'
    },
    'stable': {
      name: 'Stable Diffusion',
      info: 'The open-source giant. Offers maximum control and flexibility if you have the technical knowledge. Known for its ability to be fine-tuned on specific concepts. The base models (SDXL, SD3) offer strong performance, but the real power lies in the ecosystem of controlnets and LoRAs. Excellent for specific stylistic mimicry and uncensored creativity.'
    },
    'grok': {
      name: 'Grok (Flux.1)',
      info: 'Powered by the Flux.1 model, known for its exceptional prompt adherence and visual quality. Strikes a balance between the realism of Midjourney and the instruction following of DALL-E 3. Particularly good at photorealistic textures and lighting. Integrated into the X (Twitter) ecosystem for rapid generation.'
    },
    'runway': {
      name: 'Runway Gen-3',
      info: 'A leader in AI video generation. Gen-3 Alpha is known for its high-fidelity motion and realistic physics simulation. Excels at creating cinematic video clips from text or image prompts. Offers advanced controls like Motion Brush and camera controls. Best for realistic stock footage, special effects, and creative video storytelling.'
    },
    'veo': {
      name: 'Google Veo',
      info: 'Google\'s high-definition video generation model. Capable of generating 1080p+ video with consistent characters and cinematic styles. Understands cinematic terms like "timelapse" or "aerial shot" very well. Focused on long-form coherence and high visual quality suitable for professional workflows.'
    },
    'sora': {
      name: 'OpenAI Sora',
      info: 'OpenAI\'s groundbreaking video model that simulates the physical world. Known for generating complex scenes with multiple characters, specific types of motion, and accurate details of subject and background. Can create shots up to a minute long with high visual fidelity. Sets the benchmark for temporal consistency.'
    },
    'pika': {
      name: 'Pika Labs',
      info: 'Video generation tool with a focus on animation and ease of use. Excellent at animating existing images (image-to-video) and adding specific movements like lip-sync. The "Lip Sync" feature is a standout. Great for turning static art into living scenes and for character animation.'
    },
    'kling': {
      name: 'Kling AI',
      info: 'A powerful video generation model from Kuaishou, often compared to Sora for its high motion quality and longer clip durations (up to 2 minutes). excels at complex movements and realistic human actions. Offers both high-quality and high-performance modes. A strong contender for realistic video generation.'
    },

    // ═══ CAMERA ANGLES ═══
    'low': {
      name: 'Low Angle',
      info: 'Camera positioned below eye level, looking up at the subject. Creates a sense of power, dominance, and heroism. Makes subjects appear larger, more imposing, and authoritative. Commonly used for hero shots, villain reveals, and moments of triumph. The lower the angle, the more dramatic the effect. Often paired with wide lenses to exaggerate the perspective.'
    },
    'high': {
      name: 'High Angle',
      info: 'Camera positioned above eye level, looking down at the subject. Creates feelings of vulnerability, weakness, or insignificance. Makes subjects appear smaller and less powerful. Often used to show a character\'s emotional low point, isolation, or to establish dominance of another character. Can also provide an objective, observational perspective on a scene.'
    },
    'dutch': {
      name: 'Dutch Angle',
      info: 'Camera tilted on its axis to create a diagonal horizon line. Instantly creates tension, unease, disorientation, or psychological instability. Popular in thriller, horror, and noir genres. Suggests something is "off" or wrong in the scene. Should be used sparingly for maximum impact—overuse diminishes its effect. Often combined with other dramatic techniques.'
    },
    'eye': {
      name: 'Eye Level',
      info: 'Camera positioned at the subject\'s eye level, creating a neutral, natural perspective. The most common and "invisible" angle—viewers don\'t consciously notice it. Creates intimacy and connection with the subject. Ideal for dialogue scenes, interviews, and moments requiring emotional authenticity. Establishes equality between the viewer and subject.'
    },
    'birds': {
      name: 'Bird\'s Eye View',
      info: 'Extreme high angle shot looking directly down from above. Creates a godlike, omniscient perspective. Subjects appear small and part of a larger pattern or environment. Often used for establishing shots, chase sequences, or to show spatial relationships. Can evoke feelings of fate, destiny, or insignificance. Requires drone or elevated camera positions.'
    },
    'worms': {
      name: 'Worm\'s Eye View',
      info: 'Extreme low angle shot looking straight up from ground level. The most dramatic low angle possible, creating maximum impact and intimidation. Subjects tower over the frame, appearing almost superhuman. Buildings and environments become towering, epic structures. Often used in action films, superhero content, and architectural photography.'
    },
    'over': {
      name: 'Over-the-Shoulder',
      info: 'Camera positioned behind one character\'s shoulder, looking at another character or point of interest. Creates intimacy while maintaining spatial awareness. Essential for dialogue scenes, establishing eyelines and relationships. The shoulder in frame grounds the viewer in the scene. Alternating between characters creates the classic shot-reverse-shot pattern.'
    },
    'pov': {
      name: 'POV Shot',
      info: 'Camera shows exactly what a character sees from their perspective. Creates maximum immersion and identification with the character. Used for subjective experiences, discoveries, and moments of realization. Can be combined with camera movement to simulate walking, running, or searching. Essential for horror reveals, action sequences, and emotional moments.'
    },
    
    // ═══ CAMERA MOVEMENT ═══
    'push': {
      name: 'Push In',
      info: 'Camera moves toward the subject, increasing intimacy and intensity. Draws the viewer\'s attention and signifies importance. Often used for emotional revelations, dramatic moments, or to focus on a specific detail. The speed of the push affects the mood—slow for drama, fast for urgency. Also called a "dolly in" when using a dolly track.'
    },
    'pull': {
      name: 'Pull Out',
      info: 'Camera moves away from the subject, revealing more of the environment. Creates context, shows scale, or signifies emotional distance. Often used for endings, moments of isolation, or to reveal surprising information about the surroundings. Can create feelings of abandonment or provide a more objective viewpoint. Also called a "dolly out."'
    },
    'dolly': {
      name: 'Dolly Shot',
      info: 'Camera moves smoothly on a wheeled platform or track, parallel to the action. Creates elegant, stable lateral movement. Often used to follow characters, reveal information progressively, or create visual rhythm. The smoothness distinguishes it from handheld movement. Can track alongside, ahead of, or behind subjects. Named after the wheeled platform ("dolly") used.'
    },
    'crane': {
      name: 'Crane Shot',
      info: 'Camera mounted on a crane or jib, enabling sweeping vertical and horizontal movement. Creates epic, grand movements impossible with other methods. Often used for dramatic reveals, opening shots, or to transition between ground and aerial perspectives. Communicates production value and cinematic ambition. Can float over obstacles and crowds.'
    },
    'orbit': {
      name: 'Orbital Shot',
      info: 'Camera circles around the subject in a 360-degree arc. Creates dynamic visual interest and emphasizes the subject\'s importance. Often used for hero moments, romantic scenes, or dramatic revelations. The continuous movement keeps the viewer engaged. Can be combined with slow motion for extra impact. Requires careful choreography.'
    },
    'whip': {
      name: 'Whip Pan',
      info: 'Extremely fast horizontal camera movement that blurs the image. Creates energy, urgency, and dynamic transitions between scenes or subjects. Often used to connect two related moments or to convey chaotic action. The blur can mask cuts, making it a useful editing tool. Should be used sparingly to maintain impact.'
    },
    'handheld': {
      name: 'Handheld',
      info: 'Camera operated by hand without stabilization, creating organic, slightly shaky movement. Adds realism, immediacy, and raw energy. Essential for documentary-style content, action sequences, and intimate dramatic moments. The imperfection creates authenticity and puts viewers "in the moment." Varying degrees from subtle to aggressive shaking.'
    },
    'steadicam': {
      name: 'Steadicam Shot',
      info: 'Camera mounted on a stabilizing harness worn by the operator, enabling smooth movement while walking or running. Combines the mobility of handheld with the smoothness of dolly shots. Perfect for following characters through complex environments. Creates a floating, ethereal quality. Made famous by films like The Shining and Goodfellas.'
    },
    
    // ═══ LENSES ═══
    '14mm': {
      name: '14mm Ultra Wide',
      info: 'Extremely wide field of view with significant barrel distortion. Exaggerates depth and perspective—objects near the lens appear huge, distant objects tiny. Creates dramatic, almost surreal images. Lines near the edges curve outward. Used for epic landscapes, tight spaces, and stylized dramatic effect. Faces distort unflattering if too close.'
    },
    '24mm': {
      name: '24mm Wide',
      info: 'Wide-angle lens balancing environmental context with manageable distortion. Excellent for establishing shots, interiors, and environmental portraits. Provides depth while keeping distortion subtle enough for natural-looking images. A favorite for documentary and journalism. Good for showing subjects within their surroundings.'
    },
    '35mm': {
      name: '35mm',
      info: 'The classic cinematic focal length, offering a field of view close to human peripheral vision. Natural-looking perspective with minimal distortion. Versatile for almost any situation—dialogue, action, establishing shots. Many iconic films shot primarily on 35mm. The "workhorse" lens of professional cinematography.'
    },
    '50mm': {
      name: '50mm',
      info: 'Often called the "normal" lens as it most closely matches human central vision. Minimal distortion with natural-looking proportions. Excellent for dialogue scenes, portraits, and intimate moments. Forces the filmmaker to compose thoughtfully. The slight compression starts to separate subjects from backgrounds.'
    },
    '85mm': {
      name: '85mm Portrait',
      info: 'The portrait photographer\'s favorite, offering beautiful compression and background separation. Flatters facial features by slightly compressing them. Creates creamy, blurred backgrounds (bokeh) at wide apertures. Ideal for close-ups, beauty shots, and emotional moments. Requires more distance from subjects, creating a more intimate feel.'
    },
    '135mm': {
      name: '135mm Telephoto',
      info: 'Strong compression that flattens depth and brings backgrounds closer to subjects. Isolates subjects dramatically from their environment. Creates intimate shots from a distance—perfect for candid moments. Stacks elements in the frame for graphic compositions. Popular for portrait work, sports, and surveillance-style shots.'
    },
    'macro': {
      name: 'Macro Lens',
      info: 'Specialized lens for extreme close-up photography at 1:1 magnification or greater. Reveals details invisible to the naked eye—textures, patterns, tiny subjects. Creates abstract, otherworldly images from everyday objects. Extremely shallow depth of field at close distances. Used for product detail, nature, and artistic exploration.'
    },
    'anamorphic': {
      name: 'Anamorphic Lens',
      info: 'Special lenses that squeeze a wide image onto standard film/sensor, then stretch it back for viewing. Creates the classic widescreen cinematic look with distinctive characteristics: horizontal lens flares, oval bokeh, and subtle edge distortion. Used in countless Hollywood blockbusters. Instantly elevates production value and visual style.'
    },
    
    // ═══ LIGHTING ═══
    'golden': {
      name: 'Golden Hour',
      info: 'The magical time shortly after sunrise or before sunset when sunlight is warm, soft, and directional. Creates naturally flattering light with long shadows and golden tones. Beloved by photographers and cinematographers worldwide. Skin glows, landscapes transform, and everything looks romantic. Limited window requires careful planning.'
    },
    'blue': {
      name: 'Blue Hour',
      info: 'The twilight period before sunrise or after sunset when the sky turns deep blue. Creates moody, mysterious, and melancholic atmosphere. Natural light is soft and even, mixing with artificial lights for beautiful contrasts. Popular for city scenes, establishing shots, and contemplative moments. Even shorter window than golden hour.'
    },
    'neon': {
      name: 'Neon Noir',
      info: 'Stylized lighting using neon colors—typically cyan, magenta, and purple—creating a futuristic, cyberpunk aesthetic. References blade Runner, Drive, and modern neo-noir. Creates strong color contrasts and moody atmosphere. Often uses practicals (neon signs, LED strips) as light sources. Popular in music videos and stylized narratives.'
    },
    'rim': {
      name: 'Dramatic Rim Light',
      info: 'Strong backlight that creates a bright outline around the subject\'s edges, separating them from the background. Creates depth, drama, and visual interest. Often called "edge light" or "hair light" in portrait setups. Can be subtle or intense depending on mood. Essential technique for three-dimensional lighting.'
    },
    'chiaroscuro': {
      name: 'Chiaroscuro',
      info: 'Renaissance painting technique using strong contrasts between light and dark. Creates dramatic, moody, artistic images with deep shadows. Light sources are often singular and directional. Made famous by Caravaggio and used extensively in film noir. Emphasizes form, drama, and emotional intensity. Hides as much as it reveals.'
    },
    'volumetric': {
      name: 'Volumetric God Rays',
      info: 'Visible beams of light cutting through atmosphere—dust, fog, or haze. Creates ethereal, spiritual, almost supernatural atmosphere. Named "god rays" for their heavenly appearance. Often seen through windows, trees, or other occluding objects. Adds depth and dimension to scenes. Can be natural or created with atmospheric effects.'
    },
    'practical': {
      name: 'Practical Lighting',
      info: 'Using light sources visible in the scene—lamps, candles, screens, windows—as the actual lighting for the shot. Creates naturalistic, motivated lighting that feels authentic. Each light source has a reason to exist in the story. Popular in modern filmmaking for its realism. Requires careful balancing and often augmentation.'
    },
    'silhouette': {
      name: 'Silhouette Backlight',
      info: 'Strong backlight with no fill, rendering the subject as a dark shape against a bright background. Creates mystery, anonymity, and graphic visual impact. The viewer\'s imagination fills in unseen details. Powerful for reveals, mystery, and artistic compositions. Shape and outline become the primary visual elements.'
    },
    
    // ═══ VISUAL STYLES ═══
    'cinematic': {
      name: 'Cinematic',
      info: 'The polished, professional look of theatrical films. Characterized by shallow depth of field, careful composition, motivated lighting, and color grading. Wide aspect ratios (2.39:1 or 1.85:1) enhance the effect. Movements are smooth and purposeful. Every frame could be a photograph. The gold standard of visual production.'
    },
    'hyperreal': {
      name: 'Hyperrealistic',
      info: 'Extreme detail and clarity that surpasses what the human eye naturally sees. Sharp focus throughout, rich textures, and vivid colors. Often associated with 8K resolution and modern digital capture. Can feel almost too perfect, creating an otherworldly precision. Popular for product visualization and high-end commercial work.'
    },
    'noir': {
      name: 'Film Noir',
      info: 'The moody, shadowy style of 1940s-50s crime dramas. High contrast black and white (or desaturated color), dramatic shadows, venetian blind patterns. Urban settings, rain-slicked streets, and morally ambiguous characters. Influenced by German Expressionism. Creates atmosphere of mystery, danger, and moral complexity.'
    },
    'scifi': {
      name: 'Epic Sci-Fi',
      info: 'The grand visual language of science fiction cinema. Vast scale, futuristic environments, and technological wonder. Often features cool blue color palettes, lens flares, and smooth, advanced surfaces. References Blade Runner, 2001, and modern Marvel/DC films. Combines practical effects with CGI for immersive worlds.'
    },
    'anime': {
      name: 'Anime Cinematic',
      info: 'The stylized aesthetic of Japanese animation applied to prompts. Bold outlines, vibrant colors, dramatic lighting, and expressive compositions. Large eyes, dynamic poses, and exaggerated emotions. Can range from realistic to highly stylized. References Studio Ghibli, Makoto Shinkai, and modern anime productions.'
    },
    'fantasy': {
      name: 'Dark Fantasy',
      info: 'Gothic, mysterious, and often ominous aesthetic. Rich, deep colors—blacks, deep reds, forest greens. Ancient architecture, mystical elements, and supernatural atmosphere. References Game of Thrones, Lord of the Rings, and Dark Souls. Combines beauty with danger, wonder with dread. Medieval or timeless settings.'
    },
    'documentary': {
      name: 'Documentary Style',
      info: 'Raw, authentic, observational aesthetic that prioritizes truth over beauty. Natural lighting, handheld camera work, and unpolished moments. Subjects are captured rather than directed. Creates intimacy and credibility. Often features talking heads, real locations, and available light. The invisible camera approach.'
    },
    'retro': {
      name: 'Retro 70s Film',
      info: 'The warm, grainy aesthetic of 1970s cinema. Soft focus, muted colors with warm tones, visible grain, and subtle halation. References Spielberg, Scorsese, and the New Hollywood era. Often features earth tones, wood paneling, and vintage fashion. Creates nostalgia and timeless quality. Film imperfections add character.'
    },
    
    // ═══ FILM STOCKS ═══
    'kodak5219': {
      name: 'Kodak Vision3 500T',
      info: 'The Hollywood industry standard for tungsten-lit scenes. This high-speed film stock delivers warm, rich shadows with exceptional latitude. Known for its ability to handle mixed lighting and low-light situations while maintaining natural skin tones. Produces a classic cinematic look with slightly warm highlights and deep, creamy blacks. Used extensively in major motion pictures for night interiors and dramatic scenes.'
    },
    'kodak5207': {
      name: 'Kodak Vision3 250D',
      info: 'The premier daylight-balanced motion picture film stock. Offers incredibly fine grain with outstanding color accuracy and natural saturation. Excels in outdoor and well-lit environments, rendering blues and greens with stunning clarity. Provides excellent skin tone reproduction and smooth gradations. The go-to choice for daytime exteriors in professional filmmaking, delivering a clean, timeless aesthetic.'
    },
    'fuji': {
      name: 'Fujifilm Eterna',
      info: 'Renowned for its soft, elegant rendering and subtle color palette. Eterna produces muted, sophisticated tones with gentle highlight roll-off. Particularly praised for its flattering skin tone reproduction and ability to create a dreamy, ethereal atmosphere. The film delivers slightly cooler shadows and pastel-like colors, making it ideal for romantic dramas, period pieces, and any scene requiring understated elegance.'
    },
    'portra': {
      name: 'Kodak Portra 400',
      info: 'The portrait photographer\'s beloved film stock, famous for its warm, flattering skin tones and pastel color palette. Portra delivers soft, creamy highlights with exceptional exposure latitude. Colors lean warm with peachy skin tones, soft greens, and golden highlights. The subtle grain structure adds organic texture without being distracting. Perfect for portraits, weddings, fashion, and lifestyle imagery with a timeless, romantic quality.'
    },
    'ektar': {
      name: 'Kodak Ektar 100',
      info: 'The world\'s finest grain color negative film, delivering ultra-sharp images with vivid, punchy colors. Ektar produces highly saturated reds, blues, and greens with exceptional clarity. Unlike the softer Portra, Ektar is bold and graphic with strong contrast. Ideal for landscapes, product photography, and any scene where you want colors to pop. The extremely fine grain allows for significant enlargement while maintaining detail.'
    },
    'cinestill': {
      name: 'CineStill 800T',
      info: 'A unique tungsten-balanced film created from Kodak motion picture stock with the remjet layer removed. Famous for its distinctive "halation" effect—a red/orange glow around bright light sources like neon signs and streetlights. This creates an instantly recognizable cinematic night-time aesthetic. Colors are warm with cyan-shifted shadows. The perfect choice for urban night photography, neon-lit scenes, and creating that nostalgic 80s/90s movie look.'
    },
    'ilford': {
      name: 'Ilford HP5 Plus 400',
      info: 'A legendary black-and-white film stock known for its versatility and forgiving nature. HP5 delivers rich midtones with smooth tonal gradation and pleasant grain structure. Extremely flexible with exposure—can be pushed to 3200 ISO while maintaining quality. Produces classic, timeless monochrome images with good shadow detail and clean highlights. A favorite among photojournalists, street photographers, and anyone seeking authentic black-and-white imagery.'
    },
    'trix': {
      name: 'Kodak Tri-X 400',
      info: 'The iconic black-and-white film that defined photojournalism and documentary photography. Tri-X is known for its distinctive, gritty grain structure and punchy contrast. Delivers deep blacks and bright whites with strong tonal separation. More contrasty than HP5, giving images an immediate, impactful quality. Used by legendary photographers for decades, it carries the visual DNA of classic street photography, war documentation, and raw, honest imagery.'
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PROMPT GENERATORS (Platform-Specific Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  
  const generatePrompt = useCallback((state: PromptState, platform: string) => {
    console.log('🎬 === GENERATE PROMPT CALLED ===');
    console.log('Platform:', platform);
    console.log('PromptState:', state);
    console.log('SubjectInput:', subjectInput);
    console.log('ActivePreset:', activePreset);
    
    const { angle, movement, lens, lighting, style, filmStock, aspectRatio } = state;
    // Use user's subject input as primary, fall back to preset name if empty
    const subjectText = subjectInput?.trim() || 
      (activePreset ? presets.find(p => p.id === activePreset)?.name : null) || 
      'Describe your subject above';
    
    // Common Input Object
    const lensPromptText = generateLensPrompt();
    const grainPromptText = generateGrainPrompt();
    
    // Get selected angle and movement values
    const selectedAngleValue = selectedCameraAngle 
      ? cameraAnglesData.camera.cards.find(c => c.id === selectedCameraAngle)?.value 
      : angle;
    const selectedMovementValue = selectedCameraMovement 
      ? cameraAnglesData.movement.cards.find(c => c.id === selectedCameraMovement)?.value 
      : movement;
    
    const visualInput: VisualPromptInput = {
      subject: subjectText,
      action: null, // Not currently captured in state
      environment: null, // Not currently captured in state
      lighting,
      filmStock,
      style,
      camera: {
        angle: selectedAngleValue || null,
        movement: selectedMovementValue || null,
        lens
      },
      aspectRatio: aspectRatio as any,
      lensSettings: lensPromptText, // Generated lens prompt as string
      grainSettings: grainPromptText, // Generated grain prompt as string
    };

    const videoInput: VideoPromptInput = {
      ...visualInput,
      subjectAction: null,
      cameraMovement: movement,
    };

    switch (platform) {
      case 'midjourney':
        const mjResult = buildMidjourneyPrompt(visualInput);
        console.log('✅ Midjourney prompt:', mjResult);
        return mjResult;
      
      case 'dalle':
        return buildDallePrompt(visualInput);
      
      case 'grok': // Using Flux builder for Grok
        return buildFluxPrompt(visualInput);
      
      case 'runway':
        return buildRunwayPrompt(videoInput);
      
      case 'kling':
        return buildKlingPrompt(videoInput);
        
      // Legacy/Default handling for others (keeping original logic structure for now)
      case 'universal': {
        let prompt = subjectText;
        if (style) prompt += ` in a ${style} style`;
        const attributes = [lighting, angle, lens, movement, filmStock ? `shot on ${filmStock}` : null]
          .filter(Boolean)
          .join(', ');
        if (attributes) prompt += `. ${attributes}`;
        prompt += '.';
        return prompt;
      }

      case 'veo': {
        const cinematography = [angle, movement].filter(Boolean).join(', ') || 'Standard composition';
        const context = [lighting, style, filmStock ? `${filmStock} look` : null].filter(Boolean).join(', ') || 'Natural environment';
        let prompt = `Cinematography: ${cinematography}. Subject: ${subjectText}. Context: ${context}.`;
        if (lens) prompt += ` Technical: ${lens}.`;
        return prompt;
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
    console.log('⚡ === USEEFFECT TRIGGERED ===');
    
    const newPrompt = generateCompletePrompt();
    console.log('📝 New prompt generated:', newPrompt);
    
    animateCipherDecode(newPrompt);
    console.log('✅ Prompt sent to animation');
    
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [
    subjectInput,
    activePreset,
    focalLengthIndex,
    specialtyLens,
    apertureIndex,
    isoIndex,
    lensEffects,          // CRITICAL - was missing
    lensStyle,            // CRITICAL - was missing
    selectedCameraAngle,
    selectedCameraMovement,
    selectedAspectRatio,  // CRITICAL - was missing
    cameraMode
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  
  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id);
    setPresetBorderColor(preset.color); // Update border glow color
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
    setSubjectInput('');
    setSelectedAspectRatio(null);
    setPromptState({
      // subject removed - no longer needed
      angle: null,
      movement: null,
      lens: null,
      lighting: null,
      style: null,
      filmStock: null,
      aspectRatio: '16:9'
    });
  };


  const getActiveSelectionsCount = () => {
    return Object.entries(promptState).filter(([k, v]) => v !== null && v !== '' && k !== 'aspectRatio').length;
  };

  const getFilteredPlatforms = () => {
    if (platformFilter === 'all') return Object.values(platforms);
    return Object.values(platforms).filter(p => p.type === platformFilter);
  };

  const currentPlatform = platforms[targetMode];

  // Get the active preset's color for ambient background
  const activePresetColor = activePreset 
    ? presets.find(p => p.id === activePreset)?.color ?? '#ffffff'
    : '#ffffff'; // Default to white when no preset selected
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LENS & CAMERA HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  function getFocalLengthDescription(mm: number): string {
    if (mm < 21) return "Ultra-wide perspective. Expansive, dramatic, exaggerated depth. Slight distortion at edges.";
    if (mm < 40) return "Wide angle. Environmental context, natural perspective, subtle distortion.";
    if (mm < 70) return "Standard focal length. Natural 'human eye' perspective. Versatile for most scenes.";
    if (mm < 135) return "Portrait range. Flattering compression, background separation, shallow depth of field.";
    return "Telephoto. Extreme compression, isolates subject, magnifies distant details.";
  }

  function getApertureDescription(fStop: number): string {
    if (fStop <= 1.4) return "Ultra-shallow depth of field. Subject sharp, everything else beautifully blurred. Professional portrait look.";
    if (fStop <= 2.8) return "Shallow depth of field. Good subject separation with soft background blur. Cinematic look.";
    if (fStop <= 5.6) return "Moderate depth of field. Subject and some context sharp. Balanced, versatile.";
    if (fStop <= 11) return "Deep depth of field. Most of scene in focus. Good for landscapes and group shots.";
    return "Maximum depth of field. Everything sharp from foreground to background. Landscape/architecture.";
  }

  function getISODescription(iso: number): string {
    if (iso <= 100) {
      return "Extremely fine grain, clean image. Studio quality, bright daylight. Minimal noise.";
    } else if (iso <= 200) {
      return "Fine grain, crisp detail. Bright conditions, commercial work. Subtle texture.";
    } else if (iso <= 400) {
      return "Moderate grain, film stock standard. Balanced, versatile. Classic film aesthetic.";
    } else if (iso <= 800) {
      return "Noticeable grain, low light capable. Evening, overcast. Visible texture.";
    } else if (iso <= 1600) {
      return "Heavy grain, moody aesthetic. Indoor, dusk. Strong film character.";
    } else if (iso <= 3200) {
      return "Very heavy grain, night scenes. Gritty, dramatic. Vintage film look.";
    } else {
      return "Extreme grain, ultra low light. Maximum texture. Documentary/guerrilla aesthetic.";
    }
  }

  function getGrainDescriptionFromISO(iso: number): string {
    if (iso <= 100) {
      return 'pristine clean image, no grain';
    } else if (iso <= 200) {
      return 'very fine grain, clean';
    } else if (iso <= 400) {
      return 'subtle film grain';
    } else if (iso <= 800) {
      return 'moderate film grain, grainy texture';
    } else if (iso <= 1600) {
      return 'noticeable film grain, textured';
    } else if (iso <= 3200) {
      return 'heavy film grain, gritty, grainy';
    } else if (iso <= 6400) {
      return 'very heavy film grain, extremely grainy, rough texture';
    } else {
      return 'extreme film grain, ultra grainy, heavily textured, noise, gritty';
    }
  }

  function toggleLensEffect(effect: string) {
    console.log('🎨 Effect toggled:', effect);
    setLensEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  }

  function toggleSpecialtyLens(lens: 'macro' | 'fisheye' | 'tilt-shift') {
    setSpecialtyLens(prev => prev === lens ? 'none' : lens);
  }

  function generateCompletePrompt(): string {
    console.log('🎬 ===== GENERATING COMPLETE PROMPT =====');
    
    const parts: string[] = [];
    
    // 1. SUBJECT
    if (subjectInput && subjectInput.trim()) {
      parts.push(subjectInput.trim());
      console.log('✅ Subject:', subjectInput.trim());
    } else {
      console.log('⚠️ No subject');
    }
    
    // 2. PRESET
    if (activePreset) {
      const presetData = presets.find(p => p.id === activePreset);
      if (presetData) {
        parts.push(presetData.name);
        console.log('✅ Preset:', presetData.name);
      }
    }
    
    // 3. FOCAL LENGTH
    if (specialtyLens !== 'none') {
      if (specialtyLens === 'macro') {
        parts.push('macro lens, extreme close-up');
      } else if (specialtyLens === 'fisheye') {
        parts.push('fisheye lens, 180 degree view');
      } else if (specialtyLens === 'tilt-shift') {
        parts.push('tilt-shift lens, selective focus');
      }
      console.log('✅ Specialty lens:', specialtyLens);
    } else if (currentFocalLength) {
      parts.push(`${currentFocalLength}mm lens`);
      console.log('✅ Focal length:', currentFocalLength);
    }
    
    // 4. APERTURE
    if (currentAperture) {
      parts.push(`f/${currentAperture}`);
      if (currentAperture <= 2.0) {
        parts.push('extremely shallow depth of field, bokeh');
      } else if (currentAperture <= 4.0) {
        parts.push('shallow depth of field');
      } else if (currentAperture <= 8.0) {
        parts.push('moderate depth of field');
      } else {
        parts.push('deep focus');
      }
      console.log('✅ Aperture:', currentAperture);
    }
    
    // 5. ISO / GRAIN
    if (currentISO) {
      const grainDesc = getGrainDescriptionFromISO(currentISO);
      parts.push(grainDesc);
      console.log('✅ ISO/Grain:', currentISO, '→', grainDesc);
    }
    
    // 6. LENS EFFECTS
    if (lensEffects && lensEffects.length > 0) {
      console.log('✅ Lens effects:', lensEffects);
      const effectMap: Record<string, string> = {
        'lens-flare': 'cinematic lens flare',
        'bokeh': 'beautiful bokeh highlights',
        'vignette': 'natural vignette, darkened corners',
        'chromatic': 'chromatic aberration',
        'light-leaks': 'film light leaks',
        'soft-glow': 'soft glow, halation',
        'anamorphic-flare': 'anamorphic horizontal flare',
        'distortion': 'barrel distortion'
      };
      lensEffects.forEach(effect => {
        if (effectMap[effect]) parts.push(effectMap[effect]);
      });
    }
    
    // 7. LENS STYLE
    if (lensStyle && lensStyle !== 'modern') {
      console.log('✅ Lens style:', lensStyle);
      const styleMap: Record<string, string> = {
        'vintage': 'vintage cinema lens, warm tones, classic film aesthetic',
        'soft': 'soft focus, dreamy aesthetic, diffused',
        'high-contrast': 'high contrast, punchy',
        'film-stock': 'film stock emulation, analog look'
      };
      if (styleMap[lensStyle]) parts.push(styleMap[lensStyle]);
    }
    
    // 8. CAMERA ANGLE
    if (selectedCameraAngle) {
      console.log('✅ Camera angle:', selectedCameraAngle);
      const angleMap: Record<string, string> = {
        'eye-level': 'eye level angle',
        'low-angle': 'low angle shot, looking up',
        'high-angle': 'high angle shot, looking down',
        'dutch-angle': 'dutch angle, tilted',
        'birds-eye': "bird's eye view, overhead",
        'worms-eye': "worm's eye view, ground level",
        'over-shoulder': 'over the shoulder shot',
        'pov-shot': 'POV first person perspective'
      };
      if (angleMap[selectedCameraAngle]) parts.push(angleMap[selectedCameraAngle]);
    }
    
    // 9. CAMERA MOVEMENT (cinematography mode only)
    if (selectedCameraMovement && cameraMode === 'cinematography') {
      console.log('✅ Camera movement:', selectedCameraMovement);
      const movementMap: Record<string, string> = {
        'static': 'static shot, locked camera',
        'pan': 'panning camera movement',
        'tilt': 'tilting camera movement',
        'dolly': 'dolly shot, moving forward',
        'tracking': 'tracking shot, following subject',
        'crane': 'crane shot, sweeping movement',
        'steadicam': 'steadicam, smooth flowing',
        'handheld': 'handheld camera, natural shake',
        'zoom': 'zoom movement',
        'whip-pan': 'whip pan, fast blur',
        'orbit': 'orbiting camera, 360 movement',
        'drone': 'drone shot, aerial'
      };
      if (movementMap[selectedCameraMovement]) parts.push(movementMap[selectedCameraMovement]);
    }
    
    // 10. ASPECT RATIO
    if (selectedAspectRatio) {
      console.log('✅ Aspect ratio:', selectedAspectRatio);
      const ratioMap: Record<string, string> = {
        '1:1': 'square format composition',
        '4:5': 'vertical portrait format',
        '3:2': 'classic photo format',
        '16:9': 'widescreen format',
        '1.85:1': 'academy flat cinema format',
        '2.39:1': 'anamorphic widescreen format',
        '1.43:1': 'IMAX format'
      };
      if (ratioMap[selectedAspectRatio]) parts.push(ratioMap[selectedAspectRatio]);
    }
    
    const finalPrompt = parts.filter(Boolean).join(', ');
    console.log('✅ ===== FINAL PROMPT =====');
    console.log(finalPrompt);
    console.log('===========================');
    
    return finalPrompt;
  }

  function generateGrainPrompt(): string {
    if (grainAmount === 0) return '';
    
    const grainLevels = ['', 'subtle film grain', 'medium film grain', 'heavy film grain, gritty texture'];
    const grainTypes = {
      fine: 'fine grain texture, 35mm film quality',
      coarse: 'coarse grain, 16mm aesthetic, high ISO look',
      digital: 'digital noise, high ISO sensor artifact'
    };
    
    const parts = [grainLevels[grainAmount]];
    if (grainType && grainAmount > 0) {
      parts.push(grainTypes[grainType]);
    }
    
    return parts.filter(Boolean).join(', ');
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-white/20">
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[100px] animate-pulse"
            style={{ backgroundColor: activePresetColor, animationDuration: '8s' }}
          />
          <div 
            className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px]"
            style={{ backgroundColor: '#ffffff', animation: 'float 20s infinite ease-in-out alternate' }}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <header className="mb-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 sm:pb-6 gap-4">
            {/* LEFT SIDE: Identity & System State */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* App Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border border-white/20 flex items-center justify-center bg-white/5">
                  <span className="text-lg sm:text-xl font-bold text-white">◇</span>
                </div>
              </div>
              
              {/* Title & Version */}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-white">
                  PROMPT <span className="font-bold text-cyan-500">ARMORY</span>
                </h1>
                <p className="text-white/40 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase">
                  V3.0 • {getActiveSelectionsCount()} Active Selections
                </p>
              </div>
              
            </div>
            
            {/* RIGHT SIDE: Navigation Stack */}
            <DashboardHeaderControls currentApp="visual" />
          </div>
          
          {/* Status and Toggle Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 mb-4 sm:mb-6 gap-3 sm:gap-0">
            {/* Left: Status Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">System Online</span>
              <div className="hidden sm:block h-px w-12 bg-white/20" />
            </div>
            
            {/* Right: PHOTOGRAPHY/CINEMATOGRAPHY Toggle */}
            <div className="w-full sm:w-auto flex justify-center">
              <CameraModeToggle cameraMode={cameraMode} setCameraMode={setCameraMode} />
            </div>
          </div>
        </header>

        {/* Mode Description */}
        <p className="text-center text-sm text-gray-400 mb-8 px-4">
          {cameraMode === 'photography' 
            ? 'Optimized for single frame composition and still imagery'
            : 'Optimized for motion picture storytelling and sequential frames'
          }
        </p>


        {/* DEBUG PANEL - REMOVE AFTER TESTING */}
        <div className="fixed top-20 right-4 z-50 bg-red-900/90 border-2 border-red-500 rounded-lg p-4 max-w-sm">
          <h3 className="text-red-400 font-bold mb-2 text-sm">🐛 DEBUG PANEL</h3>
          
          <button
            onClick={() => {
              console.clear();
              console.log('=== MANUAL DEBUG TRIGGER ===');
              console.log('Current State:', {
                subjectInput,
                activePreset,
                focalLengthIndex,
                currentFocalLength,
                apertureIndex,
                currentAperture,
                isoIndex,
                currentISO,
                selectedCameraAngle,
                selectedCameraMovement,
                displayText
              });
              
              const testPrompt = generatePrompt(promptState, targetMode);
              console.log('Test prompt generation:', testPrompt);
              
              alert(`Subject: ${subjectInput || 'EMPTY'}\nFocal: ${currentFocalLength}mm\nAperture: f/${currentAperture}\nISO: ${currentISO}\nDisplay: ${displayText.substring(0, 50)}...`);
            }}
            className="w-full px-3 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-400 text-sm mb-2"
          >
            📊 Log Current State
          </button>
          
          <button
            onClick={() => {
              const simple = [
                subjectInput,
                `${currentFocalLength}mm`,
                `f/${currentAperture}`,
                `ISO ${currentISO}`,
                selectedCameraAngle || ''
              ].filter(Boolean).join(', ');
              
              console.log('Simple prompt:', simple);
              navigator.clipboard.writeText(simple);
              alert('Simple prompt copied:\n' + simple);
            }}
            className="w-full px-3 py-2 bg-yellow-600 text-white rounded font-semibold hover:bg-yellow-500 text-sm"
          >
            📋 Copy Simple Prompt
          </button>
          
          <div className="mt-2 text-xs text-gray-300">
            <div>Focal: {currentFocalLength}mm</div>
            <div>ISO: {currentISO}</div>
            <div>Display: {displayText?.length || 0} chars</div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            1. SELECT A PRESET (Optional) - Top
        ───────────────────────────────────────────────────────────────────── */}
        <CollapsibleSection 
          title="Select a Preset" 
          optional 
          isOpen={presetsOpen}
          onToggle={() => setPresetsOpen(!presetsOpen)}
        >
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
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
        </CollapsibleSection>





        {/* ─────────────────────────────────────────────────────────────────────
            YOUR SUBJECT
        ───────────────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Your Subject</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            <span className="text-xs text-amber-400 uppercase tracking-wider">Required</span>
          </div>
          
          <textarea
            value={subjectInput}
            onChange={(e) => {
              const newValue = e.target.value;
              console.log('📝 Subject changed:', newValue);
              setSubjectInput(newValue);
            }}
            placeholder="Describe what you want to create... (e.g., 'a lone samurai standing in rainfall', 'sunset over mountains', 'portrait of elderly woman')"
            className="
              w-full 
              h-32
              p-4 
              bg-black/80 
              border-2 border-white/10
              hover:border-white/20
              focus:border-cyan-500 
              rounded-lg
              text-base text-white/90
              placeholder:text-white/30
              focus:outline-none
              focus:ring-2 focus:ring-cyan-500/50
              transition-all
              resize-none
              font-light
            "
          />
          
          <div className="mt-2 flex items-start gap-2 text-xs text-white/40">
            <span>💡</span>
            <span>Describe the main subject or scene you want to generate. Be specific and detailed.</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            LENS & CAMERA CONTROLS (OPTIONAL)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsLensSectionOpen(!isLensSectionOpen)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Lens & Camera (Optional)</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            <button className="text-2xl text-white/40 hover:text-white/70 ml-4">
              {isLensSectionOpen ? '−' : '+'}
            </button>
          </div>

          {isLensSectionOpen && (
            <div className="space-y-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              
              {/* 1. FOCAL LENGTH SLIDER */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Focal Length</h3>
                  <span className="text-2xl font-bold text-cyan-400">{currentFocalLength}mm</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={STANDARD_FOCAL_LENGTHS.length - 1}
                  step="1"
                  value={focalLengthIndex}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    console.log('🎯 Focal length changed:', {
                      index: newIndex,
                      value: STANDARD_FOCAL_LENGTHS[newIndex]
                    });
                    setFocalLengthIndex(newIndex);
                  }}
                  disabled={specialtyLens !== 'none'}
                  className="w-full h-4 sm:h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    accentColor: '#06b6d4'
                  }}
                />
                
                <div className="flex justify-between text-[10px] text-white/40 mt-2 font-mono uppercase tracking-wider">
                  <span className="text-center">Ultra-Wide<br/>14-20mm</span>
                  <span className="text-center">Wide<br/>21-35mm</span>
                  <span className="text-center">Standard<br/>40-60mm</span>
                  <span className="text-center">Portrait<br/>70-135mm</span>
                  <span className="text-center">Telephoto<br/>135-600mm</span>
                </div>
                
                <p className="text-sm text-white/60 mt-2 p-3 bg-white/[0.02] rounded border border-white/5">
                  {getFocalLengthDescription(currentFocalLength)}
                </p>
              </div>

              {/* 2. SPECIALTY LENSES */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Specialty Lenses</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => toggleSpecialtyLens('macro')}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      specialtyLens === 'macro' 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔬</div>
                    <h4 className="font-semibold text-sm mb-1">MACRO</h4>
                    <p className="text-xs text-white/40">
                      Extreme close-ups<br/>
                      Tiny details magnified
                    </p>
                  </button>
                  
                  <button
                    onClick={() => toggleSpecialtyLens('fisheye')}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      specialtyLens === 'fisheye' 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌐</div>
                    <h4 className="font-semibold text-sm mb-1">FISHEYE</h4>
                    <p className="text-xs text-white/40">
                      Spherical distortion<br/>
                      180° field of view
                    </p>
                  </button>
                  
                  <button
                    onClick={() => toggleSpecialtyLens('tilt-shift')}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      specialtyLens === 'tilt-shift' 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-3xl mb-2">⚡</div>
                    <h4 className="font-semibold text-sm mb-1">TILT-SHIFT</h4>
                    <p className="text-xs text-white/40">
                      Selective focus plane<br/>
                      Miniature effect
                    </p>
                  </button>
                </div>
                
                {specialtyLens !== 'none' && (
                  <p className="text-xs text-white/50 italic">
                    Note: Selecting a specialty lens overrides focal length
                  </p>
                )}
              </div>

              {/* 3. APERTURE SLIDER */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Aperture (Depth of Field)</h3>
                  <span className="text-2xl font-bold text-cyan-400">f/{currentAperture}</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={F_STOPS.length - 1}
                  step="1"
                  value={apertureIndex}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    console.log('📷 Aperture changed:', {
                      index: newIndex,
                      value: F_STOPS[newIndex]
                    });
                    setApertureIndex(newIndex);
                  }}
                  className="w-full h-4 sm:h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#06b6d4'
                  }}
                />
                
                <div className="flex justify-between text-[9px] text-white/40 font-mono">
                  {F_STOPS.map((stop, idx) => (
                    <span key={idx} className={apertureIndex === idx ? 'text-cyan-400 font-bold' : ''}>
                      f/{stop}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-xs mt-3">
                  <span className="text-left w-1/2 text-white/50">
                    ← Extremely Shallow<br/>
                    <span className="text-[10px] text-white/30">Blurry background</span>
                  </span>
                  <span className="text-right w-1/2 text-white/50">
                    Everything Sharp →<br/>
                    <span className="text-[10px] text-white/30">Deep focus</span>
                  </span>
                </div>
                
                <p className="text-sm text-white/60 mt-2 p-3 bg-white/[0.02] rounded border border-white/5">
                  {getApertureDescription(currentAperture)}
                </p>
              </div>

              {/* 4. ISO SENSITIVITY (FILM GRAIN) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">ISO Sensitivity (Film Grain)</h3>
                  <span className="text-2xl font-bold text-cyan-400">ISO {currentISO}</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={ISO_VALUES.length - 1}
                  step="1"
                  value={isoIndex}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    console.log('🎞️ ISO changed:', {
                      index: newIndex,
                      value: ISO_VALUES[newIndex]
                    });
                    setIsoIndex(newIndex);
                  }}
                  className="w-full h-4 sm:h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#06b6d4'
                  }}
                />
                
                <div className="flex justify-between text-[9px] text-white/40 font-mono">
                  {ISO_VALUES.map((iso, idx) => (
                    <span key={idx} className={isoIndex === idx ? 'text-cyan-400 font-bold' : ''}>
                      {iso}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-sm mt-3">
                  <span className="text-left w-1/2 text-white/50">
                    ← Fine Grain<br/>
                    <span className="text-[10px] text-white/30">Clean, bright</span>
                  </span>
                  <span className="text-right w-1/2 text-white/50">
                    Heavy Grain →<br/>
                    <span className="text-[10px] text-white/30">Gritty, low light</span>
                  </span>
                </div>
                
                <p className="text-sm text-white/60 mt-2 p-3 bg-white/[0.02] rounded border border-white/5">
                  {getISODescription(currentISO)}
                </p>
                
                <div className="text-xs text-white/40 mt-2 flex items-start gap-2">
                  <span>💡</span>
                  <span>ISO controls sensor/film sensitivity. Higher ISO = more grain but better low-light performance.</span>
                </div>
              </div>

              {/* 5. LENS EFFECTS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Lens Effects (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'lens-flare', label: 'Lens Flare', desc: 'Sun streaks and halos' },
                    { id: 'bokeh', label: 'Bokeh Highlights', desc: 'Soft circular lights' },
                    { id: 'vignette', label: 'Vignetting', desc: 'Darkened corners' },
                    { id: 'chromatic', label: 'Chromatic Aberration', desc: 'Color fringing' },
                    { id: 'light-leaks', label: 'Light Leaks', desc: 'Film-style bleeding' },
                    { id: 'soft-glow', label: 'Soft Glow', desc: 'Dreamy halation' },
                    { id: 'anamorphic-flare', label: 'Anamorphic Flare', desc: 'Horizontal streaks' },
                    { id: 'distortion', label: 'Lens Distortion', desc: 'Barrel warping' }
                  ].map(effect => (
                    <label 
                      key={effect.id}
                      className="flex items-center space-x-3 p-3 border border-white/10 rounded-lg hover:border-white/20 cursor-pointer transition-all duration-200 bg-white/[0.02] hover:bg-white/[0.05]"
                    >
                      <input
                        type="checkbox"
                        checked={lensEffects.includes(effect.id)}
                        onChange={() => toggleLensEffect(effect.id)}
                        className="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-black/50"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{effect.label}</div>
                        <div className="text-xs text-white/40">{effect.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 6. LENS CHARACTER / STYLE */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Lens Character / Style</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'modern', label: 'Modern Sharp & Clean', desc: 'High contrast, clinical precision, neutral colors' },
                    { id: 'vintage', label: 'Vintage Cinematic', desc: 'Warm tones, lower contrast, classic film aesthetic' },
                    { id: 'soft', label: 'Soft & Dreamy', desc: 'Diffused glow, ethereal beauty, romantic' },
                    { id: 'high-contrast', label: 'High Contrast', desc: 'Deep blacks, punchy highlights, dramatic' },
                    { id: 'film-stock', label: 'Film Stock Emulation', desc: 'Film grain, color shifts, organic analog feel' }
                  ].map(style => (
                    <label 
                      key={style.id}
                      className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        borderColor: lensStyle === style.id ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: lensStyle === style.id ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <input
                        type="radio"
                        name="lens-style"
                        checked={lensStyle === style.id}
                        onChange={() => {
                          console.log('🎨 Style selected:', style.id);
                          setLensStyle(style.id);
                        }}
                        className="w-5 h-5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{style.label}</div>
                        <div className="text-xs text-white/40">{style.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              {/* FILM GRAIN & TEXTURE */}
              <div className="space-y-4 mt-8 pt-8 border-t border-white/10">
                <h3 className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
                  Film Grain & Texture
                </h3>
                
                {/* Grain Amount Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Grain Amount</span>
                    <span className="text-sm font-mono text-cyan-400">
                      {['None', 'Subtle', 'Medium', 'Heavy'][grainAmount]}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="1"
                    value={grainAmount}
                    onChange={(e) => setGrainAmount(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#06b6d4' }}
                  />
                  <div className="flex justify-between text-[10px] text-white/30 font-mono">
                    <span>NONE</span>
                    <span>SUBTLE</span>
                    <span>MEDIUM</span>
                    <span>HEAVY</span>
                  </div>
                </div>
                
                {/* Grain Type (only show if grain amount > 0) */}
                {grainAmount > 0 && (
                  <div className="space-y-3">
                    <span className="text-sm text-white/60">Grain Type</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'fine', label: 'Fine Grain', desc: '35mm quality' },
                        { id: 'coarse', label: 'Coarse', desc: '16mm/high ISO' },
                        { id: 'digital', label: 'Digital Noise', desc: 'Sensor artifact' }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setGrainType(type.id as any)}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            grainType === type.id 
                              ? 'border-cyan-500 bg-cyan-500/10' 
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div className="font-semibold text-sm">{type.label}</div>
                          <div className="text-xs text-white/40">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              </div>

            </div>
          )}
        </div>



        {/* ─────────────────────────────────────────────────────────────────────
            CAMERA ANGLES (OPTIONAL)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsCameraAnglesSectionOpen(!isCameraAnglesSectionOpen)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Camera Angles (Optional)</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            <button className="text-2xl text-white/40 hover:text-white/70 ml-4">
              {isCameraAnglesSectionOpen ? '−' : '+'}
            </button>
          </div>

          {isCameraAnglesSectionOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              {cameraAnglesData.camera.cards.map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => setSelectedCameraAngle(selectedCameraAngle === angle.id ? null : angle.id)}
                  className={`group relative p-4 rounded-none border text-left transition-all duration-300 overflow-hidden ${
                    selectedCameraAngle === angle.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  {/* Tech corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t transition-colors duration-300 ${selectedCameraAngle === angle.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t transition-colors duration-300 ${selectedCameraAngle === angle.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b transition-colors duration-300 ${selectedCameraAngle === angle.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b transition-colors duration-300 ${selectedCameraAngle === angle.id ? 'border-cyan-500' : 'border-white/20'}`} />

                  {selectedCameraAngle === angle.id && (
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: 'radial-gradient(circle at center, #06b6d4 0%, transparent 100%)'
                      }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-mono uppercase tracking-wider ${selectedCameraAngle === angle.id ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                        {angle.label}
                      </span>
                      {selectedCameraAngle === angle.id && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
                          style={{ backgroundColor: '#06b6d4' }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wide font-mono">{angle.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            CAMERA MOVEMENT (OPTIONAL) - Cinematography Mode Only
        ───────────────────────────────────────────────────────────────────── */}
        {cameraMode === 'cinematography' && (
        <div className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsCameraMovementSectionOpen(!isCameraMovementSectionOpen)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Camera Movement (Optional)</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            <button className="text-2xl text-white/40 hover:text-white/70 ml-4">
              {isCameraMovementSectionOpen ? '−' : '+'}
            </button>
          </div>

          {isCameraMovementSectionOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              {cameraAnglesData.movement.cards.map((movement) => (
                <button
                  key={movement.id}
                  onClick={() => setSelectedCameraMovement(selectedCameraMovement === movement.id ? null : movement.id)}
                  className={`group relative p-4 rounded-none border text-left transition-all duration-300 overflow-hidden ${
                    selectedCameraMovement === movement.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  {/* Tech corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t transition-colors duration-300 ${selectedCameraMovement === movement.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t transition-colors duration-300 ${selectedCameraMovement === movement.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b transition-colors duration-300 ${selectedCameraMovement === movement.id ? 'border-cyan-500' : 'border-white/20'}`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b transition-colors duration-300 ${selectedCameraMovement === movement.id ? 'border-cyan-500' : 'border-white/20'}`} />

                  {selectedCameraMovement === movement.id && (
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: 'radial-gradient(circle at center, #06b6d4 0%, transparent 100%)'
                      }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-mono uppercase tracking-wider ${selectedCameraMovement === movement.id ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                        {movement.label}
                      </span>
                      {selectedCameraMovement === movement.id && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
                          style={{ backgroundColor: '#06b6d4' }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wide font-mono">{movement.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}


        {/* ─────────────────────────────────────────────────────────────────────
            ASPECT RATIO / FORMAT
        ───────────────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
              Aspect Ratio / Format
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Optional</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(cameraMode === 'photography' ? PHOTO_ASPECT_RATIOS : CINEMA_ASPECT_RATIOS).map(ratio => (
              <button
                key={ratio.id}
                onClick={() => {
                  console.log('🎬 Aspect ratio clicked:', ratio.value);
                  setSelectedAspectRatio(ratio.value);
                }}
                className={`
                  p-4 border-2 rounded-lg transition-all text-center font-semibold
                  \${selectedAspectRatio === ratio.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/10 hover:border-white/20 text-white/70'
                  }
                `}
              >
                <div className="text-sm mb-1">{ratio.label}</div>
                <div className="text-xs text-gray-400">{ratio.value}</div>
              </button>
            ))}
          </div>
          
          {selectedAspectRatio && (
            <button
              onClick={() => setSelectedAspectRatio(null)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-300"
            >
              ✕ Clear selection
            </button>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            4. TARGET OUTPUT (Collapsible) - moved BELOW Construction Bay
        ───────────────────────────────────────────────────────────────────── */}
        <CollapsibleSection 
          title="Target Output" 
          optional
          isOpen={targetOutputOpen}
          onToggle={() => setTargetOutputOpen(!targetOutputOpen)}
        >
          <div className="mb-4">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/5 w-fit">
              {['all', 'image', 'video'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPlatformFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-md transition-all duration-200 ${
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
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/5 border border-white/10 p-px">
            {getFilteredPlatforms().map((platform) => {
              const isActive = targetMode === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform.id)}
                  className={`
                    relative group p-4 transition-all duration-300 overflow-hidden
                    ${isActive 
                      ? 'bg-white/10' 
                      : 'bg-black/40 hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `radial-gradient(circle at center, ${platform.color} 0%, transparent 100%)`
                      }}
                    />
                  )}
                  
                  {/* Active Indicator Bar */}
                  <div 
                    className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-300 ${isActive ? 'opacity-100 shadow-[0_0_10px_currentColor]' : 'opacity-0'}`}
                    style={{ backgroundColor: platform.color }}
                  />

                  <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                    {/* Info Icon for Platform */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModal(platform.id);
                      }}
                      className="absolute top-2 right-2 text-xs text-white/50 hover:text-amber-400 cursor-pointer transition-colors duration-200"
                      title="Learn more about this model"
                    >
                      ⓘ
                    </div>

                    <span 
                      className="text-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ color: isActive ? platform.color : 'rgba(255,255,255,0.3)' }}
                    >
                      {platform.icon}
                    </span>
                    <div className={`text-sm font-mono font-bold tracking-widest uppercase leading-tight ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {platform.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────────
            5. ASPECT RATIO / FORMAT
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
              Aspect Ratio / Format
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setAspectCategory('photo')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all ${
                aspectCategory === 'photo' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' 
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'
              }`}
            >
              Photography
            </button>
            <button 
              onClick={() => setAspectCategory('cinema')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all ${
                aspectCategory === 'cinema' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' 
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'
              }`}
            >
              Cinematic
            </button>
          </div>
          
          {/* Aspect Ratio Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {aspectRatios[aspectCategory].map(ratio => (
              <button
                key={ratio.value}
                onClick={() => setPromptState(prev => ({ ...prev, aspectRatio: ratio.value }))}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  promptState.aspectRatio === ratio.value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="font-bold text-sm mb-1">{ratio.value}</div>
                <div className="text-xs font-semibold text-white/70">{ratio.label}</div>
                <div className="text-[10px] text-white/40 mt-1">{ratio.desc}</div>
              </button>
            ))}
          </div>
        </section>
        {/* ... (Output Display, Action Buttons, Footer, Info Modal sections remain the same or similar) ... */}
        {/* ─────────────────────────────────────────────────────────────────────
            OUTPUT DISPLAY
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Generated Output</span>
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
            className="relative border overflow-hidden group"
            style={{ 
              borderColor: `${currentPlatform.color}40`,
              backgroundColor: 'rgba(0,0,0,0.8)'
            }}
          >
            {/* Header bar */}
            <div 
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ 
                borderColor: `${currentPlatform.color}20`,
                background: `linear-gradient(90deg, ${currentPlatform.color}10 0%, transparent 100%)`
              }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono" style={{ color: currentPlatform.color }}>{currentPlatform.icon}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">{currentPlatform.name} TERMINAL</span>
              </div>
              <div className="flex items-center gap-1 opacity-50">
                <div className="w-1.5 h-1.5 bg-white/20" />
                <div className="w-1.5 h-1.5 bg-white/20" />
                <div className="w-1.5 h-1.5 bg-white/20" />
              </div>
            </div>
            
            {/* Text content */}
            <div className="p-6 min-h-[120px] relative">
              {/* Scanline effect */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.1)_50%)] bg-[length:100%_4px]" />
              
              <p 
                className={`font-mono text-sm leading-relaxed transition-opacity duration-200 ${isTransitioning ? 'text-white/50' : 'text-white/90'}`}
                style={{ wordBreak: 'break-word' }}
              >
                {displayText || '> AWAITING PARAMETERS...'}
              </p>
              
              {!subjectInput && !activePreset && !displayText && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded flex items-start gap-3">
                  <span className="text-amber-400 text-lg">💡</span>
                  <p className="text-sm text-amber-300">
                    <strong>Tip:</strong> Describe your subject above, then select visual options to enhance your prompt. Or start with a preset for quick inspiration.
                  </p>
                </div>
              )}
              
              {/* EMERGENCY SIMPLE PROMPT - FOR DEBUGGING */}
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded">
                <h4 className="text-yellow-400 font-bold text-xs mb-2">🔧 DEBUG: Simple Prompt (no builders)</h4>
                <p className="text-white font-mono text-xs break-words">
                  {[
                    subjectInput || '[No subject]',
                    currentFocalLength ? `${currentFocalLength}mm lens` : '',
                    currentAperture ? `f/${currentAperture}` : '',
                    currentISO ? `ISO ${currentISO}` : '',
                    selectedCameraAngle ? `${selectedCameraAngle} angle` : '',
                    selectedCameraMovement ? `${selectedCameraMovement} movement` : ''
                  ].filter(Boolean).join(', ') || 'Make selections above'}
                </p>
              </div>
            </div>
            
            {/* Bottom accent */}
            <div 
              className="h-0.5 w-full"
              style={{ 
                background: `linear-gradient(90deg, ${currentPlatform.color} 0%, transparent 100%)`
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
            <span>VISUAL ARMORY v3.0 — Polymorphic Generation System</span>
            <span>11 Platforms • 12 Presets • Press cards to toggle • Switch platforms to transform</span>
          </div>
        </footer>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INFO MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {infoModal && cardInfo[infoModal] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setInfoModal(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative max-w-lg w-full bg-black border border-white/20 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tech corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400" />
            
            {/* Close button */}
            <button
              onClick={() => setInfoModal(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl text-amber-400">ⓘ</span>
              <div>
                <h3 className="text-lg font-mono uppercase tracking-wider text-white">
                  {cardInfo[infoModal].name}
                </h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Selection Profile</p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-amber-400/50 via-white/10 to-transparent mb-4" />
            
            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed">
              {cardInfo[infoModal].info}
            </p>
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setInfoModal(null)}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptArmory;
