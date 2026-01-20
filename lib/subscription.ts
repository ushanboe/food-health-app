// Subscription Store & Premium Hook
// Manages subscription state for FitFork Premium

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Subscription tier definitions
export type SubscriptionTier = 'free' | 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year' | null;
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
};

// Premium feature flags
export const PREMIUM_FEATURES = {
  cloudSync: { name: 'Cloud Sync', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  advancedAnalytics: { name: 'Advanced Analytics', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  stravaSync: { name: 'Strava Integration', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  dataExport: { name: 'Data Export', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  profilePhoto: { name: 'Profile Photo', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  unlimitedRecipes: { name: 'Unlimited Recipes', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
  unlimitedHistory: { name: 'Unlimited History', requiredTier: ['monthly', 'annual'] as SubscriptionTier[] },
} as const;

export type PremiumFeature = keyof typeof PREMIUM_FEATURES;

// Subscription state interface
export interface SubscriptionState {
  // Current subscription info
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'none';
  currentPeriodEnd: string | null; // ISO date string
  cancelAtPeriodEnd: boolean;
  
  // Stripe info (populated after payment)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  
  // Dev mode override
  devModeEnabled: boolean;
  
  // Actions
  setSubscription: (data: Partial<SubscriptionState>) => void;
  clearSubscription: () => void;
  setDevMode: (enabled: boolean) => void;
  
  // Computed helpers
  isPremium: () => boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  getPlan: () => SubscriptionPlan;
  getDaysRemaining: () => number | null;
}

const initialState = {
  tier: 'free' as SubscriptionTier,
  status: 'none' as const,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  devModeEnabled: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSubscription: (data) => set((state) => ({ ...state, ...data })),
      
      clearSubscription: () => set(initialState),
      
      setDevMode: (enabled) => set({ devModeEnabled: enabled }),
      
      isPremium: () => {
        const state = get();
        // Dev mode override
        if (state.devModeEnabled) return true;
        // Check actual subscription
        return (
          (state.tier === 'monthly' || state.tier === 'annual') &&
          state.status === 'active'
        );
      },
      
      hasFeature: (feature: PremiumFeature) => {
        const state = get();
        // Dev mode override
        if (state.devModeEnabled) return true;
        // Check if current tier has the feature
        const featureConfig = PREMIUM_FEATURES[feature];
        return featureConfig.requiredTier.includes(state.tier) && state.status === 'active';
      },
      
      getPlan: () => {
        const state = get();
        return SUBSCRIPTION_PLANS[state.tier];
      },
      
      getDaysRemaining: () => {
        const state = get();
        if (!state.currentPeriodEnd) return null;
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
