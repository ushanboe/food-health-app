// ============================================================
// Fitness Data Sync API
// Server-side data fetching from fitness providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';
import { PROVIDER_CONFIGS } from '@/lib/fitness-sync/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, accessToken, startDate, endDate, dataTypes } = body;

    if (!provider || !accessToken || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const config = PROVIDER_CONFIGS[provider as FitnessProvider];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const results: Record<string, any[]> = {};
    const types = dataTypes || ['steps', 'activities', 'heartRate', 'calories', 'sleep'];

    // Fetch each data type
    for (const dataType of types) {
      try {
        const data = await fetchDataType(
          provider as FitnessProvider,
          accessToken,
          dataType,
          startDate,
          endDate,
          config
        );
        results[dataType] = data;
      } catch (error) {
        console.error(`Failed to fetch ${dataType} from ${provider}:`, error);
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
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

async function fetchDataType(
  provider: FitnessProvider,
  accessToken: string,
  dataType: string,
  startDate: string,
  endDate: string,
  config: typeof PROVIDER_CONFIGS[FitnessProvider]
): Promise<any[]> {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  switch (provider) {
    case 'google_fit':
      return fetchGoogleFitData(dataType, startDate, endDate, headers, config);
    case 'fitbit':
      return fetchFitbitData(dataType, startDate, endDate, headers, config);
    case 'strava':
      return fetchStravaData(dataType, startDate, endDate, headers, config);
    case 'garmin':
      return fetchGarminData(dataType, startDate, endDate, accessToken, config);
    default:
      return [];
  }
}

// ============================================================
// Google Fit Data Fetching
// ============================================================

async function fetchGoogleFitData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  config: typeof PROVIDER_CONFIGS['google_fit']
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
      `${config.apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}`,
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

  if (dataType === 'sleep') {
    const response = await fetch(
      `${config.apiBaseUrl}/sessions?startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}&activityType=72`,
      { headers }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.session || []).map((s: any) => ({
      date: new Date(parseInt(s.startTimeMillis)).toISOString().split('T')[0],
      startTime: new Date(parseInt(s.startTimeMillis)).toISOString(),
      endTime: new Date(parseInt(s.endTimeMillis)).toISOString(),
      duration: Math.round((parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 60000),
      source: 'google_fit',
      syncedAt: new Date().toISOString(),
    }));
  }

  const googleDataType = dataTypeMap[dataType];
  if (!googleDataType) return [];

  const response = await fetch(`${config.apiBaseUrl}/dataset:aggregate`, {
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

// ============================================================
// Fitbit Data Fetching
// ============================================================

async function fetchFitbitData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  config: typeof PROVIDER_CONFIGS['fitbit']
): Promise<any[]> {
  const endpointMap: Record<string, string> = {
    steps: `/activities/steps/date/${startDate}/${endDate}.json`,
    calories: `/activities/calories/date/${startDate}/${endDate}.json`,
    heartRate: `/activities/heart/date/${startDate}/${endDate}.json`,
    sleep: `/sleep/date/${startDate}/${endDate}.json`,
  };

  if (dataType === 'activities') {
    // Fitbit requires day-by-day fetching for activities
    const activities: any[] = [];
    const dates = getDateRange(startDate, endDate);
    
    for (const date of dates) {
      try {
        const response = await fetch(
          `${config.apiBaseUrl}/activities/date/${date}.json`,
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
            type: mapFitbitActivityType(activity.name),
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

  const response = await fetch(`${config.apiBaseUrl}${endpoint}`, { headers });
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
      zones: e.value?.heartRateZones?.map((z: any) => ({
        name: z.name,
        min: z.min,
        max: z.max,
        minutes: z.minutes || 0,
      })),
      source: 'fitbit',
      syncedAt: new Date().toISOString(),
    })).filter((h: any) => h.restingHr || h.zones?.length);
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

// ============================================================
// Strava Data Fetching
// ============================================================

async function fetchStravaData(
  dataType: string,
  startDate: string,
  endDate: string,
  headers: Record<string, string>,
  config: typeof PROVIDER_CONFIGS['strava']
): Promise<any[]> {
  // Strava primarily provides activities
  if (dataType !== 'activities' && dataType !== 'steps' && dataType !== 'calories') {
    return [];
  }

  const after = Math.floor(new Date(startDate).getTime() / 1000);
  const before = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

  const activities: any[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${config.apiBaseUrl}/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=50`,
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

// ============================================================
// Garmin Data Fetching (placeholder - requires OAuth 1.0a)
// ============================================================

async function fetchGarminData(
  dataType: string,
  startDate: string,
  endDate: string,
  accessToken: string,
  config: typeof PROVIDER_CONFIGS['garmin']
): Promise<any[]> {
  // Garmin requires OAuth 1.0a signature for each request
  // This is a simplified placeholder
  console.warn('Garmin sync requires OAuth 1.0a implementation');
  return [];
}

// ============================================================
// Helper Functions
// ============================================================

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

function mapFitbitActivityType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('walk')) return 'walking';
  if (n.includes('run') || n.includes('jog')) return 'running';
  if (n.includes('bike') || n.includes('cycl')) return 'cycling';
  if (n.includes('swim')) return 'swimming';
  if (n.includes('hike')) return 'hiking';
  if (n.includes('weight') || n.includes('strength')) return 'strength';
  if (n.includes('yoga')) return 'yoga';
  return 'workout';
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
