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
  
  // Track if initial sync has been done to avoid duplicate syncs
  const initialSyncDone = useRef(false);
  const lastSyncEvent = useRef<string | null>(null);
  
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
      if (session?.user && !initialSyncDone.current) {
        initialSyncDone.current = true;
        console.log('[Auth] Initial session found, syncing subscription...');
        // Small delay to ensure everything is initialized
        setTimeout(() => {
          syncSubscription().catch(err => {
            console.log('[Auth] Initial subscription sync error (non-fatal):', err?.message || err);
          });
        }, 100);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Prevent duplicate syncs for the same event type in quick succession
        const eventKey = `${event}-${session?.user?.id || 'none'}`;
        if (lastSyncEvent.current === eventKey) {
          console.log('[Auth] Skipping duplicate sync for:', event);
          return;
        }
        lastSyncEvent.current = eventKey;
        
        // Clear the event key after a short delay to allow future syncs
        setTimeout(() => {
          if (lastSyncEvent.current === eventKey) {
            lastSyncEvent.current = null;
          }
        }, 2000);
        
        // Handle subscription sync based on auth event
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] User signed in, syncing subscription...');
          // Use debounced sync to handle rapid auth state changes
          syncSubscription().catch(err => {
            // Only log non-abort errors
            if (!err?.message?.includes('aborted') && !err?.message?.includes('signal')) {
              console.log('[Auth] Subscription sync error (non-fatal):', err?.message || err);
            }
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out, clearing subscription...');
          clearSubscription();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Skip sync on token refresh to reduce API calls - subscription rarely changes
          console.log('[Auth] Token refreshed, skipping subscription sync');
        }
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
