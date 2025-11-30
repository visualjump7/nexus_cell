'use client';

import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT WHITEPAPER — Roadmap & Next Steps
// ═══════════════════════════════════════════════════════════════════════════════

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-white/20">
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        
        {/* Grid Pattern */}
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

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        <header className="mb-12">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-xs font-mono uppercase tracking-wider">Back to Armory</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-white/20" />
              <div className="w-1 h-1 bg-white/20" />
              <div className="w-1 h-1 bg-white/20" />
            </div>
            <div className="h-px w-12 bg-white/20" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">Documentation</span>
          </div>
          
          <h1 className="text-4xl font-light tracking-tighter mb-4 text-white">
            PROJECT <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">WHITEPAPER</span>
          </h1>
          <p className="text-white/40 text-sm font-mono tracking-wide max-w-2xl">
            Roadmap, next steps, and planned features for Prompt Armory.
          </p>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            CONTENT ENTRIES
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-8">
          
          {/* Entry 1 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-amber-400 text-xl">◎</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">Camera Angle Visualizer</h2>
              <span className="text-[10px] px-2 py-1 bg-amber-500/20 text-amber-400 font-mono uppercase">Planned</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Incorporate visual references (potentially using AI-generated examples) to show what each camera angle actually looks like. 
              Users will be able to see a preview of "Low Angle", "Dutch Angle", "Bird's Eye View", etc. to better understand 
              the cinematic effect before adding it to their prompt.
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: High • Complexity: Medium
            </div>
          </article>

          {/* Entry 2 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-emerald-400 text-xl">★</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">Custom Prompts Library</h2>
              <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 font-mono uppercase">In Progress</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Allow users to save their crafted prompts to a personal library. Saved prompts will appear in a 
              "Custom Prompts" dropdown alongside Cinematic Presets. Users can name, organize, and quickly recall 
              their favorite prompt configurations.
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: High • Complexity: Low
            </div>
          </article>

          {/* Entry 3 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-purple-400 text-xl">◈</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">Notes & Templates System</h2>
              <span className="text-[10px] px-2 py-1 bg-white/10 text-white/50 font-mono uppercase">Planned</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              A notes system where users can store prompt templates, ideas, and reference material. 
              This will integrate with the main prompt builder, allowing quick insertion of commonly used phrases or modifiers.
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: Medium • Complexity: Medium
            </div>
          </article>

          {/* Entry 4 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-blue-400 text-xl">◉</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">User Authentication & Cloud Sync</h2>
              <span className="text-[10px] px-2 py-1 bg-white/10 text-white/50 font-mono uppercase">Planned</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Enable user accounts via Supabase authentication. This will allow prompts, presets, and notes to sync 
              across devices. Users will be able to access their library from any browser.
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: Medium • Complexity: High
            </div>
          </article>

          {/* Entry 5 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-rose-400 text-xl">▸</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">Direct Generation Integration</h2>
              <span className="text-[10px] px-2 py-1 bg-white/10 text-white/50 font-mono uppercase">Future</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Connect directly to AI APIs (DALL-E, Stable Diffusion, etc.) to generate images without leaving 
              Prompt Armory. Results would be displayed inline with options to save, iterate, or refine the prompt.
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: Low • Complexity: High
            </div>
          </article>

          {/* Entry 6 */}
          <article className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-cyan-400 text-xl">✎</span>
              <h2 className="text-lg font-mono uppercase tracking-wider text-white">Content Writing & Email Support</h2>
              <span className="text-[10px] px-2 py-1 bg-cyan-500/20 text-cyan-400 font-mono uppercase">In Progress</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Expand beyond visual prompts to support text generation. We will add specialized prompt templates 
              and modules for content writing, copywriting, and professional email composition. This will include 
              tone modifiers, structure templates, and platform-specific formatting (LinkedIn, Twitter, Email).
            </p>
            <div className="text-[10px] font-mono text-white/30 uppercase">
              Priority: Medium • Complexity: Medium
            </div>
          </article>

        </section>

        {/* ─────────────────────────────────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────────────────────────────────── */}
        <footer className="mt-16 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>VISUAL ARMORY — Project Whitepaper</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

