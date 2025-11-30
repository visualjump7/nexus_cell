'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemStateToggle } from '@/components/SystemStateToggle';
import { DashboardHeaderControls } from '@/components/DashboardHeaderControls';
import { GlobalAmbientLight } from '@/components/GlobalAmbientLight';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useViewMode } from '@/hooks/useViewMode';
import { buildEmailPrompt } from '@/lib/builders/email';
import { 
  Globe, CheckCircle, Fingerprint, Zap, 
  Briefcase, Users, Cpu, HeartHandshake, 
  Target, GraduationCap, Shield, Feather,
  Check, Copy, RefreshCw, ChevronDown
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ARMORY — Anti-LLM Drift System
// Polymorphic Text Generation with Fidelity Control & Voice Signatures
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────────

type VoicePresetId = 
  | 'universal' 
  | 'grammar_police' 
  | 'authentic' 
  | 'articulator' 
  | 'executive' 
  | 'diplomat' 
  | 'engineer' 
  | 'caretaker' 
  | 'closer' 
  | 'academic' 
  | 'shield' 
  | 'storyteller';

type FidelityId = 'polisher' | 'expander' | 'reducer' | 'transmuter';
type PlatformId = 'email' | 'slack' | 'linkedin' | 'tweet';

interface EmailState {
  intent: {
    rawInput: string;
    goal: string;
  };
  fidelity: {
    mode: FidelityId;
    constraints: string[];
  };
  voice: {
    preset: VoicePresetId;
    warmth: number; // 0.0 to 1.0
    professionalism: number; // 0.0 to 1.0
    length: 'Short' | 'Medium' | 'Long';
    bioSample?: string; // For Ghost mode
  };
  outputFormat: {
    platform: PlatformId;
    structure: 'Paragraphs' | 'Bulleted List';
  };
}

interface VoicePreset {
  id: VoicePresetId;
  title: string;
  description: string;
  color: string; // Hex color for accents and ambient light
  glow: string; // Tailwind shadow class
  icon: any; // Lucide icon component
  instruction?: string; // Optional, merged from logic map later if needed, or defined here
}

interface FidelityLevel {
  id: FidelityId;
  name: string;
  description: string;
  intervention: string; // "Low" | "High" etc
}

const ANTI_ROBOT_PHRASES = [
  "I hope this email finds you well",
  "Delve into",
  "Tapestry of",
  "Testament to",
  "Game-changer",
  "Please do not hesitate to reach out"
];

const getWarmthLabel = (value: number) => {
  const percentage = Math.round(value * 100);
  if (percentage <= 20) return 'Tone must be blunt, cold, and strictly business. Remove pleasantries.';
  if (percentage <= 40) return 'Tone should stay straightforward with minimal empathy.';
  if (percentage <= 60) return 'Tone should remain neutral-professional with polite acknowledgement.';
  if (percentage <= 80) return 'Tone should add polite warmth and conversational phrasing while staying concise.';
  return 'Tone should be warm, friendly, and supportive while remaining professional.';
};

const getProfessionalismLabel = (value: number) => {
  const percentage = Math.round(value * 100);
  if (percentage <= 20) return 'Casual register allowed: contractions, lowercase, quick Slack-style phrasing.';
  if (percentage <= 50) return 'Business casual: contractions ok, keep the language modern and clear.';
  if (percentage <= 80) return 'Formal business tone: complete sentences, avoid slang.';
  return 'Highly formal/legalistic phrasing. No contractions. Reference policy or procedure language if relevant.';
};

const FIDELITY_INSTRUCTIONS: Record<FidelityId, string> = {
  polisher: 'Do not change intent. Only fix grammar, clarity, and flow.',
  expander: 'Convert fragments into cohesive prose while staying concise.',
  reducer: 'Summarize to essentials. Remove filler and pleasantries.',
  transmuter: 'Rewrite entirely to match the target persona while keeping factual intent.'
};

const EmailArmory = () => {
  // ─── State Management ────────────────────────────────────────────────────────

  const { viewMode, setViewMode } = useViewMode();
  const [displayText, setDisplayText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState('#94a3b8'); // Default to Universal slate
  const [commControlsOpen, setCommControlsOpen] = useState(true); // Communication Controls toggle
  const [presetBorderColor, setPresetBorderColor] = useState('#f59e0b'); // Default amber for textarea border
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  
  // Master State Object
  const [emailState, setEmailState] = useState<EmailState>({
    intent: {
      rawInput: '',
      goal: ''
    },
    fidelity: {
      mode: 'expander',
      constraints: []
    },
    voice: {
      preset: 'universal',
      warmth: 0.5,
      professionalism: 0.5,
      length: 'Medium',
      bioSample: ''
    },
    outputFormat: {
      platform: 'email',
      structure: 'Paragraphs'
    }
  });

  // ─── Configuration Data ──────────────────────────────────────────────────────

  const presetInstructions: Record<string, string> = {
    // Essentials
    universal: "Write in a standard, clear professional tone. No slang, no complex jargon. Just plain English.",
    grammar_police: "Your ONLY task is to fix grammar, spelling, and punctuation errors. Do NOT change the tone, vocabulary, sentence structure, or length.",
    authentic: "Refine the flow and clarity of the text. Remove sentence fragments and awkward phrasing, but strictly preserve the user's original attitude and vocabulary.",
    articulator: "Optimize for internal team communication. Use casual language, standard abbreviations, and minimize fluff. Lowercase typing is acceptable.",
    
    // Professionals
    executive: "Prioritize brevity. Remove adjectives. Focus on action items. No pleasantries.",
    diplomat: "Focus on de-escalation and validation. Use passive voice to soften blows. Validate feelings.",
    engineer: "Focus on facts and data. Use bullet points. Remove emotional language. Be precise.",
    caretaker: "Adopt a patient, empathetic customer service tone. Apologize for issues, validate frustration, and pivot to solutions.",
    
    // Specialists
    closer: "Use persuasive sales copywriting techniques. Focus on benefits over features. Create urgency. End with a strong Call to Action.",
    academic: "Elevate vocabulary to a collegiate/PhD level. Use complex sentence structures. Avoid contractions. Be authoritative.",
    shield: "Write defensively from a legal perspective. Be precise but non-committal. Avoid admitting absolute fault.",
    storyteller: "Use a narrative structure. Start with a hook. Use sensory language to paint a picture. Focus on the emotional journey."
  };

  const voicePresets: VoicePreset[] = [
    // ROW 1: Essentials (Daily Drivers)
    {
      id: 'universal',
      title: 'Universal',
      description: 'Neutral, clear, and balanced. The gold standard for daily communication.',
      color: '#94a3b8', // Slate-400
      glow: 'shadow-slate-500/50',
      icon: Globe
    },
    {
      id: 'grammar_police',
      title: 'Grammar Police',
      description: 'Strict proofreading. Fixes errors without changing your voice.',
      color: '#ea580c', // Orange-600
      glow: 'shadow-orange-500/50',
      icon: CheckCircle
    },
    {
      id: 'authentic',
      title: 'Authentic',
      description: 'Your thoughts, just clearer. Enhances flow while sounding like YOU.',
      color: '#06b6d4', // Cyan-500
      glow: 'shadow-cyan-500/50',
      icon: Fingerprint
    },
    {
      id: 'articulator',
      title: 'The Articulator',
      description: 'Internal comms. Fast, efficient, and human. Great for Slack.',
      color: '#8b5cf6', // Violet-500
      glow: 'shadow-violet-500/50',
      icon: Zap
    },

    // ROW 2: Professionals (Role-Based)
    {
      id: 'executive',
      title: 'The Executive',
      description: 'Brute efficiency. No fluff, no pleasantries. Pure action.',
      color: '#3b82f6', // Blue-500
      glow: 'shadow-blue-500/50',
      icon: Briefcase
    },
    {
      id: 'diplomat',
      title: 'The Diplomat',
      description: 'Soft power. De-escalate conflict and validate feelings.',
      color: '#14b8a6', // Teal-500
      glow: 'shadow-teal-500/50',
      icon: Users
    },
    {
      id: 'engineer',
      title: 'The Engineer',
      description: 'Facts and data. Structured, precise, and emotionless.',
      color: '#f59e0b', // Amber-500
      glow: 'shadow-amber-500/50',
      icon: Cpu
    },
    {
      id: 'caretaker',
      title: 'The Caretaker',
      description: 'Customer support. High empathy, patient, and solution-focused.',
      color: '#ec4899', // Pink-500
      glow: 'shadow-pink-500/50',
      icon: HeartHandshake
    },

    // ROW 3: Specialists (High-Level Weapons)
    {
      id: 'closer',
      title: 'The Closer',
      description: 'Sales mode. Persuasive, benefit-driven, and high-urgency.',
      color: '#22c55e', // Green-500
      glow: 'shadow-green-500/50',
      icon: Target
    },
    {
      id: 'academic',
      title: 'The Academic',
      description: 'PhD level. Sophisticated vocabulary and complex sentence structures.',
      color: '#6366f1', // Indigo-500
      glow: 'shadow-indigo-500/50',
      icon: GraduationCap
    },
    {
      id: 'shield',
      title: 'The Shield',
      description: 'Legal defensive. Precise, non-committal, and protective.',
      color: '#64748b', // Slate-500
      glow: 'shadow-slate-500/50',
      icon: Shield
    },
    {
      id: 'storyteller',
      title: 'The Storyteller',
      description: 'Marketing narrative. Engaging, emotional, and hook-driven.',
      color: '#f43f5e', // Rose-500
      glow: 'shadow-rose-500/50',
      icon: Feather
    }
  ];

  const fidelityLevels: FidelityLevel[] = [
    { id: 'polisher', name: 'Polisher', description: 'Grammar & Flow Only', intervention: 'Low' },
    { id: 'expander', name: 'Expander', description: 'Bullets to Prose', intervention: 'Medium' },
    { id: 'reducer', name: 'Reducer', description: 'TL;DR / Summarize', intervention: 'High' },
    { id: 'transmuter', name: 'Transmuter', description: 'Full Rewrite / Tonal Shift', intervention: 'Extreme' }
  ];

  const outputPlatforms: { id: PlatformId; icon: string }[] = [
    { id: 'email', icon: '✉️' },
    { id: 'slack', icon: '#️⃣' },
    { id: 'linkedin', icon: 'in' },
    { id: 'tweet', icon: '🐦' }
  ];

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handlePresetSelect = (presetId: VoicePresetId) => {
    const preset = voicePresets.find(p => p.id === presetId);
    if (preset) {
      setActiveTheme(preset.color);
      setPresetBorderColor(preset.color); // Update border color to match selected preset
      setEmailState(prev => ({
        ...prev,
        voice: {
          ...prev.voice,
          preset: presetId
        }
      }));
    }
  };

  // Cipher Animation Logic
  const cipherChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  const animationRef = useRef<number | null>(null);
  
  const animateCipherDecode = (targetText: string) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const duration = 1500;
    const startTime = performance.now();
    const textLength = targetText.length;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease out
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
        setIsGenerating(false);
      }
    };
    
    setIsGenerating(true);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Meta-prompt Compilation
  const handleGenerate = () => {
    if (!emailState.intent.rawInput.trim()) return;
    
    const promptTemplate = buildEmailPrompt({
      rawInput: emailState.intent.rawInput,
      goal: emailState.intent.goal,
      preset: emailState.voice.preset,
      warmth: emailState.voice.warmth,
      professionalism: emailState.voice.professionalism,
      fidelity: emailState.fidelity.mode,
      length: emailState.voice.length,
      bioSample: emailState.voice.bioSample,
      platform: emailState.outputFormat.platform,
      structure: emailState.outputFormat.structure,
    });

    animateCipherDecode(promptTemplate);
  };

  const handleCopy = async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-amber-500/20">
      <GlobalAmbientLight color={activeTheme} />
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 191, 36, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <header className="mb-12 relative">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-6">
            {/* LEFT SIDE: Identity & System State */}
            <div className="flex items-center gap-6">
              {/* App Logo */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 border border-amber-500/20 flex items-center justify-center bg-amber-500/5">
                  <span className="text-xl font-bold text-amber-500">◇</span>
                </div>
              </div>
              
              {/* Title & Version */}
              <div>
                <h1 className="text-3xl font-light tracking-tight text-white">
                  PROMPT <span className="font-bold text-amber-500">ARMORY</span>
                </h1>
                <p className="text-amber-500/40 text-[10px] font-mono tracking-widest uppercase">
                  Email Module • V1.0
                </p>
              </div>
              
            </div>
            
            {/* RIGHT SIDE: Navigation Stack */}
            <DashboardHeaderControls currentApp="text" />
          </div>
          
          {/* Status and Toggle Row */}
          <div className="flex items-center justify-between mt-6 mb-6">
            {/* Left: Status Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500/40 uppercase">Secure Connection</span>
              <div className="h-px w-12 bg-amber-500/20" />
            </div>
            
            {/* Right: FOCUS/ADVANCED Toggle */}
            <div>
              <SystemStateToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            1. VOICE SIGNATURE PRESETS (Always Visible)
        ───────────────────────────────────────────────────────────────────── */}
        <CollapsibleSection 
          title="Select a Preset" 
          optional
          forceOpen
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {voicePresets.map((preset) => {
              const isActive = emailState.voice.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`group relative p-4 rounded-lg border text-left transition-all duration-300 overflow-hidden ${
                    isActive
                      ? `border-white/20 bg-white/5 scale-[1.02] ${preset.glow}`
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: preset.color }}
                    />
                  )}
                  <div className="relative z-10">
                    <div 
                      className="text-lg mb-2 transition-colors"
                      style={{ color: isActive ? preset.color : 'rgba(255,255,255,0.4)' }}
                    >
                      <preset.icon size={20} />
                    </div>
                    <div className={`text-sm font-medium mb-1 ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {preset.title}
                    </div>
                    <p className="text-[10px] text-white/40 leading-tight line-clamp-2">{preset.description}</p>
                  </div>
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: preset.color }}
                  />
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────────
            2. YOUR CONTENT (Input) - Always Visible
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Your Content</span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>
          
          <div className="relative group">
            {/* Animated Border Sweep Layer */}
            <div className="absolute inset-0 rounded overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-[-2px]"
                style={{
                  background: `conic-gradient(
                    from 0deg,
                    transparent 0%,
                    transparent 70%,
                    ${presetBorderColor}66 85%,  // Dynamic color for sweep
                    transparent 100%
                  )`,
                  maskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                  maskComposite: 'exclude',
                  padding: '2px'
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            {/* Pulsing Glow Effect - BORDER ONLY, NOT INTERIOR */}
            {isContentEmpty && (
              <motion.div
                className="absolute inset-0 rounded pointer-events-none"
                style={{
                  // Box-shadow creates glow OUTSIDE the border only
                  // No background, no interior fill
                  background: 'transparent',
                  boxShadow: `0 0 20px ${presetBorderColor}80, 0 0 40px ${presetBorderColor}40`
                }}
                animate={{
                  boxShadow: [
                    `0 0 15px ${presetBorderColor}60, 0 0 30px ${presetBorderColor}30`,
                    `0 0 25px ${presetBorderColor}90, 0 0 50px ${presetBorderColor}50`,
                    `0 0 15px ${presetBorderColor}60, 0 0 30px ${presetBorderColor}30`
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* Main Textarea with Thicker Border */}
            <textarea
              value={emailState.intent.rawInput}
              onChange={(e) => {
                const newValue = e.target.value;
                setIsContentEmpty(newValue.length === 0);
                setEmailState(prev => ({ 
                  ...prev, 
                  intent: { ...prev.intent, rawInput: newValue } 
                }));
              }}
              placeholder="Paste your messy draft, bullet points, or rough notes here..."
              rows={6}
              className="relative z-10 w-full bg-black/80 border-2 transition-all duration-500 ease-out px-6 py-5 text-lg font-light text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-lg resize-none font-mono"
              style={{ 
                borderColor: isContentEmpty 
                  ? `${presetBorderColor}80`  // Bright when empty (50% opacity)
                  : `${presetBorderColor}40`  // Dim when has content (25% opacity)
              }}
            />
            <div className={`absolute right-4 top-4 text-xs font-mono transition-colors duration-300 z-20 ${emailState.intent.rawInput.length > 0 ? 'text-white/70' : 'text-white/30'}`}>
              {emailState.intent.rawInput.length > 0 && `${emailState.intent.rawInput.length} CHARS`}
            </div>
            
            {/* Goal Input (Optional overlay) */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <input
                type="text"
                value={emailState.intent.goal}
                onChange={(e) => setEmailState(prev => ({ 
                  ...prev, 
                  intent: { ...prev.intent, goal: e.target.value } 
                }))}
                placeholder="Goal (optional): e.g., 'Decline the meeting politely'"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 transition-all duration-300 rounded"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            3. COMMUNICATION CONTROLS (Always Visible)
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          {/* Section Header with Manual Toggle */}
          <button
            onClick={() => setCommControlsOpen(!commControlsOpen)}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Communication Controls</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
            </div>
            <motion.div
              animate={{ rotate: commControlsOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
            </motion.div>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence>
            {commControlsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Warmth Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs items-end">
                        <span className="text-white/70 font-bold uppercase tracking-widest">Warmth</span>
                        <span className="text-amber-400 font-mono text-sm">{Math.round(emailState.voice.warmth * 100)}%</span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={emailState.voice.warmth}
                          onChange={(e) => setEmailState(prev => ({ 
                            ...prev, 
                            voice: { ...prev.voice, warmth: parseFloat(e.target.value) } 
                          }))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-800"
                          style={{
                            backgroundImage: `linear-gradient(to right, #3b82f6 0%, #f59e0b 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-medium text-white">
                        <span>❄ Cold / Direct</span>
                        <span>🔥 Warm / Friendly</span>
                      </div>
                    </div>
                    
                    {/* Professionalism Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs items-end">
                        <span className="text-white/70 font-bold uppercase tracking-widest">Professionalism</span>
                        <span className="text-indigo-400 font-mono text-sm">{Math.round(emailState.voice.professionalism * 100)}%</span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={emailState.voice.professionalism}
                          onChange={(e) => setEmailState(prev => ({ 
                            ...prev, 
                            voice: { ...prev.voice, professionalism: parseFloat(e.target.value) } 
                          }))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-800"
                          style={{
                            backgroundImage: `linear-gradient(to right, #9ca3af 0%, #4f46e5 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-medium text-white">
                        <span>👋 Casual</span>
                        <span>💼 Formal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            4. OUTPUT CONTROLS (Optional - Respects View Mode)
        ───────────────────────────────────────────────────────────────────── */}
        <CollapsibleSection 
          title="Output Controls" 
          optional
          defaultOpen={viewMode === 'advanced'}
        >
          <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fidelity Mode */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-white/50 uppercase mb-3">Fidelity (Intervention)</label>
                <div className="space-y-2">
                  {fidelityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setEmailState(prev => ({ ...prev, fidelity: { ...prev.fidelity, mode: level.id } }))}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs border transition-all ${
                        emailState.fidelity.mode === level.id
                          ? 'border-amber-500/50 bg-amber-500/10 text-white'
                          : 'border-white/5 bg-black/20 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      <span className="font-bold">{level.name}</span>
                      <span className="opacity-50">{level.intervention}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-white/50 uppercase mb-3">Output Format</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {outputPlatforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setEmailState(prev => ({ ...prev, outputFormat: { ...prev.outputFormat, platform: p.id } }))}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-xs border transition-all ${
                        emailState.outputFormat.platform === p.id
                          ? 'border-amber-500/50 bg-amber-500/10 text-white'
                          : 'border-white/5 bg-black/20 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="uppercase">{p.id}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {['Paragraphs', 'Bulleted List'].map((struct) => (
                    <button
                      key={struct}
                      onClick={() => setEmailState(prev => ({ ...prev, outputFormat: { ...prev.outputFormat, structure: struct as any } }))}
                      className={`px-3 py-2 rounded text-xs border text-left transition-all ${
                        emailState.outputFormat.structure === struct
                          ? 'border-amber-500/50 text-amber-400'
                          : 'border-white/5 text-white/40'
                      }`}
                    >
                      {struct}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────────
            OUTPUT DISPLAY & ACTIONS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Generated Prompt</span>
              <div className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-500 font-mono border border-amber-500/30">
                COPY PASTE INTO CHATGPT / GROK or any other AI
              </div>
            </div>
            {isGenerating && <span className="text-xs text-amber-500 animate-pulse font-mono">TRANSMUTING...</span>}
          </div>

          {/* Terminal Output */}
          <div className="relative border border-amber-500/20 bg-black/80 min-h-[200px] rounded-lg overflow-hidden group">
             {/* Scanline effect */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(transparent_50%,rgba(251,191,36,0.1)_50%)] bg-[length:100%_4px]" />
             
             <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-white/90">
               {displayText || <span className="text-white/20">{'>'} AWAITING INPUT SEQUENCE...</span>}
             </div>
             
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-transparent opacity-50" />
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleGenerate}
              disabled={!emailState.intent.rawInput || isGenerating}
              className={`flex-1 py-4 rounded-lg font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                !emailState.intent.rawInput || isGenerating
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              }`}
            >
              {isGenerating ? <RefreshCw className="animate-spin" /> : <Zap />}
              {isGenerating ? 'Processing...' : 'Compile Prompt'}
            </button>

            <motion.button
              onClick={handleCopy}
              disabled={!displayText}
              animate={
                displayText && !isGenerating
                  ? {
                      boxShadow: [
                        '0 0 0px rgba(245,158,11,0)',
                        '0 0 20px rgba(245,158,11,0.6)',
                        '0 0 0px rgba(245,158,11,0)'
                      ],
                      borderColor: [
                        'rgba(255,255,255,0.1)',
                        'rgba(245,158,11,0.8)',
                        'rgba(255,255,255,0.1)'
                      ]
                    }
                  : {}
              }
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="px-8 py-4 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-white/60 hover:text-white flex items-center gap-2 disabled:opacity-50"
            >
              {copied ? <Check className="text-green-500" /> : <Copy />}
              {copied ? 'Copied' : 'Copy'}
            </motion.button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────────────────────────────────── */}
        <footer className="mt-20 pt-8 border-t border-white/5">
          <div className="flex justify-between text-[10px] text-white/30 font-mono uppercase tracking-widest">
            <span>SECURE CHANNEL ESTABLISHED</span>
            <span>VISUAL ARMORY v3.0</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default EmailArmory;
