// ============================================================
// Google Fit API Client
// https://developers.google.com/fit/rest
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
} from './types';

// Google Fit data source types
const DATA_SOURCES = {
  STEPS: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
  CALORIES: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
  HEART_RATE: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
  DISTANCE: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
  ACTIVITY: 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments',
};

// Google Fit activity type mapping
const ACTIVITY_TYPE_MAP: Record<number, ActivityType> = {
  7: 'walking',
  8: 'running',
  1: 'cycling',
  82: 'swimming',
  13: 'hiking',
  97: 'strength',
  100: 'yoga',
  0: 'other',
};

export class GoogleFitClient extends BaseFitnessClient {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId?: string, clientSecret?: string) {
    super('google_fit');
    this.clientId = clientId || process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.GOOGLE_FIT_CLIENT_SECRET || '';
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
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<FitnessTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new FitnessSyncError(
        `Failed to exchange code: ${error}`,
        'google_fit',
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
        'google_fit',
        'AUTH_REQUIRED'
      );
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        'Failed to refresh token',
        'google_fit',
        'TOKEN_REFRESH_FAILED'
      );
    }

    const data = await response.json();
    const tokens: FitnessTokens = {
      accessToken: data.access_token,
      refreshToken: this.tokens.refreshToken, // Keep existing refresh token
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

  private getTimeRange(startDate: string, endDate: string): { startTimeMillis: string; endTimeMillis: string } {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return {
      startTimeMillis: start.getTime().toString(),
      endTimeMillis: end.getTime().toString(),
    };
  }

  async fetchSteps(startDate: string, endDate: string): Promise<StepData[]> {
    const { startTimeMillis, endTimeMillis } = this.getTimeRange(startDate, endDate);
    
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/dataset:aggregate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: DATA_SOURCES.STEPS,
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    const steps: StepData[] = [];

    for (const bucket of data.bucket || []) {
      const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
      let totalSteps = 0;

      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          for (const value of point.value || []) {
            totalSteps += value.intVal || 0;
          }
        }
      }

      if (totalSteps > 0) {
        steps.push({
          date,
          steps: totalSteps,
          source: 'google_fit',
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return steps;
  }

  async fetchActivities(startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const { startTimeMillis, endTimeMillis } = this.getTimeRange(startDate, endDate);
    
    // Fetch activity sessions
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}`
    );

    const data = await response.json();
    const activities: SyncedActivity[] = [];

    for (const session of data.session || []) {
      const startTime = new Date(parseInt(session.startTimeMillis));
      const endTime = new Date(parseInt(session.endTimeMillis));
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const activityType = ACTIVITY_TYPE_MAP[session.activityType] || 'other';

      activities.push({
        id: `gfit_${session.id}`,
        externalId: session.id,
        source: 'google_fit',
        name: session.name || this.getActivityName(session.activityType),
        type: activityType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        calories: session.activeTimeMillis ? Math.round(duration * 5) : undefined, // Estimate
        imported: false,
        syncedAt: new Date().toISOString(),
      });
    }

    return activities;
  }

  async fetchHeartRate(startDate: string, endDate: string): Promise<HeartRateData[]> {
    const { startTimeMillis, endTimeMillis } = this.getTimeRange(startDate, endDate);
    
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/dataset:aggregate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm',
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    const heartRates: HeartRateData[] = [];

    for (const bucket of data.bucket || []) {
      const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
      const readings: number[] = [];

      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          for (const value of point.value || []) {
            if (value.fpVal) readings.push(value.fpVal);
          }
        }
      }

      if (readings.length > 0) {
        heartRates.push({
          date,
          averageHr: Math.round(readings.reduce((a, b) => a + b, 0) / readings.length),
          maxHr: Math.max(...readings),
          minHr: Math.min(...readings),
          source: 'google_fit',
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return heartRates;
  }

  async fetchCalories(startDate: string, endDate: string): Promise<CaloriesData[]> {
    const { startTimeMillis, endTimeMillis } = this.getTimeRange(startDate, endDate);
    
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/dataset:aggregate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.calories.expended',
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    const calories: CaloriesData[] = [];

    for (const bucket of data.bucket || []) {
      const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
      let totalCalories = 0;

      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          for (const value of point.value || []) {
            totalCalories += value.fpVal || 0;
          }
        }
      }

      if (totalCalories > 0) {
        calories.push({
          date,
          totalBurned: Math.round(totalCalories),
          activeCalories: Math.round(totalCalories * 0.3), // Estimate active portion
          source: 'google_fit',
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return calories;
  }

  async fetchSleep(startDate: string, endDate: string): Promise<SleepData[]> {
    // Google Fit sleep data requires specific data source
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}&activityType=72`
    );

    const data = await response.json();
    const sleepData: SleepData[] = [];

    for (const session of data.session || []) {
      const startTime = new Date(parseInt(session.startTimeMillis));
      const endTime = new Date(parseInt(session.endTimeMillis));
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      sleepData.push({
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        source: 'google_fit',
        syncedAt: new Date().toISOString(),
      });
    }

    return sleepData;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private getActivityName(activityType: number): string {
    const names: Record<number, string> = {
      7: 'Walking',
      8: 'Running',
      1: 'Cycling',
      82: 'Swimming',
      13: 'Hiking',
      97: 'Strength Training',
      100: 'Yoga',
      0: 'Unknown Activity',
    };
    return names[activityType] || 'Activity';
  }
}
