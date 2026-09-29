'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BRAND } from '@/lib/brand'

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
    <div className="relative min-h-screen overflow-hidden bg-[#0A0B0C] flex items-center justify-center px-6 py-16">
      {/* Gold ambient light, as on the pitch site's gate */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(205,161,75,0.08), transparent 60%)' }}
      />
      {/* Pine silhouettes along the foot of the screen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.pines}
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 bottom-0 w-[min(100%,1480px)] h-auto -translate-x-1/2 translate-y-[12%]"
        style={{ filter: 'brightness(.09)' }}
      />

      <div className="relative w-full max-w-[360px] flex flex-col items-center text-center animate-fade-in-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.badge} alt={BRAND.fullName} className="w-[150px] h-auto mb-6" />
        <span className="font-display text-xs uppercase tracking-[0.22em] text-[#9AA0A4] mb-8">
          {BRAND.tagline}
        </span>

        <form onSubmit={handleLogin} className="w-full space-y-3 text-left">
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[48px] px-4 bg-[#0E0F11] border border-[#4C5257] text-[#F5F5F5] text-base tracking-wide outline-none transition-colors placeholder:font-display placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-[#6E7578] focus:border-[#CDA14B]"
            placeholder="Email"
            required
          />

          <label htmlFor="password" className="sr-only">Password</label>
          <div className="flex w-full">
            <div className="relative flex-1 min-w-0">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] pl-4 pr-14 bg-[#0E0F11] border border-r-0 border-[#4C5257] text-[#F5F5F5] text-base tracking-wide outline-none transition-colors placeholder:font-display placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-[#6E7578] focus:border-[#CDA14B]"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[10px] uppercase tracking-[0.16em] text-[#6E7578] hover:text-[#CDA14B] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !supabase}
              className="min-h-[48px] px-[22px] bg-[#F5F5F5] text-[#0A0B0C] font-display text-[13px] uppercase tracking-[0.16em] transition-colors hover:bg-[#CDA14B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '…' : 'Enter'}
            </button>
          </div>

          <p role="alert" className="min-h-[20px] text-sm text-[#CDA14B] text-center">
            {error}
          </p>
        </form>

        <p className="mt-10 font-display text-[10px] uppercase tracking-[0.22em] text-[#6E7578]">
          Powered by Nexus Cell
        </p>
      </div>
    </div>
  )
}
