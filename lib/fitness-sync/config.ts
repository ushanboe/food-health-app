// ============================================================
// Fitness Provider Configuration
// Public configuration for fitness providers (no secrets!)
// ============================================================

import { FitnessProvider } from './types';

export interface ProviderConfig {
  name: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
  bgColor: string;
  // Note: OAuth URLs and credentials are handled server-side only
  // This config is safe to expose to the client
}

/**
 * Public configuration for each fitness provider
 * No secrets or OAuth URLs - those are server-side only
 */
export const PROVIDER_CONFIGS: Record<FitnessProvider, ProviderConfig> = {
  google_fit: {
    name: 'Google Fit',
    description: 'Sync steps, workouts & calories',
    features: ['Steps', 'Workouts', 'Calories', 'Heart Rate'],
    icon: '🏃',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  fitbit: {
    name: 'Fitbit',
    description: 'Sync activities & health metrics',
    features: ['Steps', 'Activities', 'Heart Rate', 'Sleep'],
    icon: '⌚',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  strava: {
    name: 'Strava',
    description: 'Sync running, cycling & swimming',
    features: ['Running', 'Cycling', 'Swimming', 'Workouts'],
    icon: '🚴',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  garmin: {
    name: 'Garmin Connect',
    description: 'Sync activities & health data',
    features: ['Steps', 'Activities', 'Heart Rate', 'Sleep'],
    icon: '⌚',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
};

/**
 * All supported providers
 */
export const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

/**
 * Get provider display name
 */
export function getProviderName(provider: FitnessProvider): string {
  return PROVIDER_CONFIGS[provider]?.name || provider;
}

/**
 * Get provider config
 */
export function getProviderConfig(provider: FitnessProvider): ProviderConfig | undefined {
  return PROVIDER_CONFIGS[provider];
}
