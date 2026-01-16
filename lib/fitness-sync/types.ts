// ============================================================
// Unified Fitness Sync Types
// Common types for all fitness platform integrations
// ============================================================

// Supported fitness providers
export type FitnessProvider = 'google_fit' | 'fitbit' | 'strava' | 'garmin';

// Provider configuration
export interface ProviderConfig {
  id: FitnessProvider;
  name: string;
  icon: string;
  color: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  features: FitnessFeature[];
}

// Features each provider supports
export type FitnessFeature = 
  | 'steps'
  | 'calories'
  | 'distance'
  | 'heart_rate'
  | 'sleep'
  | 'workouts'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'weight';

// OAuth tokens stored for each provider
export interface FitnessTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  scope?: string;
  tokenType?: string;
}

// Connection status for a provider
export interface FitnessConnection {
  provider: FitnessProvider;
  isConnected: boolean; // Renamed for component compatibility
  connected?: boolean; // Deprecated, use isConnected
  connectedAt: string; // ISO date string when connected
  lastSyncAt: string | null; // ISO date string of last sync
  syncEnabled: boolean;
  tokens?: FitnessTokens;
  syncError?: string;
  userId?: string; // Provider-specific user ID
  profile?: ProviderProfile;
}

// User profile from provider
export interface ProviderProfile {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
}

// ============================================================
// Unified Activity Data Types
// ============================================================

// Unified step data
export interface StepData {
  date: string; // YYYY-MM-DD
  steps: number;
  source: FitnessProvider;
  syncedAt: string;
}

// Unified heart rate data
export interface HeartRateData {
  date: string;
  restingHr?: number;
  averageHr?: number;
  maxHr?: number;
  minHr?: number;
  zones?: HeartRateZone[];
  source: FitnessProvider;
  syncedAt: string;
}

export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  minutes: number;
}

// Unified workout/activity data
export interface SyncedActivity {
  id: string;
  externalId: string; // ID from the source provider
  source: FitnessProvider;
  name: string;
  type: ActivityType;
  startTime: string; // ISO datetime
  endTime?: string;
  duration: number; // minutes
  calories?: number;
  distance?: number; // meters
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePace?: number; // min/km
  averageSpeed?: number; // km/h
  elevationGain?: number; // meters
  steps?: number;
  laps?: ActivityLap[];
  mapPolyline?: string; // Encoded polyline for map
  imported: boolean; // Whether user has imported this to their log
  syncedAt: string;
}

export type ActivityType = 
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'walking'
  | 'hiking'
  | 'workout'
  | 'strength'
  | 'yoga'
  | 'other';

export interface ActivityLap {
  lapIndex: number;
  startTime: string;
  duration: number;
  distance?: number;
  calories?: number;
  averageHeartRate?: number;
}

// Unified calories data
export interface CaloriesData {
  date: string;
  totalBurned: number;
  activeCalories: number;
  bmrCalories?: number;
  source: FitnessProvider;
  syncedAt: string;
}

// Unified sleep data
export interface SleepData {
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  stages?: SleepStage[];
  efficiency?: number; // percentage
  source: FitnessProvider;
  syncedAt: string;
}

export interface SleepStage {
  stage: 'awake' | 'light' | 'deep' | 'rem';
  startTime: string;
  duration: number; // minutes
}

// ============================================================
// Sync State and Results
// ============================================================

export interface SyncOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  features?: FitnessFeature[];
}

export interface SyncResult {
  provider: FitnessProvider;
  success: boolean;
  syncedAt: string;
  data?: {
    steps?: StepData[];
    activities?: SyncedActivity[];
    heartRate?: HeartRateData[];
    calories?: CaloriesData[];
    sleep?: SleepData[];
  };
  error?: string;
}

// Alias for backward compatibility
export type FitnessSyncResult = SyncResult;

// Aggregated data from all providers
// This type supports both raw sync data and component-friendly daily aggregates
export interface AggregatedFitnessData {
  date?: string;
  // Activities (always present)
  activities: SyncedActivity[] | FitnessActivity[];
  // Daily aggregates for components
  dailySteps?: DailySteps[];
  dailyCalories?: DailyCalories[];
  dailyHeartRate?: DailyHeartRate[];
  // Raw data arrays from sync (optional)
  steps?: StepData[];
  heartRate?: HeartRateData[];
  calories?: CaloriesData[];
  sleep?: SleepData[];
  // Metadata
  sources: FitnessProvider[];
  lastSyncAt?: string;
}

// ============================================================
// Fitness Sync Preferences
// ============================================================

export interface FitnessSyncPreferences {
  autoSync: boolean;
  syncOnAppLoad: boolean;
  syncInterval: number; // minutes, 0 = manual only
  preferredStepSource?: FitnessProvider;
  preferredCalorieSource?: FitnessProvider;
  mergeActivities: boolean; // Merge similar activities from different sources
  importActivitiesAutomatically: boolean;
}

export const DEFAULT_SYNC_PREFERENCES: FitnessSyncPreferences = {
  autoSync: true,
  syncOnAppLoad: true,
  syncInterval: 30,
  mergeActivities: true,
  importActivitiesAutomatically: false,
};

// ============================================================
// Provider Configurations
// ============================================================

export const PROVIDER_CONFIGS: Record<FitnessProvider, ProviderConfig> = {
  google_fit: {
    id: 'google_fit',
    name: 'Google Fit',
    icon: '🏃',
    color: '#4285F4',
    scopes: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',
    features: ['steps', 'calories', 'distance', 'heart_rate', 'sleep', 'workouts', 'weight'],
  },
  fitbit: {
    id: 'fitbit',
    name: 'Fitbit',
    icon: '⌚',
    color: '#00B0B9',
    scopes: [
      'activity',
      'heartrate',
      'sleep',
      'weight',
      'profile',
    ],
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com/1/user/-',
    features: ['steps', 'calories', 'distance', 'heart_rate', 'sleep', 'workouts', 'weight'],
  },
  strava: {
    id: 'strava',
    name: 'Strava',
    icon: '🚴',
    color: '#FC4C02',
    scopes: [
      'read',
      'activity:read',
      'activity:read_all',
    ],
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiBaseUrl: 'https://www.strava.com/api/v3',
    features: ['running', 'cycling', 'swimming', 'workouts', 'distance', 'heart_rate'],
  },
  garmin: {
    id: 'garmin',
    name: 'Garmin Connect',
    icon: '⌚',
    color: '#007CC3',
    scopes: [], // Garmin uses OAuth 1.0a
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    apiBaseUrl: 'https://apis.garmin.com',
    features: ['steps', 'calories', 'distance', 'heart_rate', 'sleep', 'workouts', 'running', 'cycling'],
  },
};


// ============================================================
// Type Aliases for Component Compatibility
// ============================================================

// Alias for backward compatibility
export type FitnessActivity = SyncedActivity;

// Daily aggregated data types used by components
export interface DailySteps {
  date: string;
  value: number;
  sources: FitnessProvider[];
}

export interface DailyCalories {
  date: string;
  value: number;
  sources: FitnessProvider[];
}

// Extended HeartRateData for components
export interface DailyHeartRate {
  date: string;
  average: number;
  min?: number;
  max?: number;
  sources: FitnessProvider[];
}

// ============================================================
// Error Types
// ============================================================

export class FitnessSyncError extends Error {
  constructor(
    message: string,
    public provider: FitnessProvider,
    public code: FitnessSyncErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'FitnessSyncError';
  }
}

export type FitnessSyncErrorCode =
  | 'AUTH_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REFRESH_FAILED'
  | 'API_ERROR'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN_PROVIDER'
  | 'AUTH_FAILED';
