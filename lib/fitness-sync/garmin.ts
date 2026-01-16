// ============================================================
// Garmin Connect API Client
// https://developer.garmin.com/gc-developer-program/
// Note: Garmin uses OAuth 1.0a which is more complex
// This implementation provides the structure for Garmin integration
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
  SleepStage,
} from './types';

// Garmin activity type mapping
const GARMIN_ACTIVITY_MAP: Record<string, ActivityType> = {
  'running': 'running',
  'cycling': 'cycling',
  'swimming': 'swimming',
  'walking': 'walking',
  'hiking': 'hiking',
  'strength_training': 'strength',
  'yoga': 'yoga',
  'fitness_equipment': 'workout',
  'other': 'other',
};

export class GarminClient extends BaseFitnessClient {
  private consumerKey: string;
  private consumerSecret: string;
  private oauthToken: string | null = null;
  private oauthTokenSecret: string | null = null;

  constructor(consumerKey?: string, consumerSecret?: string) {
    super('garmin');
    this.consumerKey = consumerKey || process.env.NEXT_PUBLIC_GARMIN_CONSUMER_KEY || '';
    this.consumerSecret = consumerSecret || process.env.GARMIN_CONSUMER_SECRET || '';
  }

  // ============================================================
  // OAuth 1.0a Methods
  // Garmin uses OAuth 1.0a which requires request token flow
  // ============================================================

  getAuthUrl(redirectUri: string, state?: string): string {
    // For OAuth 1.0a, we need to first get a request token
    // This is a simplified version - in production, you'd need to:
    // 1. Get request token from Garmin
    // 2. Redirect user to authorize
    // 3. Exchange for access token
    const params = new URLSearchParams({
      oauth_callback: redirectUri,
      ...(state && { state }),
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async getRequestToken(callbackUrl: string): Promise<{ token: string; tokenSecret: string }> {
    // OAuth 1.0a request token endpoint
    const requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
    
    const oauthParams = this.generateOAuthParams();
    oauthParams.oauth_callback = callbackUrl;
    
    const signature = this.generateSignature('POST', requestTokenUrl, oauthParams, '');
    oauthParams.oauth_signature = signature;

    const response = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.buildAuthHeader(oauthParams),
      },
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        'Failed to get request token',
        'garmin',
        'API_ERROR'
      );
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    
    return {
      token: params.get('oauth_token') || '',
      tokenSecret: params.get('oauth_token_secret') || '',
    };
  }

  async exchangeCodeForTokens(
    oauthToken: string,
    oauthVerifier: string,
    tokenSecret?: string
  ): Promise<FitnessTokens> {
    const accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
    
    const oauthParams = this.generateOAuthParams();
    oauthParams.oauth_token = oauthToken;
    oauthParams.oauth_verifier = oauthVerifier;
    
    const signature = this.generateSignature('POST', accessTokenUrl, oauthParams, tokenSecret || '');
    oauthParams.oauth_signature = signature;

    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.buildAuthHeader(oauthParams),
      },
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        'Failed to exchange token',
        'garmin',
        'API_ERROR'
      );
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    
    this.oauthToken = params.get('oauth_token') || '';
    this.oauthTokenSecret = params.get('oauth_token_secret') || '';

    const tokens: FitnessTokens = {
      accessToken: this.oauthToken,
      refreshToken: this.oauthTokenSecret, // Store token secret as refresh token
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // OAuth 1.0a tokens don't expire
    };

    this.setTokens(tokens);
    return tokens;
  }

  async refreshAccessToken(): Promise<FitnessTokens> {
    // OAuth 1.0a tokens don't expire, so just return existing tokens
    if (!this.tokens) {
      throw new FitnessSyncError(
        'No tokens available',
        'garmin',
        'AUTH_REQUIRED'
      );
    }
    return this.tokens;
  }

  // ============================================================
  // Data Fetching Methods
  // ============================================================

  async fetchSteps(startDate: string, endDate: string): Promise<StepData[]> {
    const steps: StepData[] = [];
    const dates = this.getDateRange(startDate, endDate);

    for (const date of dates) {
      try {
        const response = await this.fetchWithOAuth(
          `${this.config.apiBaseUrl}/wellness-api/rest/dailies/${date}`
        );

        const data = await response.json();
        
        if (data.totalSteps) {
          steps.push({
            date,
            steps: data.totalSteps,
            source: 'garmin',
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch Garmin steps for ${date}:`, error);
      }
    }

    return steps;
  }

  async fetchActivities(startDate: string, endDate: string): Promise<SyncedActivity[]> {
    const response = await this.fetchWithOAuth(
      `${this.config.apiBaseUrl}/activitylist-service/activities/search/activities?startDate=${startDate}&endDate=${endDate}`
    );

    const data = await response.json();
    const activities: SyncedActivity[] = [];

    for (const activity of data || []) {
      const activityType = this.mapActivityType(activity.activityType?.typeKey);
      const startTime = new Date(activity.startTimeLocal || activity.startTimeGMT);
      const duration = Math.round((activity.duration || 0) / 60);

      activities.push({
        id: `garmin_${activity.activityId}`,
        externalId: activity.activityId.toString(),
        source: 'garmin',
        name: activity.activityName || activity.activityType?.typeKey || 'Activity',
        type: activityType,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + (activity.duration || 0) * 1000).toISOString(),
        duration,
        calories: activity.calories,
        distance: activity.distance, // Already in meters
        averageHeartRate: activity.averageHR,
        maxHeartRate: activity.maxHR,
        averageSpeed: activity.averageSpeed ? activity.averageSpeed * 3.6 : undefined, // m/s to km/h
        elevationGain: activity.elevationGain,
        steps: activity.steps,
        imported: false,
        syncedAt: new Date().toISOString(),
      });
    }

    return activities;
  }

  async fetchHeartRate(startDate: string, endDate: string): Promise<HeartRateData[]> {
    const heartRates: HeartRateData[] = [];
    const dates = this.getDateRange(startDate, endDate);

    for (const date of dates) {
      try {
        const response = await this.fetchWithOAuth(
          `${this.config.apiBaseUrl}/wellness-api/rest/dailies/${date}`
        );

        const data = await response.json();
        
        if (data.restingHeartRate || data.maxHeartRate) {
          heartRates.push({
            date,
            restingHr: data.restingHeartRate,
            maxHr: data.maxHeartRate,
            minHr: data.minHeartRate,
            source: 'garmin',
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch Garmin heart rate for ${date}:`, error);
      }
    }

    return heartRates;
  }

  async fetchCalories(startDate: string, endDate: string): Promise<CaloriesData[]> {
    const calories: CaloriesData[] = [];
    const dates = this.getDateRange(startDate, endDate);

    for (const date of dates) {
      try {
        const response = await this.fetchWithOAuth(
          `${this.config.apiBaseUrl}/wellness-api/rest/dailies/${date}`
        );

        const data = await response.json();
        
        if (data.totalKilocalories) {
          calories.push({
            date,
            totalBurned: data.totalKilocalories,
            activeCalories: data.activeKilocalories || Math.round(data.totalKilocalories * 0.3),
            bmrCalories: data.bmrKilocalories,
            source: 'garmin',
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch Garmin calories for ${date}:`, error);
      }
    }

    return calories;
  }

  async fetchSleep(startDate: string, endDate: string): Promise<SleepData[]> {
    const sleepData: SleepData[] = [];
    const dates = this.getDateRange(startDate, endDate);

    for (const date of dates) {
      try {
        const response = await this.fetchWithOAuth(
          `${this.config.apiBaseUrl}/wellness-api/rest/dailySleep/${date}`
        );

        const data = await response.json();
        
        if (data.sleepTimeSeconds) {
          const stages: SleepStage[] = [];
          
          if (data.sleepLevels) {
            for (const level of data.sleepLevels) {
              const stageMap: Record<string, SleepStage['stage']> = {
                'awake': 'awake',
                'light': 'light',
                'deep': 'deep',
                'rem': 'rem',
              };
              
              if (stageMap[level.activityLevel]) {
                stages.push({
                  stage: stageMap[level.activityLevel],
                  startTime: new Date(level.startGMT).toISOString(),
                  duration: Math.round(level.endGMT - level.startGMT) / 60000,
                });
              }
            }
          }

          sleepData.push({
            date,
            startTime: new Date(data.sleepStartTimestampGMT).toISOString(),
            endTime: new Date(data.sleepEndTimestampGMT).toISOString(),
            duration: Math.round(data.sleepTimeSeconds / 60),
            stages,
            source: 'garmin',
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch Garmin sleep for ${date}:`, error);
      }
    }

    return sleepData;
  }

  // ============================================================
  // OAuth 1.0a Helper Methods
  // ============================================================

  private generateOAuthParams(): Record<string, string> {
    return {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: this.generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
    };
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateSignature(
    method: string,
    url: string,
    params: Record<string, string>,
    tokenSecret: string
  ): string {
    // Sort and encode parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams),
    ].join('&');

    // Create signing key
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Generate HMAC-SHA1 signature (would need crypto library in production)
    // This is a placeholder - in production use crypto.createHmac
    return Buffer.from(signatureBase).toString('base64');
  }

  private buildAuthHeader(params: Record<string, string>): string {
    const headerParams = Object.keys(params)
      .filter(key => key.startsWith('oauth_'))
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
      .join(', ');

    return `OAuth ${headerParams}`;
  }

  private async fetchWithOAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.tokens) {
      throw new FitnessSyncError(
        'Not authenticated',
        'garmin',
        'AUTH_REQUIRED'
      );
    }

    const oauthParams = this.generateOAuthParams();
    oauthParams.oauth_token = this.tokens.accessToken;
    
    const signature = this.generateSignature(
      options.method || 'GET',
      url,
      oauthParams,
      this.tokens.refreshToken || ''
    );
    oauthParams.oauth_signature = signature;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': this.buildAuthHeader(oauthParams),
      },
    });

    if (!response.ok) {
      throw new FitnessSyncError(
        `API error: ${response.status}`,
        'garmin',
        'API_ERROR'
      );
    }

    return response;
  }

  private mapActivityType(typeKey?: string): ActivityType {
    if (!typeKey) return 'other';
    return GARMIN_ACTIVITY_MAP[typeKey.toLowerCase()] || 'other';
  }
}
