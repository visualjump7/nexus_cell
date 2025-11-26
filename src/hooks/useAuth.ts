'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Profile, SubscriptionPlan } from '@/types';

export function useAuth() {
  const supabase = createClient();
  const { 
    user, 
    profile, 
    plan,
    isLoading,
    setUser, 
    setProfile, 
    setPlan,
    setIsLoading,
    isAuthenticated,
    isPro,
    isTeam,
    canGenerate,
    generationsRemaining,
  } = useAuthStore();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setPlan(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    setProfile(profileData as Profile);

    // Fetch subscription plan
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', profileData.subscription_tier)
      .single();

    setPlan(planData as SubscriptionPlan);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithDiscord = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data) {
      setProfile(data as Profile);
    }

    return { data, error };
  };

  return {
    user,
    profile,
    plan,
    isLoading,
    isAuthenticated: isAuthenticated(),
    isPro: isPro(),
    isTeam: isTeam(),
    canGenerate: canGenerate(),
    generationsRemaining: generationsRemaining(),
    signIn,
    signUp,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
