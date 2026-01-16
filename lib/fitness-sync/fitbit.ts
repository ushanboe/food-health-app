// ============================================================
// Fitbit API Client
// https://dev.fitbit.com/build/reference/web-api/
// ============================================================

import { BaseFitnessClient } from './base-client';
import {
  FitnessTokens,
  StepData,
  HeartRateData,
  SyncedActivity,
  CaloriesData,
  SleepData,
  ActivityType,
  FitnessSyncError,
  HeartRateZone,
  SleepStage,
} from './types';

// Fitbit activity type mapping
const FITBIT_ACTIVITY_MAP: Record<string, ActivityType> = {
  'Walk': 'walking',
  'Run': 'running',
  'Bike': 'cycling',
  'Swim': 'swimming',
  'Hike': 'hiking',
  'Weights': 'strength',
  'Yoga': 'yoga',
  'Workout': 'workout',
  'Sport': 'other',
};

export class FitbitClient extends BaseFitnessClient {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId?: string, clientSecret?: string) {
    super('fitbit');
    this.clientId = clientId || process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.FITBIT_CLIENT_SECRET || '';
  }

  // ============================================================
  // OAuth Methods
  // ============================================================

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      ...(state && { state }),
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<FitnessTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new FitnessSyncError(
        `Failed to exchange code: ${error}`,
        'fitbit',
        'API_ERROR'
      );
    }

    const data = await response.json();
    const tokens: FitnessTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
      tokenType: data.token_type,
    };

    this.setTokens(tokens);
    return tokens;
  }

  async refreshAccessToken(): Promise<FitnessTokens> {
    if (!this.tokens?.refreshToken) {
      throw new FitnessSyncError(
        'No refresh token available',
        'fitbit',
        'AUTH_REQUIRED'
      );
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        'Failed to refresh token',
        'fitbit',
        'TOKEN_REFRESH_FAILED'
      );
    }

    const data = await response.json();
    const tokens: FitnessTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
      tokenType: data.token_type,
    };

    this.setTokens(tokens);
    return tokens;
  }

  // ============================================================
  // Data Fetching Methods
  // ============================================================

  async fetchSteps(startDate: string, endDate: string): Promise<StepData[]> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/activities/steps/date/${startDate}/${endDate}.json`
    );

    const data = await response.json();
    const steps: StepData[] = [];

    for (const entry of data['activities-steps'] || []) {
      const stepCount = parseInt(entry.value);
      if (stepCount > 0) {
        steps.push({
          date: entry.dateTime,
          steps: stepCount,
          source: 'fitbit',
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return steps;
  }

  async fetchActivities(startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const activities: SyncedActivity[] = [];
    const dates = this.getDateRange(startDate, endDate);

    // Fitbit requires fetching activities day by day
    for (const date of dates) {
      try {
        const response = await this.fetchWithAuth(
          `${this.config.apiBaseUrl}/activities/date/${date}.json`
        );

        const data = await response.json();

        for (const activity of data.activities || []) {
          const activityType = this.mapActivityType(activity.name);
          
          activities.push({
            id: `fitbit_${activity.logId}`,
            externalId: activity.logId.toString(),
            source: 'fitbit',
            name: activity.name,
            type: activityType,
            startTime: `${date}T${activity.startTime || '00:00:00'}`,
            duration: activity.duration ? Math.round(activity.duration / 60000) : 0,
            calories: activity.calories,
            distance: activity.distance ? activity.distance * 1000 : undefined, // Convert km to m
            averageHeartRate: activity.averageHeartRate,
            steps: activity.steps,
            imported: false,
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch Fitbit activities for ${date}:`, error);
      }
    }

    return activities;
  }

  async fetchHeartRate(startDate: string, endDate: string): Promise<HeartRateData[]> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/activities/heart/date/${startDate}/${endDate}.json`
    );

    const data = await response.json();
    const heartRates: HeartRateData[] = [];

    for (const entry of data['activities-heart'] || []) {
      const value = entry.value;
      if (!value) continue;

      const zones: HeartRateZone[] = (value.heartRateZones || []).map((zone: any) => ({
        name: zone.name,
        min: zone.min,
        max: zone.max,
        minutes: zone.minutes || 0,
      }));

      heartRates.push({
        date: entry.dateTime,
        restingHr: value.restingHeartRate,
        zones,
        source: 'fitbit',
        syncedAt: new Date().toISOString(),
      });
    }

    return heartRates;
  }

  async fetchCalories(startDate: string, endDate: string): Promise<CaloriesData[]> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/activities/calories/date/${startDate}/${endDate}.json`
    );

    const data = await response.json();
    const calories: CaloriesData[] = [];

    for (const entry of data['activities-calories'] || []) {
      const totalBurned = parseInt(entry.value);
      if (totalBurned > 0) {
        calories.push({
          date: entry.dateTime,
          totalBurned,
          activeCalories: Math.round(totalBurned * 0.3), // Estimate
          source: 'fitbit',
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return calories;
  }

  async fetchSleep(startDate: string, endDate: string): Promise<SleepData[]> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/sleep/date/${startDate}/${endDate}.json`
    );

    const data = await response.json();
    const sleepData: SleepData[] = [];

    for (const sleep of data.sleep || []) {
      const stages: SleepStage[] = [];
      
      if (sleep.levels?.data) {
        for (const level of sleep.levels.data) {
          const stageMap: Record<string, SleepStage['stage']> = {
            'wake': 'awake',
            'light': 'light',
            'deep': 'deep',
            'rem': 'rem',
          };
          
          if (stageMap[level.level]) {
            stages.push({
              stage: stageMap[level.level],
              startTime: level.dateTime,
              duration: Math.round(level.seconds / 60),
            });
          }
        }
      }

      sleepData.push({
        date: sleep.dateOfSleep,
        startTime: sleep.startTime,
        endTime: sleep.endTime,
        duration: sleep.duration ? Math.round(sleep.duration / 60000) : 0,
        stages,
        efficiency: sleep.efficiency,
        source: 'fitbit',
        syncedAt: new Date().toISOString(),
      });
    }

    return sleepData;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private mapActivityType(name: string): ActivityType {
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('walk')) return 'walking';
    if (normalizedName.includes('run') || normalizedName.includes('jog')) return 'running';
    if (normalizedName.includes('bike') || normalizedName.includes('cycl')) return 'cycling';
    if (normalizedName.includes('swim')) return 'swimming';
    if (normalizedName.includes('hike')) return 'hiking';
    if (normalizedName.includes('weight') || normalizedName.includes('strength')) return 'strength';
    if (normalizedName.includes('yoga')) return 'yoga';
    
    return 'workout';
  }

  // Get user profile
  async getProfile(): Promise<{ id: string; displayName: string; avatar?: string }> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/profile.json`
    );

    const data = await response.json();
    const user = data.user;

    return {
      id: user.encodedId,
      displayName: user.displayName,
      avatar: user.avatar,
    };
  }
}
