'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0c12] flex items-center justify-center px-4">
      {/* Ambient glow + grid */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <div
          className="h-[720px] w-[720px] rounded-full animate-nx-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(45,191,163,0.18) 0%, rgba(45,191,163,0.05) 40%, transparent 70%)' }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Orb mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative h-16 w-16 mb-6">
            <span className="absolute inset-0 rounded-full border border-[#2dbfa3]/30 animate-nx-orb-ripple" />
            <span className="absolute inset-0 rounded-full border border-[#2dbfa3]/20 animate-nx-orb-ripple" style={{ animationDelay: '2s' }} />
            <span
              className="absolute inset-0 rounded-full animate-nx-orb-breath"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #6ff0d6 0%, #2dbfa3 45%, #1a8470 100%)',
                boxShadow: '0 0 40px rgba(45,191,163,0.45), inset 0 0 12px rgba(255,255,255,0.25)',
              }}
            />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Nexus Cell</h1>
          <p className="text-[#e8ecf3]/60 mt-2 text-sm">Your executive command center</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
        >
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-[#e8ecf3]/50 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/25 transition focus:outline-none focus:border-[#2dbfa3] focus:ring-4 focus:ring-[#2dbfa3]/15"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-[#e8ecf3]/50 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-16 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/25 transition focus:outline-none focus:border-[#2dbfa3] focus:ring-4 focus:ring-[#2dbfa3]/15"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#e8ecf3]/50 hover:text-[#2dbfa3] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !supabase}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-[#04110e] bg-gradient-to-b from-[#3fd6ba] to-[#2dbfa3] shadow-[0_8px_24px_-8px_rgba(45,191,163,0.6)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#e8ecf3]/35">
          Private access · Authorized users only
        </p>
      </div>
    </div>
  )
}
