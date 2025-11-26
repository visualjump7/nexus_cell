import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Profile, SubscriptionPlan } from '@/types';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setPlan: (plan: SubscriptionPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Computed helpers
  isAuthenticated: () => boolean;
  isPro: () => boolean;
  isTeam: () => boolean;
  canGenerate: () => boolean;
  generationsRemaining: () => number;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  plan: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setPlan: (plan) => set({ plan }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  isAuthenticated: () => get().user !== null,
  
  isPro: () => {
    const tier = get().profile?.subscription_tier;
    return tier === 'pro' || tier === 'team' || tier === 'enterprise';
  },
  
  isTeam: () => {
    const tier = get().profile?.subscription_tier;
    return tier === 'team' || tier === 'enterprise';
  },
  
  canGenerate: () => {
    const { profile, plan } = get();
    if (!profile || !plan) return false;
    if (plan.generations_per_month === -1) return true; // Unlimited
    return profile.generations_this_month < plan.generations_per_month;
  },
  
  generationsRemaining: () => {
    const { profile, plan } = get();
    if (!profile || !plan) return 0;
    if (plan.generations_per_month === -1) return Infinity;
    return Math.max(0, plan.generations_per_month - profile.generations_this_month);
  },
}));
