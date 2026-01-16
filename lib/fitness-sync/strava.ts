// ============================================================
// Strava API Client
// https://developers.strava.com/docs/reference/
// Note: OAuth is handled server-side. This client is for data fetching.
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

// Strava activity type mapping
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  'Run': 'running',
  'Ride': 'cycling',
  'Swim': 'swimming',
  'Walk': 'walking',
  'Hike': 'hiking',
  'WeightTraining': 'strength',
  'Yoga': 'yoga',
  'Workout': 'cardio',
  'VirtualRide': 'cycling',
  'VirtualRun': 'running',
};

export class StravaClient extends BaseFitnessClient {
  private apiBaseUrl = 'https://www.strava.com/api/v3';

  constructor() {
    super('strava');
  }

  // ============================================================
  // Data Fetching Methods (used after OAuth is complete)
  // ============================================================

  async getSteps(tokens: FitnessTokens, startDate: string, endDate: string): Promise<StepData[]> {
    // Strava doesn't track steps directly, but we can estimate from walking/running activities
    const activities = await this.getActivities(tokens, startDate, endDate);
    const stepsByDate: Record<string, number> = {};

    for (const activity of activities) {
      if (activity.type === 'walking' || activity.type === 'running') {
        const date = activity.startTime.split('T')[0];
        // Estimate steps: ~1300 steps per km walking, ~1000 steps per km running
        const stepsPerKm = activity.type === 'walking' ? 1300 : 1000;
        const distance = activity.distance || 0;
        const estimatedSteps = Math.round((distance / 1000) * stepsPerKm);
        stepsByDate[date] = (stepsByDate[date] || 0) + estimatedSteps;
      }
    }

    return Object.entries(stepsByDate).map(([date, steps]) => ({
      date,
      steps,
      source: 'strava',
      syncedAt: new Date().toISOString(),
    }));
  }

  async getHeartRate(tokens: FitnessTokens, startDate: string, endDate: string): Promise<HeartRateData[]> {
    // Get heart rate data from activities
    const activities = await this.getActivities(tokens, startDate, endDate);
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
      source: 'strava',
      syncedAt: new Date().toISOString(),
    }));
  }

  async getActivities(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const after = Math.floor(new Date(startDate).getTime() / 1000);
    const before = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
    const activities: SyncedActivity[] = [];
    let page = 1;

    try {
      // Fetch up to 3 pages (150 activities) to avoid rate limits
      while (page <= 3) {
        const response = await fetch(
          `${this.apiBaseUrl}/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=50`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new FitnessSyncError('Token expired', 'strava', 'TOKEN_EXPIRED');
          }
          throw new FitnessSyncError(
            `Failed to fetch activities: ${response.statusText}`,
            'strava',
            'API_ERROR'
          );
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) break;

        for (const activity of data) {
          const activityType = ACTIVITY_TYPE_MAP[activity.sport_type] ||
                              ACTIVITY_TYPE_MAP[activity.type] ||
                              'other';

          activities.push({
            id: `strava_${activity.id}`,
            externalId: activity.id.toString(),
            source: 'strava',
            type: activityType,
            name: activity.name,
            startTime: activity.start_date,
            endTime: activity.start_date_local ? 
              new Date(new Date(activity.start_date).getTime() + (activity.elapsed_time * 1000)).toISOString() :
              undefined,
            duration: Math.round(activity.moving_time / 60),
            calories: activity.calories || this.estimateCalories(activity),
            distance: activity.distance,
            averageHeartRate: activity.average_heartrate,
            maxHeartRate: activity.max_heartrate,
            averageSpeed: activity.average_speed ? activity.average_speed * 3.6 : undefined, // m/s to km/h
            elevationGain: activity.total_elevation_gain,
            syncedAt: new Date().toISOString(),
            imported: false,
          });
        }

        if (data.length < 50) break;
        page++;
      }

      return activities;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch activities',
        'strava',
        'NETWORK_ERROR'
      );
    }
  }

  async getCalories(tokens: FitnessTokens, startDate: string, endDate: string): Promise<CaloriesData[]> {
    const activities = await this.getActivities(tokens, startDate, endDate);
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
      activeCalories: totalBurned,
      source: 'strava',
      syncedAt: new Date().toISOString(),
    }));
  }

  async getSleep(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SleepData[]> {
    // Strava doesn't track sleep
    return [];
  }

  private estimateCalories(activity: any): number {
    // Estimate calories based on activity type and duration
    const durationHours = (activity.moving_time || 0) / 3600;
    const metValues: Record<string, number> = {
      'Run': 9.8,
      'Ride': 7.5,
      'Swim': 8.0,
      'Walk': 3.5,
      'Hike': 6.0,
      'WeightTraining': 5.0,
      'Yoga': 2.5,
    };
    const met = metValues[activity.sport_type] || metValues[activity.type] || 5.0;
    // Assume 70kg body weight for estimation
    return Math.round(met * 70 * durationHours);
  }
}
