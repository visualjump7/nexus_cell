'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL CONSTRUCTION BAY — Anti-LLM Drift System
// Polymorphic Text Generation with Fidelity Control & Voice Signatures
// ═══════════════════════════════════════════════════════════════════════════════

// The Email Master State Object (Polymorphic Architecture)
interface EmailState {
  intent: {
    rawInput: string;
    goal: string;
  };
  fidelity: {
    mode: 'polisher' | 'expander' | 'reducer' | 'transmuter' | 'articulator';
    constraints: string[];
  };
  voice: {
    preset: 'executive' | 'diplomat' | 'engineer' | 'slack' | 'ghost' | 'articulator';
    warmth: number; // 0.0 (Cold) to 1.0 (Warm)
    professionalism: number; // 0.0 (Casual) to 1.0 (Formal)
    length: 'short' | 'medium' | 'long';
  };
  outputFormat: {
    platform: 'email' | 'slack' | 'linkedin' | 'tweet';
    structure: 'paragraphs' | 'bullets';
  };
  ghost: {
    bioMetricSample: string;
    enabled: boolean;
  };
}

interface VoicePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  systemPrompt: string;
}

interface FidelityLevel {
  id: string;
  name: string;
  icon: string;
  description: string;
  promptInjection: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE HUMANIZER FILTER — Anti-Robot Negative Prompts
// ═══════════════════════════════════════════════════════════════════════════════
const ANTI_ROBOT_PHRASES = [
  "I hope this email finds you well",
  "Delve into",
  "Tapestry of",
  "Testament to",
  "Game-changer",
  "Please do not hesitate to reach out",
  "In today's fast-paced world",
  "At the end of the day",
  "Moving forward",
  "Circle back",
  "Leverage",
  "Synergy",
  "Touch base",
  "Low-hanging fruit"
];

const EmailConstructionBay = () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // The Master State Object
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
      preset: 'articulator',
      warmth: 0.5,
      professionalism: 0.7,
      length: 'medium'
    },
    outputFormat: {
      platform: 'email',
      structure: 'paragraphs'
    },
    ghost: {
      bioMetricSample: '',
      enabled: false
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // VOICE SIGNATURE PRESETS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const voicePresets: VoicePreset[] = [
    {
      id: 'articulator',
      name: 'The Articulator (Me)',
      icon: '✦',
      description: 'Elevates syntax while preserving your authentic voice',
      color: '#8b5cf6',
      systemPrompt: 'Elevate the vocabulary and sentence structure while strictly preserving the original tone, intent, and personality. Do not add new ideas or change the meaning. Make it sound more polished but unmistakably like the original author wrote it.'
    },
    {
      id: 'ghost',
      name: 'The Ghost',
      icon: '◎',
      description: 'Mimics your writing style from samples',
      color: '#64748b',
      systemPrompt: 'Analyze the provided style sample and mimic the sentence length, vocabulary complexity, punctuation patterns, and unique quirks exactly. The output should be indistinguishable from the user\'s natural writing.'
    },
    {
      id: 'slack',
      name: 'The Slack',
      icon: '⚡',
      description: 'Internal / Casual / Fast',
      color: '#22d3ee',
      systemPrompt: 'Write casually. Lowercase allowed. No salutations or sign-offs. Use common abbreviations. Sound like a quick human typist sending a message between meetings, not a generated letter.'
    },
    {
      id: 'engineer',
      name: 'The Engineer',
      icon: '◈',
      description: 'Technical / Dry / Precise',
      color: '#10b981',
      systemPrompt: 'Focus exclusively on facts and data. Remove all emotional language. Use structured formatting with lists and clear sections where appropriate. No marketing speak or fluffy adjectives.'
    },
    {
      id: 'diplomat',
      name: 'The Diplomat',
      icon: '◐',
      description: 'Soft / HR / Client-Facing',
      color: '#f59e0b',
      systemPrompt: 'Use passive voice where necessary to soften direct statements. Validate the recipient\'s perspective. Maintain professional warmth without using cliché AI phrases. Be tactful but clear.'
    },
    {
      id: 'executive',
      name: 'The Executive',
      icon: '◆',
      description: 'CEO / Busy / Direct',
      color: '#ef4444',
      systemPrompt: 'Use fewer than 50 words. No opening greeting ("I hope you are well"). No closing fluff. State the point immediately. Brute efficiency. Every word must earn its place.'
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // FIDELITY LEVELS (Intervention Control)
  // ─────────────────────────────────────────────────────────────────────────────
  
  const fidelityLevels: FidelityLevel[] = [
    {
      id: 'polisher',
      name: 'Polisher',
      icon: '✓',
      description: 'Grammar & flow only',
      promptInjection: 'Do not add new sentences. Do not change the tone or meaning. Only correct spelling, punctuation, and awkward phrasing. Retain 100% of user intent.'
    },
    {
      id: 'expander',
      name: 'Expander',
      icon: '↗',
      description: 'Bullets to prose',
      promptInjection: 'Convert these bullet points or rough notes into cohesive, flowing sentences. Keep it lean and efficient. Do not add information that wasn\'t implied.'
    },
    {
      id: 'reducer',
      name: 'Reducer',
      icon: '↙',
      description: 'Strip to essentials',
      promptInjection: 'Remove all pleasantries and unnecessary words. Remove adjectives unless critical. State the action item or core message with maximum clarity and minimum words.'
    },
    {
      id: 'transmuter',
      name: 'Transmuter',
      icon: '⟳',
      description: 'Full rewrite',
      promptInjection: 'Rewrite this concept entirely to match the selected voice preset. You may restructure completely, but preserve the core intent and all factual information.'
    },
    {
      id: 'articulator',
      name: 'Articulator',
      icon: '✦',
      description: 'Elevate syntax',
      promptInjection: 'Elevate the vocabulary and sentence structure to sound more sophisticated, while strictly preserving the original tone and intent. Make it sound like a more articulate version of the same person.'
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTPUT PLATFORMS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const outputPlatforms = [
    { id: 'email', name: 'Email', icon: '✉', maxLength: null },
    { id: 'slack', name: 'Slack', icon: '#', maxLength: null },
    { id: 'linkedin', name: 'LinkedIn', icon: 'in', maxLength: 3000 },
    { id: 'tweet', name: 'Tweet', icon: '𝕏', maxLength: 280 }
  ];

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
  // GENERATE OUTPUT (Simulated - would connect to LLM API)
  // ─────────────────────────────────────────────────────────────────────────────
  
  const generateOutput = useCallback(() => {
    const { intent, fidelity, voice, outputFormat, ghost } = emailState;
    
    if (!intent.rawInput.trim()) {
      return '> AWAITING RAW MATERIALS...';
    }

    const selectedVoice = voicePresets.find(v => v.id === voice.preset);
    const selectedFidelity = fidelityLevels.find(f => f.id === fidelity.mode);
    const warmthLabel = voice.warmth < 0.3 ? 'Cold' : voice.warmth > 0.7 ? 'Warm' : 'Neutral';
    const profLabel = voice.professionalism < 0.3 ? 'Casual' : voice.professionalism > 0.7 ? 'Formal' : 'Balanced';
    
    // Build the system prompt (this would be sent to LLM API)
    let systemPrompt = `[VOICE: ${selectedVoice?.name}]\n`;
    systemPrompt += `[FIDELITY: ${selectedFidelity?.name}]\n`;
    systemPrompt += `[TONE: ${warmthLabel} / ${profLabel}]\n`;
    systemPrompt += `[PLATFORM: ${outputFormat.platform.toUpperCase()}]\n`;
    systemPrompt += `[LENGTH: ${voice.length.toUpperCase()}]\n\n`;
    
    if (ghost.enabled && ghost.bioMetricSample) {
      systemPrompt += `[GHOST MODE: ACTIVE]\n`;
      systemPrompt += `Style Reference: "${ghost.bioMetricSample.substring(0, 100)}..."\n\n`;
    }
    
    systemPrompt += `─────────────────────────────────\n`;
    systemPrompt += `VOICE DIRECTIVE:\n${selectedVoice?.systemPrompt}\n\n`;
    systemPrompt += `FIDELITY DIRECTIVE:\n${selectedFidelity?.promptInjection}\n\n`;
    systemPrompt += `ANTI-ROBOT FILTER:\nAvoid: ${ANTI_ROBOT_PHRASES.slice(0, 5).join(', ')}...\n`;
    systemPrompt += `─────────────────────────────────\n\n`;
    
    systemPrompt += `RAW INPUT:\n"${intent.rawInput.substring(0, 200)}${intent.rawInput.length > 200 ? '...' : ''}"`;
    
    if (intent.goal) {
      systemPrompt += `\n\nGOAL: ${intent.goal}`;
    }
    
    return systemPrompt;
  }, [emailState, voicePresets, fidelityLevels]);

  useEffect(() => {
    const output = generateOutput();
    animateCipherDecode(output);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [emailState, generateOutput, animateCipherDecode]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setEmailState({
      intent: { rawInput: '', goal: '' },
      fidelity: { mode: 'expander', constraints: [] },
      voice: { preset: 'articulator', warmth: 0.5, professionalism: 0.7, length: 'medium' },
      outputFormat: { platform: 'email', structure: 'paragraphs' },
      ghost: { bioMetricSample: '', enabled: false }
    });
  };

  const getActiveSelectionsCount = () => {
    let count = 0;
    if (emailState.intent.rawInput) count++;
    if (emailState.voice.preset) count++;
    if (emailState.fidelity.mode) count++;
    if (emailState.ghost.enabled) count++;
    return count;
  };

  const currentVoice = voicePresets.find(v => v.id === emailState.voice.preset);
  const currentFidelity = fidelityLevels.find(f => f.id === emailState.fidelity.mode);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-amber-500/20">
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,158,11,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,158,11,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-[100px] animate-pulse"
            style={{ backgroundColor: currentVoice?.color || '#f59e0b', animationDuration: '8s' }}
          />
          <div 
            className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-8 blur-[120px]"
            style={{ backgroundColor: '#f59e0b', animation: 'float 20s infinite ease-in-out alternate' }}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <header className="mb-12 relative">
          <div className="flex items-end justify-between border-b border-amber-500/20 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-amber-500/40" />
                  <div className="w-1 h-1 bg-amber-500/40" />
                  <div className="w-1 h-1 bg-amber-500/40" />
                </div>
                <div className="h-px w-12 bg-amber-500/30" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-amber-400/60 uppercase">Communication Bay Online</span>
              </div>
              <h1 className="text-5xl font-light tracking-tighter mb-2 text-white">
                EMAIL <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">ARMORY</span>
              </h1>
              <p className="text-amber-400/50 text-xs font-mono tracking-widest uppercase">
                v1.0 • Anti-LLM Drift System • {getActiveSelectionsCount()} Active Parameters
              </p>
            </div>
            
            {/* Header Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-6 py-3 border border-amber-500/20 bg-black text-amber-400/60 hover:border-amber-500/40 hover:text-amber-400 transition-all duration-300 group"
              >
                <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">◇</span>
                <span className="text-xs font-mono uppercase tracking-wider">Prompt Armory</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            VOICE SIGNATURE PRESETS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Voice Signature</span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {voicePresets.map((preset) => {
              const isActive = emailState.voice.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setEmailState(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, preset: preset.id as EmailState['voice']['preset'] },
                    ghost: { ...prev.ghost, enabled: preset.id === 'ghost' }
                  }))}
                  className={`
                    group relative p-4 rounded-lg border text-left transition-all duration-300 overflow-hidden
                    ${isActive 
                      ? 'border-white/40 bg-white/10 scale-[1.02]' 
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }
                  `}
                >
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{ background: `radial-gradient(ellipse at top left, ${preset.color} 0%, transparent 60%)` }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <span 
                      className="text-2xl block mb-2"
                      style={{ color: isActive ? preset.color : 'rgba(255,255,255,0.4)' }}
                    >
                      {preset.icon}
                    </span>
                    <div className={`text-sm font-medium mb-1 ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {preset.name}
                    </div>
                    <p className="text-[10px] text-white/40 leading-tight">{preset.description}</p>
                  </div>
                  
                  <div 
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ backgroundColor: preset.color }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            INPUT SECTION
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
              className="w-full bg-black border border-amber-500/20 px-6 py-5 text-lg font-light text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all duration-300 resize-none font-mono"
            />
            <div className={`absolute right-4 top-4 text-xs font-mono transition-colors duration-300 ${emailState.intent.rawInput.length > 0 ? 'text-amber-400/70' : 'text-white/20'}`}>
              {emailState.intent.rawInput.length > 0 && `${emailState.intent.rawInput.length} CHARS`}
            </div>
            
            {/* Corner Accents */}
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-amber-500/20 pointer-events-none group-hover:border-amber-500/40 transition-colors" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-amber-500/20 pointer-events-none group-hover:border-amber-500/40 transition-colors" />
          </div>
          
          {/* Goal Input (Optional) */}
          <div className="mt-4">
            <input
              type="text"
              value={emailState.intent.goal}
              onChange={(e) => setEmailState(prev => ({ 
                ...prev, 
                intent: { ...prev.intent, goal: e.target.value } 
              }))}
              placeholder="Goal (optional): e.g., 'Decline the meeting politely'"
              className="w-full bg-black/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/30 transition-all duration-300 font-mono"
            />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            GHOST MODE: BIO-METRIC SAMPLE
        ───────────────────────────────────────────────────────────────────── */}
        {emailState.voice.preset === 'ghost' && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Bio-Metric Sample</span>
              <span className="text-[10px] text-white/30">(Paste 3 sentences you've written)</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
            </div>
            
            <textarea
              value={emailState.ghost.bioMetricSample}
              onChange={(e) => setEmailState(prev => ({ 
                ...prev, 
                ghost: { ...prev.ghost, bioMetricSample: e.target.value } 
              }))}
              placeholder="Paste a sample of your previous writing here. The AI will analyze your sentence length, vocabulary, and style patterns..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-500/30 px-6 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-slate-400/50 transition-all duration-300 resize-none font-mono"
            />
          </section>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            COMMUNICATION CONTROLS (Warmth & Professionalism)
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Communication Controls</span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-white/10 bg-white/[0.02] rounded-lg">
            {/* Warmth Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 font-mono uppercase tracking-wider">Warmth</span>
                <span className="text-amber-400 font-mono">{Math.round(emailState.voice.warmth * 100)}%</span>
              </div>
              <div className="relative">
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
                  className="w-full h-2 bg-gradient-to-r from-blue-500 via-white/20 to-orange-500 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #64748b ${emailState.voice.warmth * 50}%, #f59e0b 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white font-medium">
                <span>❄ Cold / Direct</span>
                <span>🔥 Warm / Friendly</span>
              </div>
            </div>
            
            {/* Professionalism Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 font-mono uppercase tracking-wider">Professionalism</span>
                <span className="text-amber-400 font-mono">{Math.round(emailState.voice.professionalism * 100)}%</span>
              </div>
              <div className="relative">
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
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #9ca3af 0%, #4f46e5 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white font-medium">
                <span>👋 Casual</span>
                <span>💼 Formal</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            ADVANCED CONTROLS TOGGLE
        ───────────────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-3 px-4 py-2 border transition-all duration-300 ${
              showAdvanced 
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' 
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <span className="text-sm">{showAdvanced ? '▼' : '▶'}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider">Advanced Controls</span>
            <span className="text-[10px] text-white/30">(Fidelity & Format)</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            ADVANCED: FIDELITY LEVELS
        ───────────────────────────────────────────────────────────────────── */}
        {showAdvanced && (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Fidelity Level</span>
                <span className="text-[10px] text-white/30">(How much can the AI change?)</span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
              </div>
              
              <div className="grid grid-cols-5 gap-3">
                {fidelityLevels.map((level) => {
                  const isActive = emailState.fidelity.mode === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setEmailState(prev => ({ 
                        ...prev, 
                        fidelity: { ...prev.fidelity, mode: level.id as EmailState['fidelity']['mode'] } 
                      }))}
                      className={`
                        group relative p-4 border text-center transition-all duration-300 rounded-lg
                        ${isActive 
                          ? 'border-amber-500/50 bg-amber-500/10 text-white' 
                          : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                        }
                      `}
                    >
                      <span className={`text-2xl block mb-2 ${isActive ? 'text-amber-400' : 'text-white/30'}`}>
                        {level.icon}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-wider block mb-1">{level.name}</span>
                      <span className="text-[9px] text-white/40 block">{level.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────────────
                ADVANCED: OUTPUT FORMAT
            ───────────────────────────────────────────────────────────────────── */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Output Format</span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Platform */}
                <div className="space-y-3">
                  <span className="text-xs text-white/60 font-mono uppercase tracking-wider">Platform</span>
                  <div className="grid grid-cols-4 gap-2">
                    {outputPlatforms.map((platform) => {
                      const isActive = emailState.outputFormat.platform === platform.id;
                      return (
                        <button
                          key={platform.id}
                          onClick={() => setEmailState(prev => ({ 
                            ...prev, 
                            outputFormat: { ...prev.outputFormat, platform: platform.id as EmailState['outputFormat']['platform'] } 
                          }))}
                          className={`
                            p-3 border rounded text-center transition-all duration-200
                            ${isActive 
                              ? 'border-amber-500/50 bg-amber-500/10 text-white' 
                              : 'border-white/10 text-white/40 hover:border-white/20'
                            }
                          `}
                        >
                          <span className="text-lg block">{platform.icon}</span>
                          <span className="text-[9px] font-mono uppercase">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Length */}
                <div className="space-y-3">
                  <span className="text-xs text-white/60 font-mono uppercase tracking-wider">Target Length</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['short', 'medium', 'long'].map((len) => {
                      const isActive = emailState.voice.length === len;
                      return (
                        <button
                          key={len}
                          onClick={() => setEmailState(prev => ({ 
                            ...prev, 
                            voice: { ...prev.voice, length: len as EmailState['voice']['length'] } 
                          }))}
                          className={`
                            p-3 border rounded text-center transition-all duration-200
                            ${isActive 
                              ? 'border-amber-500/50 bg-amber-500/10 text-white' 
                              : 'border-white/10 text-white/40 hover:border-white/20'
                            }
                          `}
                        >
                          <span className="text-[10px] font-mono uppercase">{len}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            OUTPUT DISPLAY
        ───────────────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">System Prompt Preview</span>
              <div 
                className="px-2 py-0.5 rounded text-xs"
                style={{ 
                  backgroundColor: `${currentVoice?.color || '#f59e0b'}20`,
                  color: currentVoice?.color || '#f59e0b'
                }}
              >
                {currentVoice?.name || 'Unknown'}
              </div>
              <div className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">
                {currentFidelity?.name || 'Unknown'}
              </div>
            </div>
            {isTransitioning && (
              <span className="text-xs text-amber-400/50 animate-pulse">Encoding...</span>
            )}
          </div>
          
          <div 
            className="relative border overflow-hidden"
            style={{ borderColor: `${currentVoice?.color || '#f59e0b'}40` }}
          >
            {/* Header bar */}
            <div 
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ 
                borderColor: `${currentVoice?.color || '#f59e0b'}20`,
                background: `linear-gradient(90deg, ${currentVoice?.color || '#f59e0b'}10 0%, transparent 100%)`
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: currentVoice?.color || '#f59e0b' }}>{currentVoice?.icon || '◆'}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">{currentVoice?.name || 'Unknown'} TERMINAL</span>
              </div>
              <div className="flex items-center gap-1 opacity-50">
                <div className="w-1.5 h-1.5 bg-white/20" />
                <div className="w-1.5 h-1.5 bg-white/20" />
                <div className="w-1.5 h-1.5 bg-white/20" />
              </div>
            </div>
            
            {/* Text content */}
            <div className="p-6 min-h-[200px] bg-black/80 relative">
              {/* Scanline effect */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.1)_50%)] bg-[length:100%_4px]" />
              
              <pre 
                className={`font-mono text-sm leading-relaxed whitespace-pre-wrap transition-opacity duration-200 ${isTransitioning ? 'text-white/50' : 'text-white/90'}`}
              >
                {displayText || '> AWAITING RAW MATERIALS...'}
              </pre>
            </div>
            
            {/* Bottom accent */}
            <div 
              className="h-0.5 w-full"
              style={{ background: `linear-gradient(90deg, ${currentVoice?.color || '#f59e0b'} 0%, transparent 100%)` }}
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
              backgroundColor: copied ? '#10b981' : currentVoice?.color || '#f59e0b',
              color: 'black'
            }}
          >
            <span className="relative z-10">
              {copied ? '✓ Copied to Clipboard!' : `Copy for ${emailState.outputFormat.platform.charAt(0).toUpperCase() + emailState.outputFormat.platform.slice(1)}`}
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
        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────────────────────────────────── */}
        <footer className="mt-12 pt-6 border-t border-amber-500/10">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>EMAIL CONSTRUCTION BAY v1.0 — Anti-LLM Drift System</span>
            <span>6 Voice Presets • 5 Fidelity Levels • 4 Platforms • Humanizer Filter Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EmailConstructionBay;
