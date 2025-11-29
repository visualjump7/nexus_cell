'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemStateToggle } from '@/components/SystemStateToggle';
import { DashboardHeaderControls } from '@/components/DashboardHeaderControls';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GlobalAmbientLight } from '@/components/GlobalAmbientLight';
import { useViewMode } from '@/hooks/useViewMode';
import { 
  MessageSquare, 
  Zap, 
  Feather, 
  Briefcase, 
  Coffee, 
  Ghost, 
  Shield,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Maximize2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ARMORY — Anti-LLM Drift System
// Polymorphic Text Generation with Fidelity Control & Voice Signatures
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────────

type VoicePresetId = 'grammar_police' | 'authentic' | 'articulator' | 'engineer' | 'diplomat' | 'executive';
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
  name: string;
  label: string; // e.g. "Me" or "CEO"
  icon: React.ReactNode;
  description: string;
  color: string; // Tailwind color class for accents
  accentHex: string;
  glow: string;
  defaultWarmth: number;
  defaultProf: number;
  instruction: string;
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
  const [activeTheme, setActiveTheme] = useState('#9ca3af'); // Default to Grammar Police gray
  
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
      preset: 'grammar_police',
      warmth: 0.5,
      professionalism: 0.8,
      length: 'Medium',
      bioSample: ''
    },
    outputFormat: {
      platform: 'email',
      structure: 'Paragraphs'
    }
  });

  // ─── Configuration Data ──────────────────────────────────────────────────────

  const voicePresets: VoicePreset[] = [
    {
      id: 'grammar_police',
      name: 'Grammar Police',
      label: '(Strict)',
      icon: <ShieldCheck size={20} />,
      description: 'Strict proofreading. Fixes errors without changing your voice.',
      color: 'text-gray-400',
      accentHex: '#9ca3af',
      glow: 'shadow-gray-500/50',
      defaultWarmth: 0.5,
      defaultProf: 0.8,
      instruction: 'Your ONLY task is to fix grammar, spelling, and punctuation errors. Do NOT change the tone, vocabulary, sentence structure, or length. Maintain the exact user intent.'
    },
    {
      id: 'authentic',
      name: 'Authentic',
      label: '(Me)',
      icon: <Feather size={20} />,
      description: 'Your thoughts, just clearer. Enhances flow while sounding like YOU.',
      color: 'text-cyan-400',
      accentHex: '#06b6d4',
      glow: 'shadow-cyan-500/50',
      defaultWarmth: 0.6,
      defaultProf: 0.7,
      instruction: 'Refine the flow and clarity of the text. Remove sentence fragments and awkward phrasing, but strictly preserve the user\'s original attitude, vocabulary choices, and personality.'
    },
    {
      id: 'articulator',
      name: 'The Articulator',
      label: '(Team)',
      icon: <Zap size={20} />,
      description: 'Internal comms. Fast, efficient, and human.',
      color: 'text-purple-400',
      accentHex: '#8b5cf6',
      glow: 'shadow-purple-500/50',
      defaultWarmth: 0.7,
      defaultProf: 0.2,
      instruction: 'Optimize for internal team communication. Use casual language, standard abbreviations, and minimize fluff. Lowercase typing is acceptable. Focus on speed and clarity.'
    },
    {
      id: 'engineer',
      name: 'The Engineer',
      label: '(Tech)',
      icon: <Briefcase size={20} />,
      description: 'Facts only. Structured. Zero emotion. Pure data transmission.',
      color: 'text-amber-400',
      accentHex: '#f59e0b',
      glow: 'shadow-amber-500/50',
      defaultWarmth: 0.1,
      defaultProf: 0.9,
      instruction: 'Focus on facts, metrics, and action items; remove emotional language.'
    },
    {
      id: 'diplomat',
      name: 'The Diplomat',
      label: '(HR)',
      icon: <Shield size={20} />,
      description: 'Softens blows. Validates feelings. Professional warmth.',
      color: 'text-teal-400',
      accentHex: '#14b8a6',
      glow: 'shadow-teal-500/50',
      defaultWarmth: 0.9,
      defaultProf: 0.8,
      instruction: 'Use softening language, acknowledge recipient perspective, remain professional but empathetic.'
    },
    {
      id: 'executive',
      name: 'The Executive',
      label: '(CEO)',
      icon: <Briefcase size={20} />,
      description: 'Fewer than 50 words. Brute efficiency. No opening/closing.',
      color: 'text-blue-500',
      accentHex: '#3b82f6',
      glow: 'shadow-blue-500/50',
      defaultWarmth: 0.2,
      defaultProf: 1.0,
      instruction: 'Use fewer than 50 words, no greetings or sign-offs, deliver the decision immediately.'
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
      setActiveTheme(preset.accentHex);
      setEmailState(prev => ({
        ...prev,
        voice: {
          ...prev.voice,
          preset: presetId,
          warmth: preset.defaultWarmth,
          professionalism: preset.defaultProf
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
    const preset = voicePresets.find(p => p.id === emailState.voice.preset);
    if (!preset) return;

    const warmthInstruction = getWarmthLabel(emailState.voice.warmth);
    const professionalismInstruction = getProfessionalismLabel(emailState.voice.professionalism);
    const fidelityInstruction = FIDELITY_INSTRUCTIONS[emailState.fidelity.mode];
    const constraints =
      emailState.fidelity.constraints.length > 0
        ? emailState.fidelity.constraints.join(', ')
        : 'None provided.';

    const negativeList = ANTI_ROBOT_PHRASES.map((phrase) => `- ${phrase}`).join('\n');
    const goalSection = emailState.intent.goal
      ? `\n[GOAL]\n${emailState.intent.goal}`
      : '';
    const bioSection =
      emailState.voice.preset === 'ghost' && emailState.voice.bioSample?.trim()
        ? `\n[BIO SAMPLE]\n"${emailState.voice.bioSample.trim()}"`
        : '';

    const promptTemplate = `[ROLE]
You are a professional communication specialist operating in the "${preset.name}" persona.
Your mission: compile the user’s rough draft into a finalized message strictly following the instructions below.

[PARAMETERS]
- Warmth: ${warmthInstruction}
- Professionalism: ${professionalismInstruction}
- Fidelity Mode: ${fidelityInstruction}
- Length Preference: ${emailState.voice.length}
- Constraints: ${constraints}

[VOICE GUIDANCE]
Persona directives: ${preset.instruction}
Negative phrases to avoid:
${negativeList}

[INPUT DRAFT]
"${emailState.intent.rawInput.trim()}"${goalSection}${bioSection}

[OUTPUT REQUIREMENTS]
1. Preserve factual intent from the input.
2. Apply the slider instructions literally.
3. Do not add information not found in the draft.
4. Reply with the final email only. No commentary about these rules.`;

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
                  EMAIL <span className="font-bold text-amber-500">ARMORY</span>
                </h1>
                <p className="text-amber-500/40 text-[10px] font-mono tracking-widest uppercase">
                  v1.0 • Anti-LLM Drift System
                </p>
              </div>
              
              {/* Focus/Advanced Toggle */}
              <div className="ml-4">
                <SystemStateToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
            
            {/* RIGHT SIDE: Navigation Stack */}
            <DashboardHeaderControls currentApp="text" />
          </div>
          
          {/* Secondary Status Row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500/40 uppercase">Secure Connection</span>
              <div className="h-px w-12 bg-amber-500/20" />
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            1. VOICE SIGNATURE PRESETS (Always Visible)
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                      style={{ backgroundColor: preset.accentHex }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className={`text-lg mb-2 transition-colors ${isActive ? preset.color : 'text-white/40 group-hover:text-white/70'}`}>
                      {preset.icon}
                    </div>
                    <div className={`text-sm font-medium mb-1 ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {preset.name} <span className="opacity-50 font-mono text-xs">{preset.label}</span>
                    </div>
                  </div>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 w-full h-0.5"
                      style={{ backgroundColor: preset.accentHex }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            2. YOUR CONTENT (Input) - Always Visible
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Your Content</span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>
          
          <div className="relative group">
            <textarea
              value={emailState.intent.rawInput}
              onChange={(e) => setEmailState(prev => ({ 
                ...prev, 
                intent: { ...prev.intent, rawInput: e.target.value } 
              }))}
              placeholder="Paste your messy draft, bullet points, or rough notes here..."
              rows={6}
              className="w-full bg-white border border-white/10 px-6 py-5 text-lg font-light text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300 shadow-lg resize-none font-mono"
            />
            <div className={`absolute right-4 top-4 text-xs font-mono transition-colors duration-300 ${emailState.intent.rawInput.length > 0 ? 'text-black/70' : 'text-black/30'}`}>
              {emailState.intent.rawInput.length > 0 && `${emailState.intent.rawInput.length} CHARS`}
            </div>
            
            {/* Goal Input (Optional overlay) */}
            <div className="absolute bottom-4 left-4 right-4">
              <input
                type="text"
                value={emailState.intent.goal}
                onChange={(e) => setEmailState(prev => ({ 
                  ...prev, 
                  intent: { ...prev.intent, goal: e.target.value } 
                }))}
                placeholder="Goal (optional): e.g., 'Decline the meeting politely'"
                className="w-full bg-black/5 backdrop-blur-sm border border-black/10 px-4 py-2 text-sm text-black placeholder-black/40 focus:outline-none focus:border-amber-500/50 transition-all duration-300 rounded"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            3. COMMUNICATION CONTROLS (Collapsible via View Mode)
        ───────────────────────────────────────────────────────────────────── */}
        {/* Note: We use CollapsibleSection but defaultOpen depends on viewMode. 
            Actually, based on plan, we want it Collapsed in Focus Mode. */}
        <CollapsibleSection 
          title="Communication Controls" 
          defaultOpen={viewMode === 'advanced'}
          // We want to allow manual override, so we just initialize based on viewMode 
          // but let the component handle internal state. 
          // However, to truly sync with global toggle, we can pass `isOpen` prop controlled by a local effect
          // or just let the user open it if they need to.
          // For this implementation, we'll just set defaultOpen.
        >
          <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg space-y-8">
            
            {/* SLIDERS ROW */}
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

            {/* FINE TUNING ROW (Fidelity & Format) - Only in Advanced Mode visually or just below sliders */}
            <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Ghost Mode Bio Sample (Conditional) */}
              {emailState.voice.preset === 'ghost' && (
                <div className="animate-in fade-in slide-in-from-right duration-300">
                  <label className="block text-xs font-bold tracking-widest text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <Ghost size={12} /> Bio-Metric Sample
                  </label>
                  <textarea
                    value={emailState.voice.bioSample}
                    onChange={(e) => setEmailState(prev => ({ ...prev, voice: { ...prev.voice, bioSample: e.target.value } }))}
                    placeholder="Paste 3 sentences of your writing..."
                    className="w-full h-32 bg-purple-900/10 border border-purple-500/30 rounded p-3 text-xs text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-500/60 resize-none"
                  />
                </div>
              )}
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
                COPY PASTE INTO CHATGPT / CLAUDE
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
            <span>PROMPT ARMORY v3.0</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default EmailArmory;
