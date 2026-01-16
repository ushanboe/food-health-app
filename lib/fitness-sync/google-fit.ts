// ============================================================
// Google Fit API Client
// https://developers.google.com/fit/rest
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
  private apiBaseUrl = 'https://www.googleapis.com/fitness/v1/users/me';

  constructor() {
    super('google_fit');
  }

  // ============================================================
  // Data Fetching Methods (used after OAuth is complete)
  // ============================================================

  async getSteps(tokens: FitnessTokens, startDate: string, endDate: string): Promise<StepData[]> {
    const startTimeMillis = new Date(startDate).setHours(0, 0, 0, 0);
    const endTimeMillis = new Date(endDate).setHours(23, 59, 59, 999);

    try {
      const response = await fetch(`${this.apiBaseUrl}/dataset:aggregate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString(),
        }),
      });

      if (!response.ok) {
        throw new FitnessSyncError(
          `Failed to fetch steps: ${response.statusText}`,
          'google_fit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const steps: StepData[] = [];

      for (const bucket of data.bucket || []) {
        const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
        let totalSteps = 0;

        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            for (const value of point.value || []) {
              if (value.intVal) {
                totalSteps += value.intVal;
              }
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
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch steps',
        'google_fit',
        'NETWORK_ERROR'
      );
    }
  }

  async getHeartRate(tokens: FitnessTokens, startDate: string, endDate: string): Promise<HeartRateData[]> {
    const startTimeMillis = new Date(startDate).setHours(0, 0, 0, 0);
    const endTimeMillis = new Date(endDate).setHours(23, 59, 59, 999);

    try {
      const response = await fetch(`${this.apiBaseUrl}/dataset:aggregate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm',
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString(),
        }),
      });

      if (!response.ok) {
        throw new FitnessSyncError(
          `Failed to fetch heart rate: ${response.statusText}`,
          'google_fit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const heartRates: HeartRateData[] = [];

      for (const bucket of data.bucket || []) {
        const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
        const readings: number[] = [];

        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            for (const value of point.value || []) {
              if (value.fpVal) {
                readings.push(value.fpVal);
              }
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
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch heart rate',
        'google_fit',
        'NETWORK_ERROR'
      );
    }
  }

  async getActivities(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SyncedActivity[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new FitnessSyncError(
          `Failed to fetch activities: ${response.statusText}`,
          'google_fit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const activities: SyncedActivity[] = [];

      for (const session of data.session || []) {
        const activityType = ACTIVITY_TYPE_MAP[session.activityType] || 'other';
        const startTime = new Date(parseInt(session.startTimeMillis));
        const endTime = new Date(parseInt(session.endTimeMillis));
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        activities.push({
          id: `gfit_${session.id}`,
          externalId: session.id,
          source: 'google_fit',
          type: activityType,
          name: session.name || this.getActivityName(activityType),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationMinutes,
          syncedAt: new Date().toISOString(),
          imported: false,
        });
      }

      return activities;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch activities',
        'google_fit',
        'NETWORK_ERROR'
      );
    }
  }

  async getCalories(tokens: FitnessTokens, startDate: string, endDate: string): Promise<CaloriesData[]> {
    const startTimeMillis = new Date(startDate).setHours(0, 0, 0, 0);
    const endTimeMillis = new Date(endDate).setHours(23, 59, 59, 999);

    try {
      const response = await fetch(`${this.apiBaseUrl}/dataset:aggregate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.calories.expended',
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString(),
        }),
      });

      if (!response.ok) {
        throw new FitnessSyncError(
          `Failed to fetch calories: ${response.statusText}`,
          'google_fit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const calories: CaloriesData[] = [];

      for (const bucket of data.bucket || []) {
        const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
        let totalCalories = 0;

        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            for (const value of point.value || []) {
              if (value.fpVal) {
                totalCalories += value.fpVal;
              }
            }
          }
        }

        if (totalCalories > 0) {
          calories.push({
            date,
            totalBurned: Math.round(totalCalories),
            activeCalories: Math.round(totalCalories),
            source: 'google_fit',
            syncedAt: new Date().toISOString(),
          });
        }
      }

      return calories;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch calories',
        'google_fit',
        'NETWORK_ERROR'
      );
    }
  }

  async getSleep(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SleepData[]> {
    // Google Fit sleep data requires different approach
    // For now, return empty array - can be implemented with sleep.read scope
    return [];
  }

  private getActivityName(type: ActivityType): string {
    const names: Record<ActivityType, string> = {
      walking: 'Walking',
      running: 'Running',
      cycling: 'Cycling',
      swimming: 'Swimming',
      hiking: 'Hiking',
      strength: 'Strength Training',
      yoga: 'Yoga',
      cardio: 'Cardio',
      sports: 'Sports',
      other: 'Workout',
      workout: 'Workout',
    };
    return names[type] || 'Workout';
  }
}
