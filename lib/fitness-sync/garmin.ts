// ============================================================
// Garmin Connect API Client
// https://developer.garmin.com/gc-developer-program/
// Note: OAuth is handled server-side. This client is for data fetching.
// Note: Garmin uses OAuth 1.0a which is more complex than OAuth 2.0
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

// Garmin activity type mapping
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  'running': 'running',
  'cycling': 'cycling',
  'swimming': 'swimming',
  'walking': 'walking',
  'hiking': 'hiking',
  'strength_training': 'strength',
  'yoga': 'yoga',
  'cardio': 'cardio',
};

export class GarminClient extends BaseFitnessClient {
  private apiBaseUrl = 'https://apis.garmin.com';

  constructor() {
    super('garmin');
  }

  // ============================================================
  // Data Fetching Methods
  // Note: Garmin API requires OAuth 1.0a signed requests
  // These methods are placeholders - actual implementation requires
  // server-side OAuth 1.0a signature generation
  // ============================================================

  async getSteps(tokens: FitnessTokens, startDate: string, endDate: string): Promise<StepData[]> {
    // Garmin requires OAuth 1.0a signed requests
    // This should be called from server-side with proper signing
    console.warn('Garmin API requires OAuth 1.0a - use server-side sync endpoint');
    return [];
  }

  async getHeartRate(tokens: FitnessTokens, startDate: string, endDate: string): Promise<HeartRateData[]> {
    console.warn('Garmin API requires OAuth 1.0a - use server-side sync endpoint');
    return [];
  }

  async getActivities(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SyncedActivity[]> {
    console.warn('Garmin API requires OAuth 1.0a - use server-side sync endpoint');
    return [];
  }

  async getCalories(tokens: FitnessTokens, startDate: string, endDate: string): Promise<CaloriesData[]> {
    console.warn('Garmin API requires OAuth 1.0a - use server-side sync endpoint');
    return [];
  }

  async getSleep(tokens: FitnessTokens, startDate: string, endDate: string): Promise<SleepData[]> {
    console.warn('Garmin API requires OAuth 1.0a - use server-side sync endpoint');
    return [];
  }

  // ============================================================
  // Server-side helper methods
  // These would be used by the API routes with proper OAuth 1.0a signing
  // ============================================================

  static getActivityType(garminType: string): ActivityType {
    return ACTIVITY_TYPE_MAP[garminType.toLowerCase()] || 'other';
  }

  static parseActivity(data: any): Partial<SyncedActivity> {
    return {
      externalId: data.activityId?.toString(),
      source: 'garmin',
      type: GarminClient.getActivityType(data.activityType || ''),
      name: data.activityName,
      startTime: data.startTimeGMT,
      duration: data.duration ? Math.round(data.duration / 60) : undefined,
      calories: data.calories,
      distance: data.distance,
      averageHeartRate: data.averageHR,
      maxHeartRate: data.maxHR,
      steps: data.steps,
      syncedAt: new Date().toISOString(),
    };
  }

  static parseSteps(data: any): Partial<StepData> {
    return {
      date: data.calendarDate,
      steps: data.totalSteps,
      source: 'garmin',
      syncedAt: new Date().toISOString(),
    };
  }

  static parseHeartRate(data: any): Partial<HeartRateData> {
    return {
      date: data.calendarDate,
      restingHr: data.restingHeartRate,
      maxHr: data.maxHeartRate,
      minHr: data.minHeartRate,
      source: 'garmin',
      syncedAt: new Date().toISOString(),
    };
  }

  static parseSleep(data: any): Partial<SleepData> {
    return {
      date: data.calendarDate,
      startTime: data.sleepStartTimestampGMT,
      endTime: data.sleepEndTimestampGMT,
      duration: data.sleepTimeSeconds ? Math.round(data.sleepTimeSeconds / 60) : 0,
      source: 'garmin',
      syncedAt: new Date().toISOString(),
    };
  }
}
