// ============================================================
// Base Fitness Client
// Abstract base class for all fitness provider clients
// ============================================================

import {
  FitnessProvider,
  FitnessTokens,
  FitnessConnection,
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
  // Token Management
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

  async ensureValidToken(): Promise<void> {
    if (!this.tokens) {
      throw new FitnessSyncError(
        'Not authenticated',
        this.provider,
        'AUTH_REQUIRED'
      );
    }
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expiresAt > Date.now();
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    // Consider token expired 5 minutes before actual expiry
    return this.tokens.expiresAt < Date.now() + 5 * 60 * 1000;
  }

  // ============================================================
  // OAuth Flow Methods (to be implemented by subclasses)
  // ============================================================

  abstract getAuthUrl(redirectUri: string, state?: string): string;
  
  abstract exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<FitnessTokens>;
  
  abstract refreshAccessToken(): Promise<FitnessTokens>;

  // ============================================================
  // Data Fetching Methods (to be implemented by subclasses)
  // ============================================================

  abstract fetchSteps(startDate: string, endDate: string): Promise<StepData[]>;
  
  abstract fetchActivities(
    startDate: string,
    endDate: string
  ): Promise<SyncedActivity[]>;
  
  abstract fetchHeartRate(
    startDate: string,
    endDate: string
  ): Promise<HeartRateData[]>;
  
  abstract fetchCalories(
    startDate: string,
    endDate: string
  ): Promise<CaloriesData[]>;
  
  abstract fetchSleep(
    startDate: string,
    endDate: string
  ): Promise<SleepData[]>;

  // ============================================================
  // Unified Sync Method
  // ============================================================

  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    const now = new Date();
    const endDate = options.endDate || now.toISOString().split('T')[0];
    const startDate = options.startDate || 
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Check and refresh token if needed
      if (this.isTokenExpired()) {
        await this.refreshAccessToken();
      }

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
          result.data!.steps = await this.fetchSteps(startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch steps from ${this.provider}:`, e);
        }
      }

      if (features.some(f => ['workouts', 'running', 'cycling', 'swimming'].includes(f))) {
        try {
          result.data!.activities = await this.fetchActivities(startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch activities from ${this.provider}:`, e);
        }
      }

      if (features.includes('heart_rate')) {
        try {
          result.data!.heartRate = await this.fetchHeartRate(startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch heart rate from ${this.provider}:`, e);
        }
      }

      if (features.includes('calories')) {
        try {
          result.data!.calories = await this.fetchCalories(startDate, endDate);
        } catch (e) {
          console.warn(`Failed to fetch calories from ${this.provider}:`, e);
        }
      }

      if (features.includes('sleep')) {
        try {
          result.data!.sleep = await this.fetchSleep(startDate, endDate);
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
  // HTTP Helper Methods
  // ============================================================

  protected async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.tokens) {
      throw new FitnessSyncError(
        'Not authenticated',
        this.provider,
        'AUTH_REQUIRED'
      );
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (response.status === 401) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
        // Retry request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${this.tokens.accessToken}`,
          },
        });
      } catch {
        throw new FitnessSyncError(
          'Token refresh failed',
          this.provider,
          'TOKEN_REFRESH_FAILED'
        );
      }
    }

    if (response.status === 429) {
      throw new FitnessSyncError(
        'Rate limited',
        this.provider,
        'RATE_LIMITED'
      );
    }

    if (!response.ok) {
      throw new FitnessSyncError(
        `API error: ${response.status}`,
        this.provider,
        'API_ERROR'
      );
    }

    return response;
  }

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
