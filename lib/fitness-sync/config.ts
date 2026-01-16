// ============================================================
// Fitness Provider Configuration
// OAuth endpoints and settings for each fitness provider
// ============================================================

import { FitnessProvider } from './types';

export interface ProviderConfig {
  name: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  scopes: string[];
}

/**
 * Configuration for each fitness provider
 * Client IDs are loaded from environment variables
 */
export const PROVIDER_CONFIGS: Record<FitnessProvider, ProviderConfig> = {
  google_fit: {
    name: 'Google Fit',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',
    scopes: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.location.read',
    ],
  },
  fitbit: {
    name: 'Fitbit',
    clientId: process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID || '',
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com/1/user/-',
    scopes: [
      'activity',
      'heartrate',
      'profile',
      'sleep',
    ],
  },
  strava: {
    name: 'Strava',
    clientId: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '',
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiBaseUrl: 'https://www.strava.com/api/v3',
    scopes: [
      'read',
      'activity:read',
    ],
  },
  garmin: {
    name: 'Garmin Connect',
    clientId: process.env.NEXT_PUBLIC_GARMIN_CLIENT_ID || '',
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    apiBaseUrl: 'https://apis.garmin.com',
    scopes: [],
  },
};

/**
 * Check if a provider is configured (has client ID)
 */
export function isProviderConfigured(provider: FitnessProvider): boolean {
  return !!PROVIDER_CONFIGS[provider].clientId;
}

/**
 * Get all configured providers
 */
export function getConfiguredProviders(): FitnessProvider[] {
  return (Object.keys(PROVIDER_CONFIGS) as FitnessProvider[]).filter(isProviderConfigured);
}
