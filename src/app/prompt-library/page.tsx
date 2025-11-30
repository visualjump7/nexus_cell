'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Save, Tag, Zap, Users } from 'lucide-react';

export default function PromptLibraryPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
      </div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm font-mono"
        >
          <ArrowLeft size={16} />
          <span className="uppercase tracking-wider">Back to Armory</span>
        </Link>

        {/* Main Content Card */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-12 backdrop-blur-sm">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(245,158,11,0.3)',
                    '0 0 40px rgba(245,158,11,0.5)',
                    '0 0 20px rgba(245,158,11,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full"
              >
                <BookOpen size={80} className="text-amber-400" strokeWidth={1.5} />
              </motion.div>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-bold text-center mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
          >
            Your Prompt Library
          </motion.h1>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
            <span className="text-amber-400 font-mono text-sm uppercase tracking-[0.3em]">
              Coming Soon
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-white/70 text-center mb-10 leading-relaxed max-w-lg mx-auto"
          >
            Save, organize, and reuse your favorite prompt combinations. This feature is currently 
            in development and will be available in a future update.
          </motion.p>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
          >
            {[
              { icon: Save, text: 'Save custom prompt configurations' },
              { icon: Tag, text: 'Organize prompts with tags and categories' },
              { icon: Zap, text: 'Quick-load saved prompts' },
              { icon: Users, text: 'Share prompts with team members' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors"
              >
                <feature.icon size={18} className="text-amber-400/70 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm leading-relaxed">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex justify-center"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-amber-500/10 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/20 hover:border-amber-500 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-mono text-sm uppercase tracking-wider">Return to Dashboard</span>
            </Link>
          </motion.div>
        </div>

        {/* Version Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="text-center mt-6"
        >
          <span className="text-white/20 font-mono text-xs tracking-widest">
            VISUAL ARMORY v3.0 • MODULE OFFLINE
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
