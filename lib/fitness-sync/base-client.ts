// ============================================================
// Base Fitness Client
// Abstract base class for all fitness provider clients
// Note: OAuth is handled server-side. This client is for data fetching.
// ============================================================

import {
  FitnessProvider,
  FitnessTokens,
  SyncOptions,
  SyncResult,
  StepData,
  HeartRateData,
  SyncedActivity,
  CaloriesData,
  SleepData,
  FitnessSyncError,
  PROVIDER_CONFIGS,
} from './types';

export abstract class BaseFitnessClient {
  protected provider: FitnessProvider;
  protected tokens: FitnessTokens | null = null;

  constructor(provider: FitnessProvider) {
    this.provider = provider;
  }

  get config() {
    return PROVIDER_CONFIGS[this.provider];
  }

  // ============================================================
  // Token Management (tokens are set from server-side OAuth)
  // ============================================================

  setTokens(tokens: FitnessTokens): void {
    this.tokens = tokens;
  }

  getTokens(): FitnessTokens | null {
    return this.tokens;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  hasValidTokens(): boolean {
    return this.tokens !== null && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    // Consider token expired 5 minutes before actual expiry
    return this.tokens.expiresAt < Date.now() + 5 * 60 * 1000;
  }

  // ============================================================
  // Data Fetching Methods (to be implemented by subclasses)
  // These methods receive tokens as parameters since OAuth is server-side
  // ============================================================

  abstract getSteps(
    tokens: FitnessTokens,
    startDate: string,
    endDate: string
  ): Promise<StepData[]>;

  abstract getActivities(
    tokens: FitnessTokens,
    startDate: string,
    endDate: string
  ): Promise<SyncedActivity[]>;

  abstract getHeartRate(
    tokens: FitnessTokens,
    startDate: string,
    endDate: string
  ): Promise<HeartRateData[]>;

  abstract getCalories(
    tokens: FitnessTokens,
    startDate: string,
    endDate: string
  ): Promise<CaloriesData[]>;

  abstract getSleep(
    tokens: FitnessTokens,
    startDate: string,
    endDate: string
  ): Promise<SleepData[]>;

  // ============================================================
  // Unified Sync Method (uses tokens passed in)
  // ============================================================

  async sync(tokens: FitnessTokens, options: SyncOptions = {}): Promise<SyncResult> {
    const now = new Date();
    const endDate = options.endDate || now.toISOString().split('T')[0];
    const startDate = options.startDate ||
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const features = options.features || this.config.features;
      const result: SyncResult = {
        provider: this.provider,
        success: true,
        syncedAt: new Date().toISOString(),
        data: {},
      };

      // Fetch data based on requested features
      if (features.includes('steps')) {
        try {
          result.data!.steps = await this.getSteps(tokens, startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch steps from ${this.provider}:`, e);
        }
      }

      if (features.some(f => ['workouts', 'running', 'cycling', 'swimming'].includes(f))) {
        try {
          result.data!.activities = await this.getActivities(tokens, startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch activities from ${this.provider}:`, e);
        }
      }

      if (features.includes('heart_rate')) {
        try {
          result.data!.heartRate = await this.getHeartRate(tokens, startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch heart rate from ${this.provider}:`, e);
        }
      }

      if (features.includes('calories')) {
        try {
          result.data!.calories = await this.getCalories(tokens, startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch calories from ${this.provider}:`, e);
        }
      }

      if (features.includes('sleep')) {
        try {
          result.data!.sleep = await this.getSleep(tokens, startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch sleep from ${this.provider}:`, e);
        }
      }

      return result;
    } catch (error) {
      return {
        provider: this.provider,
        success: false,
        syncedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  protected getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
