// Subscription Store & Premium Hook
// Manages subscription state for FitFork Premium
// Integrates with Supabase for persistent subscription data

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from './supabase-client';

// Subscription tier definitions
export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing' | 'none';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year' | 'once' | null;
  priceDisplay: string;
  savings?: string;
  features: string[];
  stripePriceId?: string; // Will be set when Stripe is configured
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    priceDisplay: 'Free',
    features: [
      'Basic food logging',
      'Daily calorie tracking',
      'Water intake tracking',
      'Weight logging',
      'Basic nutrition goals',
      '7-day history',
      'Up to 5 saved recipes',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 4.99,
    interval: 'month',
    priceDisplay: '$4.99/month',
    features: [
      'Everything in Free, plus:',
      'Unlimited history',
      'Cloud sync across devices',
      'Advanced analytics & insights',
      'Strava integration',
      'Data export (CSV/JSON)',
      'Custom profile photo',
      'Unlimited saved recipes',
      'Priority support',
    ],
  },
  annual: {
    id: 'annual',
    name: 'Premium Annual',
    price: 29.99,
    interval: 'year',
    priceDisplay: '$29.99/year',
    savings: 'Save 50%',
    features: [
      'Everything in Free, plus:',
      'Unlimited history',
      'Cloud sync across devices',
      'Advanced analytics & insights',
      'Strava integration',
      'Data export (CSV/JSON)',
      'Custom profile photo',
      'Unlimited saved recipes',
      'Priority support',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Premium Lifetime',
    price: 79.99,
    interval: 'once',
    priceDisplay: '$79.99 once',
    savings: 'Best Value',
    features: [
      'Everything in Free, plus:',
      'Unlimited history',
      'Cloud sync across devices',
      'Advanced analytics & insights',
      'Strava integration',
      'Data export (CSV/JSON)',
      'Custom profile photo',
      'Unlimited saved recipes',
      'Priority support',
      'Lifetime access - no recurring fees',
    ],
  },
};

// Premium feature flags
export const PREMIUM_FEATURES = {
  cloudSync: { name: 'Cloud Sync', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  advancedAnalytics: { name: 'Advanced Analytics', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  stravaSync: { name: 'Strava Integration', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  dataExport: { name: 'Data Export', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  profilePhoto: { name: 'Profile Photo', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  unlimitedRecipes: { name: 'Unlimited Recipes', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
  unlimitedHistory: { name: 'Unlimited History', requiredTier: ['monthly', 'annual', 'lifetime'] as SubscriptionTier[] },
} as const;

export type PremiumFeature = keyof typeof PREMIUM_FEATURES;

// Supabase subscription record type
export interface SupabaseSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

// Subscription state interface
export interface SubscriptionState {
  // Current subscription info
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  
  // Stripe info (populated after payment)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  
  // Sync status
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
  
  // Dev mode override
  devModeEnabled: boolean;
  
  // Actions
  setSubscription: (data: Partial<SubscriptionState>) => void;
  clearSubscription: () => void;
  setDevMode: (enabled: boolean) => void;
  syncFromSupabase: () => Promise<boolean>;
  
  // Computed helpers
  isPremium: () => boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  getPlan: () => SubscriptionPlan;
  getDaysRemaining: () => number | null;
}

const initialState = {
  tier: 'free' as SubscriptionTier,
  status: 'none' as SubscriptionStatus,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  lastSyncedAt: null,
  isSyncing: false,
  syncError: null,
  devModeEnabled: false,
};

// Helper to check if an error is an abort error (expected, not a real error)
function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    return (
      name === 'aborterror' ||
      msg.includes('abort') ||
      msg.includes('signal') ||
      msg.includes('cancelled') ||
      msg.includes('canceled')
    );
  }
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === 'string') {
      const msg = errObj.message.toLowerCase();
      return msg.includes('abort') || msg.includes('signal');
    }
  }
  return false;
}

// Sync state management
let isSyncInProgress = false;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSubscription: (data) => set((state) => ({ ...state, ...data })),
      
      clearSubscription: () => set({
        ...initialState,
        devModeEnabled: get().devModeEnabled // Preserve dev mode on clear
      }),
      
      setDevMode: (enabled) => set({ devModeEnabled: enabled }),
      
      // Sync subscription from Supabase with proper error handling
      syncFromSupabase: async (): Promise<boolean> => {
        // Prevent concurrent syncs
        if (isSyncInProgress) {
          console.log('[Subscription] Sync already in progress, skipping');
          return false;
        }
        
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.log('[Subscription] Supabase not initialized, skipping sync');
          return false;
        }
        
        isSyncInProgress = true;
        
        try {
          set({ isSyncing: true, syncError: null });
          
          // Get current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            // Check if it's an abort error - these are expected and not real errors
            if (isAbortError(userError)) {
              console.log('[Subscription] User fetch was cancelled (expected)');
              set({ isSyncing: false });
              return false;
            }
            throw userError;
          }
          
          if (!user) {
            console.log('[Subscription] No user logged in, using free tier');
            set({
              tier: 'free',
              status: 'none',
              currentPeriodStart: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              lastSyncedAt: new Date().toISOString(),
              isSyncing: false,
              syncError: null,
            });
            return false;
          }
          
          // Fetch subscription from Supabase
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            // Check if it's an abort error
            if (isAbortError(error)) {
              console.log('[Subscription] Subscription fetch was cancelled (expected)');
              set({ isSyncing: false });
              return false;
            }
            
            // No subscription found - user might be new
            if (error.code === 'PGRST116') {
              console.log('[Subscription] No subscription found, using free tier');
              set({
                tier: 'free',
                status: 'active',
                currentPeriodStart: null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                lastSyncedAt: new Date().toISOString(),
                isSyncing: false,
                syncError: null,
              });
              return true;
            }
            throw error;
          }
          
          const sub = data as SupabaseSubscription;
          
          // Update local state with Supabase data
          set({
            tier: sub.plan,
            status: sub.status,
            currentPeriodStart: sub.current_period_start,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            stripeCustomerId: sub.stripe_customer_id,
            stripeSubscriptionId: sub.stripe_subscription_id,
            lastSyncedAt: new Date().toISOString(),
            isSyncing: false,
            syncError: null,
          });
          
          console.log('[Subscription] Synced from Supabase:', sub.plan, sub.status);
          return true;
          
        } catch (error: unknown) {
          // Handle abort errors silently - they're expected during rapid navigation
          if (isAbortError(error)) {
            console.log('[Subscription] Sync was cancelled (expected)');
            set({ isSyncing: false });
            return false;
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync subscription';
          console.error('[Subscription] Sync error:', errorMessage);
          set({
            isSyncing: false,
            syncError: errorMessage
          });
          return false;
        } finally {
          isSyncInProgress = false;
        }
      },
      
      isPremium: () => {
        const state = get();
        // Dev mode override
        if (state.devModeEnabled) return true;
        
        // Free tier is never premium
        if (state.tier === 'free') return false;
        
        // Lifetime is always premium if active
        if (state.tier === 'lifetime' && state.status === 'active') return true;
        
        // Monthly/Annual must be active
        if ((state.tier === 'monthly' || state.tier === 'annual') && state.status === 'active') {
          // Check if within billing period
          if (state.currentPeriodEnd) {
            const periodEnd = new Date(state.currentPeriodEnd);
            if (periodEnd < new Date()) {
              return false; // Period expired
            }
          }
          return true;
        }
        
        // Trialing is also considered premium
        if (state.status === 'trialing') return true;
        
        return false;
      },
      
      hasFeature: (feature: PremiumFeature) => {
        const state = get();
        // Dev mode override
        if (state.devModeEnabled) return true;
        // Check if current tier has the feature and subscription is active
        const featureConfig = PREMIUM_FEATURES[feature];
        const isPremiumActive = get().isPremium();
        return featureConfig.requiredTier.includes(state.tier) && isPremiumActive;
      },
      
      getPlan: () => {
        const state = get();
        return SUBSCRIPTION_PLANS[state.tier];
      },
      
      getDaysRemaining: () => {
        const state = get();
        if (!state.currentPeriodEnd) return null;
        if (state.tier === 'lifetime') return null; // Lifetime has no end
        const end = new Date(state.currentPeriodEnd);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },
    }),
    {
      name: 'fitfork-subscription',
    }
  )
);

// Convenience hook for premium status
export function usePremium() {
  const store = useSubscriptionStore();
  
  return {
    isPremium: store.isPremium(),
    tier: store.tier,
    status: store.status,
    plan: store.getPlan(),
    daysRemaining: store.getDaysRemaining(),
    cancelAtPeriodEnd: store.cancelAtPeriodEnd,
    hasFeature: store.hasFeature,
    devModeEnabled: store.devModeEnabled,
    setDevMode: store.setDevMode,
    // Sync functions
    syncFromSupabase: store.syncFromSupabase,
    isSyncing: store.isSyncing,
    syncError: store.syncError,
    lastSyncedAt: store.lastSyncedAt,
  };
}

// Hook to check specific feature access
export function useFeatureAccess(feature: PremiumFeature) {
  const store = useSubscriptionStore();
  const hasAccess = store.hasFeature(feature);
  const featureInfo = PREMIUM_FEATURES[feature];
  
  return {
    hasAccess,
    featureName: featureInfo.name,
    requiredTiers: featureInfo.requiredTier,
  };
}

// Debounced sync function to prevent rapid-fire calls
export async function syncSubscription(): Promise<boolean> {
  // Clear any pending debounce timer
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  
  // Return a promise that resolves after debounce
  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      try {
        const result = await useSubscriptionStore.getState().syncFromSupabase();
        resolve(result);
      } catch (error) {
        // Silently handle any errors during sync
        if (!isAbortError(error)) {
          console.log('[Subscription] Sync error (non-fatal):', error);
        }
        resolve(false);
      }
    }, 500); // 500ms debounce - longer to prevent overlaps
  });
}
