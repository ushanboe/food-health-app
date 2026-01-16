// ============================================================
// Fitbit API Client
// https://dev.fitbit.com/build/reference/web-api/
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

// Fitbit activity type mapping
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  'Walk': 'walking',
  'Run': 'running',
  'Bike': 'cycling',
  'Swim': 'swimming',
  'Hike': 'hiking',
  'Weights': 'strength',
  'Yoga': 'yoga',
  'Aerobic Workout': 'cardio',
  'Sport': 'sports',
};

export class FitbitClient extends BaseFitnessClient {
  private apiBaseUrl = 'https://api.fitbit.com/1/user/-';

  constructor() {
    super('fitbit');
  }

  // ============================================================
  // Data Fetching Methods (used after OAuth is complete)
  // ============================================================

  async getSteps(tokens: FitnessTokens, startDate: string, endDate: string): Promise<StepData[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/activities/steps/date/${startDate}/${endDate}.json`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new FitnessSyncError('Token expired', 'fitbit', 'TOKEN_EXPIRED');
        }
        throw new FitnessSyncError(
          `Failed to fetch steps: ${response.statusText}`,
          'fitbit',
          'API_ERROR'
        );
      }

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
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch steps',
        'fitbit',
        'NETWORK_ERROR'
      );
    }
  }

  async getHeartRate(tokens: FitnessTokens, startDate: string, endDate: string): Promise<HeartRateData[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/activities/heart/date/${startDate}/${endDate}.json`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new FitnessSyncError('Token expired', 'fitbit', 'TOKEN_EXPIRED');
        }
        throw new FitnessSyncError(
          `Failed to fetch heart rate: ${response.statusText}`,
          'fitbit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const heartRates: HeartRateData[] = [];

      for (const entry of data['activities-heart'] || []) {
        if (entry.value?.restingHeartRate) {
          heartRates.push({
            date: entry.dateTime,
            restingHr: entry.value.restingHeartRate,
            source: 'fitbit',
            syncedAt: new Date().toISOString(),
          });
        }
      }

      return heartRates;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch heart rate',
        'fitbit',
        'NETWORK_ERROR'
      );
    }
  }

  async getActivities(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const activities: SyncedActivity[] = [];
    const dates = this.getDateRange(startDate, endDate);

    // Fitbit requires fetching activities day by day
    // Limit to 7 days to avoid rate limits
    for (const date of dates.slice(0, 7)) {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/activities/date/${date}.json`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new FitnessSyncError('Token expired', 'fitbit', 'TOKEN_EXPIRED');
          }
          continue; // Skip this day on error
        }

        const data = await response.json();

        for (const activity of data.activities || []) {
          const activityType = ACTIVITY_TYPE_MAP[activity.name] || 'other';

          activities.push({
            id: `fitbit_${activity.logId}`,
            externalId: activity.logId.toString(),
            source: 'fitbit',
            type: activityType,
            name: activity.name,
            startTime: `${date}T${activity.startTime || '00:00:00'}`,
            duration: activity.duration ? Math.round(activity.duration / 60000) : 0,
            calories: activity.calories,
            distance: activity.distance ? activity.distance * 1000 : undefined, // Convert to meters
            steps: activity.steps,
            syncedAt: new Date().toISOString(),
            imported: false,
          });
        }
      } catch (error) {
        if (error instanceof FitnessSyncError && error.code === 'TOKEN_EXPIRED') {
          throw error;
        }
        // Continue with other days on error
        continue;
      }
    }

    return activities;
  }

  async getCalories(tokens: FitnessTokens, startDate: string, endDate: string): Promise<CaloriesData[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/activities/calories/date/${startDate}/${endDate}.json`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new FitnessSyncError('Token expired', 'fitbit', 'TOKEN_EXPIRED');
        }
        throw new FitnessSyncError(
          `Failed to fetch calories: ${response.statusText}`,
          'fitbit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const calories: CaloriesData[] = [];

      for (const entry of data['activities-calories'] || []) {
        const totalCalories = parseInt(entry.value);
        if (totalCalories > 0) {
          calories.push({
            date: entry.dateTime,
            totalBurned: totalCalories,
            activeCalories: totalCalories,
            source: 'fitbit',
            syncedAt: new Date().toISOString(),
          });
        }
      }

      return calories;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch calories',
        'fitbit',
        'NETWORK_ERROR'
      );
    }
  }

  async getSleep(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SleepData[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/sleep/date/${startDate}/${endDate}.json`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new FitnessSyncError('Token expired', 'fitbit', 'TOKEN_EXPIRED');
        }
        throw new FitnessSyncError(
          `Failed to fetch sleep: ${response.statusText}`,
          'fitbit',
          'API_ERROR'
        );
      }

      const data = await response.json();
      const sleepData: SleepData[] = [];

      for (const sleep of data.sleep || []) {
        sleepData.push({
          date: sleep.dateOfSleep,
          startTime: sleep.startTime,
          endTime: sleep.endTime,
          duration: sleep.duration ? Math.round(sleep.duration / 60000) : 0,
          efficiency: sleep.efficiency,
          source: 'fitbit',
          syncedAt: new Date().toISOString(),
        });
      }

      return sleepData;
    } catch (error) {
      if (error instanceof FitnessSyncError) throw error;
      throw new FitnessSyncError(
        error instanceof Error ? error.message : 'Failed to fetch sleep',
        'fitbit',
        'NETWORK_ERROR'
      );
    }
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
