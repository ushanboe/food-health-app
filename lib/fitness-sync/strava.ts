// ============================================================
// Strava API Client
// https://developers.strava.com/docs/reference/
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
  ActivityLap,
} from './types';

// Strava sport type mapping
const STRAVA_SPORT_MAP: Record<string, ActivityType> = {
  'Run': 'running',
  'Ride': 'cycling',
  'Swim': 'swimming',
  'Walk': 'walking',
  'Hike': 'hiking',
  'WeightTraining': 'strength',
  'Yoga': 'yoga',
  'Workout': 'workout',
  'VirtualRide': 'cycling',
  'VirtualRun': 'running',
  'TrailRun': 'running',
  'MountainBikeRide': 'cycling',
  'GravelRide': 'cycling',
  'EBikeRide': 'cycling',
};

export class StravaClient extends BaseFitnessClient {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId?: string, clientSecret?: string) {
    super('strava');
    this.clientId = clientId || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.STRAVA_CLIENT_SECRET || '';
  }

  // ============================================================
  // OAuth Methods
  // ============================================================

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(','),
      approval_prompt: 'auto',
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new FitnessSyncError(
        `Failed to exchange code: ${error}`,
        'strava',
        'API_ERROR'
      );
    }

    const data = await response.json();
    const tokens: FitnessTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000, // Strava returns seconds
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
        'strava',
        'AUTH_REQUIRED'
      );
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        'Failed to refresh token',
        'strava',
        'TOKEN_REFRESH_FAILED'
      );
    }

    const data = await response.json();
    const tokens: FitnessTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000,
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
    // Strava doesn't track steps directly, but we can estimate from walking/running activities
    const activities = await this.fetchActivities(startDate, endDate);
    const stepsByDate: Record<string, number> = {};

    for (const activity of activities) {
      if (activity.type === 'walking' || activity.type === 'running') {
        const date = activity.startTime.split('T')[0];
        // Estimate steps: ~1300 steps per km for walking, ~1000 for running
        const stepsPerKm = activity.type === 'walking' ? 1300 : 1000;
        const estimatedSteps = Math.round((activity.distance || 0) / 1000 * stepsPerKm);
        stepsByDate[date] = (stepsByDate[date] || 0) + estimatedSteps;
      }
    }

    return Object.entries(stepsByDate).map(([date, steps]) => ({
      date,
      steps,
      source: 'strava' as const,
      syncedAt: new Date().toISOString(),
    }));
  }

  async fetchActivities(startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const after = Math.floor(new Date(startDate).getTime() / 1000);
    const before = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

    const activities: SyncedActivity[] = [];
    let page = 1;
    const perPage = 50;

    while (true) {
      const response = await this.fetchWithAuth(
        `${this.config.apiBaseUrl}/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=${perPage}`
      );

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) break;

      for (const activity of data) {
        const activityType = STRAVA_SPORT_MAP[activity.sport_type] || 
                            STRAVA_SPORT_MAP[activity.type] || 
                            'other';

        activities.push({
          id: `strava_${activity.id}`,
          externalId: activity.id.toString(),
          source: 'strava',
          name: activity.name,
          type: activityType,
          startTime: activity.start_date,
          endTime: this.calculateEndTime(activity.start_date, activity.elapsed_time),
          duration: Math.round(activity.moving_time / 60),
          calories: activity.calories || this.estimateCalories(activity),
          distance: activity.distance, // Already in meters
          averageHeartRate: activity.average_heartrate,
          maxHeartRate: activity.max_heartrate,
          averageSpeed: activity.average_speed ? activity.average_speed * 3.6 : undefined, // m/s to km/h
          averagePace: activity.average_speed ? 16.6667 / activity.average_speed : undefined, // min/km
          elevationGain: activity.total_elevation_gain,
          mapPolyline: activity.map?.summary_polyline,
          imported: false,
          syncedAt: new Date().toISOString(),
        });
      }

      if (data.length < perPage) break;
      page++;
    }

    return activities;
  }

  async fetchActivityDetails(activityId: string): Promise<SyncedActivity | null> {
    try {
      const response = await this.fetchWithAuth(
        `${this.config.apiBaseUrl}/activities/${activityId}`
      );

      const activity = await response.json();
      const activityType = STRAVA_SPORT_MAP[activity.sport_type] || 'other';

      // Fetch laps if available
      let laps: ActivityLap[] = [];
      try {
        const lapsResponse = await this.fetchWithAuth(
          `${this.config.apiBaseUrl}/activities/${activityId}/laps`
        );
        const lapsData = await lapsResponse.json();
        
        laps = lapsData.map((lap: any, index: number) => ({
          lapIndex: index + 1,
          startTime: lap.start_date,
          duration: Math.round(lap.moving_time / 60),
          distance: lap.distance,
          calories: lap.calories,
          averageHeartRate: lap.average_heartrate,
        }));
      } catch {
        // Laps not available
      }

      return {
        id: `strava_${activity.id}`,
        externalId: activity.id.toString(),
        source: 'strava',
        name: activity.name,
        type: activityType,
        startTime: activity.start_date,
        endTime: this.calculateEndTime(activity.start_date, activity.elapsed_time),
        duration: Math.round(activity.moving_time / 60),
        calories: activity.calories || this.estimateCalories(activity),
        distance: activity.distance,
        averageHeartRate: activity.average_heartrate,
        maxHeartRate: activity.max_heartrate,
        averageSpeed: activity.average_speed ? activity.average_speed * 3.6 : undefined,
        averagePace: activity.average_speed ? 16.6667 / activity.average_speed : undefined,
        elevationGain: activity.total_elevation_gain,
        mapPolyline: activity.map?.polyline || activity.map?.summary_polyline,
        laps,
        imported: false,
        syncedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async fetchHeartRate(startDate: string, endDate: string): Promise<HeartRateData[]> {
    // Strava doesn't provide daily heart rate summaries
    // We can extract from activities
    const activities = await this.fetchActivities(startDate, endDate);
    const hrByDate: Record<string, { readings: number[]; max: number }> = {};

    for (const activity of activities) {
      if (activity.averageHeartRate) {
        const date = activity.startTime.split('T')[0];
        if (!hrByDate[date]) {
          hrByDate[date] = { readings: [], max: 0 };
        }
        hrByDate[date].readings.push(activity.averageHeartRate);
        if (activity.maxHeartRate && activity.maxHeartRate > hrByDate[date].max) {
          hrByDate[date].max = activity.maxHeartRate;
        }
      }
    }

    return Object.entries(hrByDate).map(([date, data]) => ({
      date,
      averageHr: Math.round(data.readings.reduce((a, b) => a + b, 0) / data.readings.length),
      maxHr: data.max || undefined,
      source: 'strava' as const,
      syncedAt: new Date().toISOString(),
    }));
  }

  async fetchCalories(startDate: string, endDate: string): Promise<CaloriesData[]> {
    // Aggregate calories from activities
    const activities = await this.fetchActivities(startDate, endDate);
    const caloriesByDate: Record<string, number> = {};

    for (const activity of activities) {
      if (activity.calories) {
        const date = activity.startTime.split('T')[0];
        caloriesByDate[date] = (caloriesByDate[date] || 0) + activity.calories;
      }
    }

    return Object.entries(caloriesByDate).map(([date, totalBurned]) => ({
      date,
      totalBurned,
      activeCalories: totalBurned, // All Strava calories are active
      source: 'strava' as const,
      syncedAt: new Date().toISOString(),
    }));
  }

  async fetchSleep(startDate: string, endDate: string): Promise<SleepData[]> {
    // Strava doesn't track sleep
    return [];
  }

  // ============================================================
  // Athlete Profile
  // ============================================================

  async getAthlete(): Promise<{ id: number; firstname: string; lastname: string; profile: string }> {
    const response = await this.fetchWithAuth(
      `${this.config.apiBaseUrl}/athlete`
    );

    return response.json();
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private calculateEndTime(startTime: string, elapsedSeconds: number): string {
    const start = new Date(startTime);
    return new Date(start.getTime() + elapsedSeconds * 1000).toISOString();
  }

  private estimateCalories(activity: any): number {
    // Rough estimation based on activity type and duration
    const durationHours = (activity.moving_time || 0) / 3600;
    const metValues: Record<string, number> = {
      'Run': 9.8,
      'Ride': 7.5,
      'Swim': 8.0,
      'Walk': 3.5,
      'Hike': 6.0,
      'WeightTraining': 6.0,
      'Yoga': 3.0,
    };
    const met = metValues[activity.sport_type] || metValues[activity.type] || 5.0;
    // Assume 70kg body weight for estimation
    return Math.round(met * 70 * durationHours);
  }
}
