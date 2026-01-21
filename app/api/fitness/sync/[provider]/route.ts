// ============================================================
// Fitness Sync Route (Provider-Specific)
// Syncs fitness data using stored tokens, handles token refresh
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider, FitnessTokens } from '@/lib/fitness-sync/types';
import { cookies } from 'next/headers';

const VALID_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Get provider config at runtime (not module load time)
function getProviderConfig(provider: FitnessProvider): {
  apiBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
} {
  switch (provider) {
    case 'google_fit':
      return {
        apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
      };
    case 'fitbit':
      return {
        apiBaseUrl: 'https://api.fitbit.com/1/user/-',
        tokenUrl: 'https://api.fitbit.com/oauth2/token',
        clientId: process.env.FITBIT_CLIENT_ID || '',
        clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
      };
    case 'strava':
      return {
        apiBaseUrl: 'https://www.strava.com/api/v3',
        tokenUrl: 'https://www.strava.com/oauth/token',
        clientId: process.env.STRAVA_CLIENT_ID || '',
        clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
      };
    case 'garmin':
      return {
        apiBaseUrl: 'https://apis.garmin.com',
        tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
        clientId: process.env.GARMIN_CONSUMER_KEY || '',
        clientSecret: process.env.GARMIN_CONSUMER_SECRET || '',
      };
    default:
      return { apiBaseUrl: '', tokenUrl: '', clientId: '', clientSecret: '' };
  }
}

interface SyncRequest {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  dataTypes?: string[];
}

/**
 * POST /api/fitness/sync/[provider]
 * Syncs fitness data for a specific provider using stored tokens
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    );
  }

  const providerKey = provider as FitnessProvider;
  const cookieStore = await cookies();

  // Get stored tokens
  const tokenCookie = cookieStore.get(`fitness_tokens_${provider}`);
  if (!tokenCookie) {
    return NextResponse.json(
      { error: 'Not connected', code: 'NOT_CONNECTED' },
      { status: 401 }
    );
  }

  let tokenData: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    connectedAt: string;
  };

  try {
    tokenData = JSON.parse(
      Buffer.from(tokenCookie.value, 'base64').toString('utf-8')
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid token data', code: 'INVALID_TOKENS' },
      { status: 401 }
    );
  }

  // Get config at request time
  const config = getProviderConfig(providerKey);

  // Check if token needs refresh
  let accessToken = tokenData.accessToken;
  if (tokenData.expiresAt && tokenData.expiresAt < Date.now() + 60000) {
    // Token expires in less than 1 minute - refresh it
    try {
      const newTokens = await refreshAccessToken(providerKey, tokenData.refreshToken, config);
      accessToken = newTokens.accessToken;

      // Update stored tokens
      const updatedTokenData = {
        ...tokenData,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || tokenData.refreshToken,
        expiresAt: newTokens.expiresAt,
      };

      cookieStore.set(`fitness_tokens_${provider}`,
        Buffer.from(JSON.stringify(updatedTokenData)).toString('base64'),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
        }
      );
    } catch (refreshError) {
      console.error(`Token refresh failed for ${provider}:`, refreshError);
      return NextResponse.json(
        { error: 'Token refresh failed', code: 'TOKEN_REFRESH_FAILED' },
        { status: 401 }
      );
    }
  }

  // Parse request body
  let body: SyncRequest = {};
  try {
    body = await request.json();
  } catch {
    // Use defaults
  }

  const endDate = body.endDate || new Date().toISOString().split('T')[0];
  const startDate = body.startDate || new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];
  const dataTypes = body.dataTypes || ['steps', 'activities', 'heartRate', 'calories', 'sleep'];

  // Fetch data from provider
  try {
    const results: Record<string, any[]> = {};

    for (const dataType of dataTypes) {
      try {
        const data = await fetchDataType(
          providerKey,
          accessToken,
          dataType,
          startDate,
          endDate,
          config.apiBaseUrl
        );
        results[dataType] = data;
      } catch (err) {
        console.error(`Failed to fetch ${dataType} from ${provider}:`, err);
        results[dataType] = [];
      }
    }

    return NextResponse.json({
      provider,
      success: true,
      syncedAt: new Date().toISOString(),
      data: results,
    });
  } catch (error) {
    console.error(`Sync error for ${provider}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// Token Refresh
// ============================================================

async function refreshAccessToken(
  provider: FitnessProvider,
  refreshToken: string,
  config: { clientId: string; clientSecret: string; tokenUrl: string }
): Promise<FitnessTokens> {
  let response: Response;

  switch (provider) {
    case 'google_fit':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      break;

    case 'fitbit': {
      const basicAuth = Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64');

      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      break;
    }

    case 'strava':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      break;

    case 'garmin':
      // OAuth 1.0a tokens don't expire
      return {
        accessToken: refreshToken,
        refreshToken,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: provider === 'strava'
      ? data.expires_at * 1000
      : Date.now() + (data.expires_in * 1000),
    scope: data.scope,
    tokenType: data.token_type,
  };
}

// ============================================================
// Data Fetching Functions
// ============================================================

async function fetchDataType(
  provider: FitnessProvider,
  accessToken: string,
  dataType: string,
  startDate: string,
  endDate: string,
  apiBaseUrl: string
): Promise<any[]> {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  switch (provider) {
    case 'google_fit':
      return fetchGoogleFitData(dataType, startDate, endDate, headers, apiBaseUrl);
    case 'fitbit':
      return fetchFitbitData(dataType, startDate, endDate, headers, apiBaseUrl);
    case 'strava':
      return fetchStravaData(dataType, startDate, endDate, headers, apiBaseUrl);
    case 'garmin':
      return []; // Garmin requires OAuth 1.0a
    default:
      return [];
  }
}

// Google Fit data fetching
async function fetchGoogleFitData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  apiBaseUrl: string
): Promise<any[]> {
  const startTimeMillis = new Date(startDate).setHours(0, 0, 0, 0).toString();
  const endTimeMillis = new Date(endDate).setHours(23, 59, 59, 999).toString();

  const dataTypeMap: Record<string, string> = {
    steps: 'com.google.step_count.delta',
    calories: 'com.google.calories.expended',
    heartRate: 'com.google.heart_rate.bpm',
  };

  if (dataType === 'activities') {
    const response = await fetch(
      `${apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}`,
      { headers }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.session || []).map((s: any) => ({
      id: `gfit_${s.id}`,
      externalId: s.id,
      source: 'google_fit',
      name: s.name || 'Activity',
      startTime: new Date(parseInt(s.startTimeMillis)).toISOString(),
      endTime: new Date(parseInt(s.endTimeMillis)).toISOString(),
      duration: Math.round((parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 60000),
      syncedAt: new Date().toISOString(),
    }));
  }

  const googleDataType = dataTypeMap[dataType];
  if (!googleDataType) return [];

  const response = await fetch(`${apiBaseUrl}/dataset:aggregate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName: googleDataType }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  const results: any[] = [];

  for (const bucket of data.bucket || []) {
    const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
    let value = 0;
    const readings: number[] = [];

    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        for (const v of point.value || []) {
          if (v.intVal) value += v.intVal;
          if (v.fpVal) readings.push(v.fpVal);
        }
      }
    }

    if (dataType === 'steps' && value > 0) {
      results.push({ date, steps: value, source: 'google_fit', syncedAt: new Date().toISOString() });
    } else if (dataType === 'calories' && readings.length > 0) {
      const total = readings.reduce((a, b) => a + b, 0);
      results.push({ date, totalBurned: Math.round(total), source: 'google_fit', syncedAt: new Date().toISOString() });
    } else if (dataType === 'heartRate' && readings.length > 0) {
      results.push({
        date,
        averageHr: Math.round(readings.reduce((a, b) => a + b, 0) / readings.length),
        maxHr: Math.max(...readings),
        minHr: Math.min(...readings),
        source: 'google_fit',
        syncedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// Fitbit data fetching
async function fetchFitbitData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  apiBaseUrl: string
): Promise<any[]> {
  const endpointMap: Record<string, string> = {
    steps: `/activities/steps/date/${startDate}/${endDate}.json`,
    calories: `/activities/calories/date/${startDate}/${endDate}.json`,
    heartRate: `/activities/heart/date/${startDate}/${endDate}.json`,
    sleep: `/sleep/date/${startDate}/${endDate}.json`,
  };

  if (dataType === 'activities') {
    const activities: any[] = [];
    const dates = getDateRange(startDate, endDate);

    for (const date of dates.slice(0, 7)) { // Limit to 7 days to avoid rate limits
      try {
        const response = await fetch(
          `${apiBaseUrl}/activities/date/${date}.json`,
          { headers }
        );
        if (!response.ok) continue;
        const data = await response.json();

        for (const activity of data.activities || []) {
          activities.push({
            id: `fitbit_${activity.logId}`,
            externalId: activity.logId.toString(),
            source: 'fitbit',
            name: activity.name,
            startTime: `${date}T${activity.startTime || '00:00:00'}`,
            duration: activity.duration ? Math.round(activity.duration / 60000) : 0,
            calories: activity.calories,
            distance: activity.distance ? activity.distance * 1000 : undefined,
            steps: activity.steps,
            syncedAt: new Date().toISOString(),
          });
        }
      } catch {
        continue;
      }
    }
    return activities;
  }

  const endpoint = endpointMap[dataType];
  if (!endpoint) return [];

  const response = await fetch(`${apiBaseUrl}${endpoint}`, { headers });
  if (!response.ok) return [];
  const data = await response.json();

  if (dataType === 'steps') {
    return (data['activities-steps'] || []).map((e: any) => ({
      date: e.dateTime,
      steps: parseInt(e.value),
      source: 'fitbit',
      syncedAt: new Date().toISOString(),
    })).filter((s: any) => s.steps > 0);
  }

  if (dataType === 'calories') {
    return (data['activities-calories'] || []).map((e: any) => ({
      date: e.dateTime,
      totalBurned: parseInt(e.value),
      source: 'fitbit',
      syncedAt: new Date().toISOString(),
    })).filter((c: any) => c.totalBurned > 0);
  }

  if (dataType === 'heartRate') {
    return (data['activities-heart'] || []).map((e: any) => ({
      date: e.dateTime,
      restingHr: e.value?.restingHeartRate,
      source: 'fitbit',
      syncedAt: new Date().toISOString(),
    })).filter((h: any) => h.restingHr);
  }

  if (dataType === 'sleep') {
    return (data.sleep || []).map((s: any) => ({
      date: s.dateOfSleep,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration ? Math.round(s.duration / 60000) : 0,
      efficiency: s.efficiency,
      source: 'fitbit',
      syncedAt: new Date().toISOString(),
    }));
  }

  return [];
}

// Strava data fetching
async function fetchStravaData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  apiBaseUrl: string
): Promise<any[]> {
  if (dataType !== 'activities' && dataType !== 'steps' && dataType !== 'calories') {
    return [];
  }

  const after = Math.floor(new Date(startDate).getTime() / 1000);
  const before = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

  const activities: any[] = [];
  let page = 1;

  while (page <= 3) { // Limit pages to avoid rate limits
    const response = await fetch(
      `${apiBaseUrl}/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=50`,
      { headers }
    );
    if (!response.ok) break;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const a of data) {
      activities.push({
        id: `strava_${a.id}`,
        externalId: a.id.toString(),
        source: 'strava',
        name: a.name,
        type: mapStravaActivityType(a.sport_type || a.type),
        startTime: a.start_date,
        duration: Math.round(a.moving_time / 60),
        calories: a.calories || estimateStravaCalories(a),
        distance: a.distance,
        averageHeartRate: a.average_heartrate,
        maxHeartRate: a.max_heartrate,
        averageSpeed: a.average_speed ? a.average_speed * 3.6 : undefined,
        elevationGain: a.total_elevation_gain,
        syncedAt: new Date().toISOString(),
      });
    }

    if (data.length < 50) break;
    page++;
  }

  if (dataType === 'activities') {
    return activities;
  }

  // Derive steps from walking/running activities
  if (dataType === 'steps') {
    const stepsByDate: Record<string, number> = {};
    for (const a of activities) {
      if (a.type === 'walking' || a.type === 'running') {
        const date = a.startTime.split('T')[0];
        const stepsPerKm = a.type === 'walking' ? 1300 : 1000;
        const steps = Math.round((a.distance || 0) / 1000 * stepsPerKm);
        stepsByDate[date] = (stepsByDate[date] || 0) + steps;
      }
    }
    return Object.entries(stepsByDate).map(([date, steps]) => ({
      date,
      steps,
      source: 'strava',
      syncedAt: new Date().toISOString(),
    }));
  }

  // Derive calories from activities
  if (dataType === 'calories') {
    const caloriesByDate: Record<string, number> = {};
    for (const a of activities) {
      if (a.calories) {
        const date = a.startTime.split('T')[0];
        caloriesByDate[date] = (caloriesByDate[date] || 0) + a.calories;
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

  return [];
}

// Helper functions
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function mapStravaActivityType(type: string): string {
  const map: Record<string, string> = {
    'Run': 'running',
    'Ride': 'cycling',
    'Swim': 'swimming',
    'Walk': 'walking',
    'Hike': 'hiking',
    'WeightTraining': 'strength',
    'Yoga': 'yoga',
    'VirtualRide': 'cycling',
    'VirtualRun': 'running',
  };
  return map[type] || 'workout';
}

function estimateStravaCalories(activity: any): number {
  const durationHours = (activity.moving_time || 0) / 3600;
  const metValues: Record<string, number> = {
    'Run': 9.8,
    'Ride': 7.5,
    'Swim': 8.0,
    'Walk': 3.5,
    'Hike': 6.0,
  };
  const met = metValues[activity.sport_type] || metValues[activity.type] || 5.0;
  return Math.round(met * 70 * durationHours);
}
