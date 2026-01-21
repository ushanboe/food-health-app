'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-client';
import { syncSubscription, useSubscriptionStore } from '@/lib/subscription';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  supabase: SupabaseClient | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  // Track sync state to prevent duplicates
  const hasSyncedInitial = useRef(false);
  const lastSyncUserId = useRef<string | null>(null);
  
  // Get subscription store actions
  const clearSubscription = useSubscriptionStore((state) => state.clearSubscription);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    
    if (!configured) {
      setLoading(false);
      return;
    }

    const client = getSupabaseClient();
    setSupabase(client);
    
    if (!client) {
      setLoading(false);
      return;
    }

    // Get initial session
    client.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Sync subscription if user is logged in (initial load only)
      if (session?.user && !hasSyncedInitial.current) {
        hasSyncedInitial.current = true;
        lastSyncUserId.current = session.user.id;
        console.log('[Auth] Initial session found, syncing subscription...');
        // Delay to ensure everything is initialized
        setTimeout(() => {
          syncSubscription().catch(() => {
            // Errors are handled inside syncSubscription
          });
        }, 300);
      }
    }).catch((err) => {
      // Handle any errors during initial session fetch
      console.log('[Auth] Error getting initial session:', err?.message || err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle subscription sync based on auth event
        if (event === 'SIGNED_IN' && session?.user) {
          // Only sync if this is a different user or first sign in
          if (lastSyncUserId.current !== session.user.id) {
            lastSyncUserId.current = session.user.id;
            console.log('[Auth] User signed in, syncing subscription...');
            // Delay to prevent race conditions
            setTimeout(() => {
              syncSubscription().catch(() => {
                // Errors are handled inside syncSubscription
              });
            }, 500);
          } else {
            console.log('[Auth] Same user, skipping duplicate sync');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out, clearing subscription...');
          lastSyncUserId.current = null;
          hasSyncedInitial.current = false;
          clearSubscription();
        }
        // Skip sync on TOKEN_REFRESHED - subscription rarely changes
      }
    );

    return () => subscription.unsubscribe();
  }, [clearSubscription]);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not configured') };
    
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    return { error: error as Error | null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not configured') };
    
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not configured') };
    
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    
    await client.auth.signOut();
    setUser(null);
    setSession(null);
    // Subscription will be cleared by the onAuthStateChange handler
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not configured') };
    
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined,
    });
    return { error: error as Error | null };
  }, []);

  const value = {
    user,
    session,
    loading,
    isConfigured,
    supabase,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
