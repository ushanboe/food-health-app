// Fitness Sync - Coming Soon
// All integrations temporarily disabled

export * from './types';

// Placeholder exports
export const FITNESS_PROVIDERS = ['strava', 'fitbit', 'garmin', 'google_fit'] as const;

export function useFitnessSync() {
  return {
    isLoading: false,
    connections: [],
    activities: [],
    sync: async () => {},
    connect: async () => {},
    disconnect: async () => {},
  };
}
