// Fitness Sync Types - Placeholder
// Integrations coming soon

export type FitnessProvider = 'strava' | 'fitbit' | 'garmin' | 'google_fit';

export interface FitnessConnection {
  provider: FitnessProvider;
  connected: boolean;
  connectedAt?: string;
  expiresAt?: number;
  needsRefresh?: boolean;
}

export interface FitnessActivity {
  id: string;
  provider: FitnessProvider;
  name: string;
  type: string;
  date: string;
  startTime: string;
  duration: number;
  calories?: number;
  distance?: number;
}

export interface DailyFitnessStats {
  date: string;
  steps: number;
  calories: number;
  activeMinutes: number;
  distance?: number;
}

export interface AggregatedFitnessData {
  activities: FitnessActivity[];
  dailyStats: DailyFitnessStats[];
  lastSyncAt: string | null;
  providers: FitnessProvider[];
}
