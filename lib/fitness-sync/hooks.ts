// ============================================================
// Fitness Sync React Hooks
// Custom hooks for fitness data synchronization
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  FitnessProvider,
  FitnessConnection,
  AggregatedFitnessData,
  FitnessActivity,
  DailySteps,
  DailyCalories,
  DailyHeartRate,
  HeartRateData,
} from './types';

const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

/**
 * Hook for managing fitness sync operations
 */
export function useFitnessSync() {
  const {
    fitnessConnections,
    fitnessSyncPreferences,
    syncedFitnessData,
    isFitnessSyncing,
    fitnessSyncError,
    lastFitnessSyncAt,
    setFitnessConnection,
    clearFitnessConnection,
    setSyncedFitnessData,
    setFitnessSyncing,
    setFitnessSyncError,
    setLastFitnessSyncAt,
    getConnectedFitnessProviders,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get stored tokens from localStorage
   */
  const getStoredTokens = useCallback(() => {
    try {
      const saved = localStorage.getItem('fitness_tokens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  /**
   * Sync data from a single provider
   * Tokens are stored in httpOnly cookies on the server, so we just call the endpoint
   */
  const syncProvider = useCallback(async (
    provider: FitnessProvider,
    startDate: string,
    endDate: string
  ): Promise<{
    activities: FitnessActivity[];
    steps: DailySteps[];
    calories: DailyCalories[];
    heartRate: HeartRateData[];
  } | null> => {
    try {
      // Call the provider-specific sync endpoint
      // Server handles tokens from httpOnly cookies
      const response = await fetch(`/api/fitness/sync/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();
      
      // Update connection last sync time
      const connection = fitnessConnections[provider];
      if (connection) {
        setFitnessConnection(provider, {
          ...connection,
          lastSyncAt: result.syncedAt,
        });
      }

      // Transform server response to match expected client format
      const serverData = result.data || {};
      
      // Transform steps: server returns { date, steps } -> client expects { date, value }
      const steps: DailySteps[] = (serverData.steps || []).map((s: any) => ({
        date: s.date,
        value: s.steps || s.value || 0,
        sources: [provider],
      }));

      // Transform calories: server returns { date, totalBurned } -> client expects { date, value }
      const calories: DailyCalories[] = (serverData.calories || []).map((c: any) => ({
        date: c.date,
        value: c.totalBurned || c.value || 0,
        sources: [provider],
      }));

      // Transform heart rate: server returns { date, averageHr } -> client expects { date, averageHr }
      const heartRate: HeartRateData[] = (serverData.heartRate || []).map((h: any) => ({
        date: h.date,
        averageHr: h.averageHr || h.average || 0,
        maxHr: h.maxHr,
        minHr: h.minHr,
        restingHr: h.restingHr,
      }));

      // Activities are already in correct format
      const activities: FitnessActivity[] = serverData.activities || [];

      return { activities, steps, calories, heartRate };
    } catch (error) {
      console.error(`Failed to sync ${provider}:`, error);
      return null;
    }
  }, [fitnessConnections, setFitnessConnection]);

  /**
   * Aggregate data from multiple providers
   * Returns a component-friendly structure with daily aggregates
   */
  const aggregateData = useCallback((
    allData: Array<{
      provider: FitnessProvider;
      data: {
        activities: FitnessActivity[];
        steps: DailySteps[];
        calories: DailyCalories[];
        heartRate: HeartRateData[];
      };
    }>
  ): {
    activities: FitnessActivity[];
    dailySteps: DailySteps[];
    dailyCalories: DailyCalories[];
    dailyHeartRate: DailyHeartRate[];
    lastSyncAt: string;
    sources: FitnessProvider[];
  } => {
    const activities: FitnessActivity[] = [];
    const stepsMap = new Map<string, { value: number; sources: FitnessProvider[] }>();
    const caloriesMap = new Map<string, { value: number; sources: FitnessProvider[] }>();
    const heartRateMap = new Map<string, { values: number[]; sources: FitnessProvider[] }>();

    for (const { provider, data } of allData) {
      // Collect activities
      activities.push(...data.activities);

      // Aggregate steps by date (take max value per date)
      for (const step of data.steps) {
        const existing = stepsMap.get(step.date);
        if (existing) {
          if (step.value > existing.value) {
            existing.value = step.value;
          }
          if (!existing.sources.includes(provider)) {
            existing.sources.push(provider);
          }
        } else {
          stepsMap.set(step.date, { value: step.value, sources: [provider] });
        }
      }

      // Aggregate calories by date (take max value per date)
      for (const cal of data.calories) {
        const existing = caloriesMap.get(cal.date);
        if (existing) {
          if (cal.value > existing.value) {
            existing.value = cal.value;
          }
          if (!existing.sources.includes(provider)) {
            existing.sources.push(provider);
          }
        } else {
          caloriesMap.set(cal.date, { value: cal.value, sources: [provider] });
        }
      }

      // Aggregate heart rate by date (average all values)
      for (const hr of data.heartRate) {
        const existing = heartRateMap.get(hr.date);
        if (existing) {
          existing.values.push(hr.averageHr || 0);
          if (!existing.sources.includes(provider)) {
            existing.sources.push(provider);
          }
        } else {
          heartRateMap.set(hr.date, { values: [hr.averageHr || 0], sources: [provider] });
        }
      }
    }

    // Convert maps to arrays
    const dailySteps: DailySteps[] = Array.from(stepsMap.entries()).map(([date, data]) => ({
      date,
      value: data.value,
      sources: data.sources,
    }));

    const dailyCalories: DailyCalories[] = Array.from(caloriesMap.entries()).map(([date, data]) => ({
      date,
      value: data.value,
      sources: data.sources,
    }));

    const heartRate: DailyHeartRate[] = Array.from(heartRateMap.entries()).map(([date, data]) => ({
      date,
      average: data.values.reduce((a, b) => a + b, 0) / data.values.length,
      min: Math.min(...data.values),
      max: Math.max(...data.values),
      sources: data.sources,
    }));

    // Sort activities by start time (newest first)
    activities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return {
      activities,
      dailySteps,
      dailyCalories,
      dailyHeartRate: heartRate,
      lastSyncAt: new Date().toISOString(),
      sources: allData.map(d => d.provider),
    };
  }, []);

  /**
   * Sync all connected providers
   */
  const syncAllProviders = useCallback(async () => {
    const connectedProviders = getConnectedFitnessProviders();
    
    if (connectedProviders.length === 0) {
      setFitnessSyncError('No fitness providers connected');
      return;
    }

    setIsLoading(true);
    setFitnessSyncing(true);
    setFitnessSyncError(null);

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(
        Date.now() - fitnessSyncPreferences.syncDaysBack * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0];

      const results: Array<{
        provider: FitnessProvider;
        data: {
          activities: FitnessActivity[];
          steps: DailySteps[];
          calories: DailyCalories[];
          heartRate: HeartRateData[];
        };
      }> = [];

      for (const provider of connectedProviders) {
        const data = await syncProvider(provider, startDate, endDate);
        if (data) {
          results.push({ provider, data });
        }
      }

      if (results.length > 0) {
        const aggregated = aggregateData(results);
        setSyncedFitnessData(aggregated);
        setLastFitnessSyncAt(new Date().toISOString());
      } else {
        setFitnessSyncError('Failed to sync any providers');
      }
    } catch (error) {
      setFitnessSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsLoading(false);
      setFitnessSyncing(false);
    }
  }, [
    getConnectedFitnessProviders,
    fitnessSyncPreferences.syncDaysBack,
    syncProvider,
    aggregateData,
    setSyncedFitnessData,
    setLastFitnessSyncAt,
    setFitnessSyncing,
    setFitnessSyncError,
  ]);

  /**
   * Auto-sync on mount if enabled
   */
  useEffect(() => {
    if (fitnessSyncPreferences.autoSyncEnabled && !isFitnessSyncing) {
      const connectedProviders = getConnectedFitnessProviders();
      if (connectedProviders.length > 0) {
        // Check if we should sync (based on last sync time)
        const lastSync = lastFitnessSyncAt ? new Date(lastFitnessSyncAt).getTime() : 0;
        const syncInterval = fitnessSyncPreferences.syncIntervalMinutes * 60 * 1000;
        const now = Date.now();

        if (now - lastSync > syncInterval) {
          syncAllProviders();
        }
      }
    }
  }, []); // Only run on mount

  return {
    // State
    isLoading,
    isSyncing: isFitnessSyncing,
    error: fitnessSyncError,
    lastSyncAt: lastFitnessSyncAt,
    syncedData: syncedFitnessData,
    connectedProviders: getConnectedFitnessProviders(),
    
    // Actions
    syncAllProviders,
    syncProvider,
    clearError: () => setFitnessSyncError(null),
  };
}

/**
 * Hook for getting fitness data for a specific date
 */
export function useFitnessDataForDate(date: string) {
  const { syncedFitnessData } = useAppStore();

  if (!syncedFitnessData) {
    return {
      activities: [],
      steps: null,
      calories: null,
      heartRate: null,
    };
  }

  const activities = syncedFitnessData.activities.filter(a => {
    const activityDate = new Date(a.startTime).toISOString().split('T')[0];
    return activityDate === date;
  });

  const steps = syncedFitnessData.dailySteps?.find(d => d.date === date) || null;
  const calories = syncedFitnessData.dailyCalories?.find(d => d.date === date) || null;
  const heartRate = syncedFitnessData.dailyHeartRate?.find(d => d.date === date) || null;

  return {
    activities,
    steps,
    calories,
    heartRate,
  };
}

/**
 * Hook for checking if a provider is connected
 */
export function useFitnessProviderStatus(provider: FitnessProvider) {
  const { fitnessConnections } = useAppStore();
  const connection = fitnessConnections[provider];

  return {
    isConnected: connection?.isConnected ?? false,
    connectedAt: connection?.connectedAt ?? null,
    lastSyncAt: connection?.lastSyncAt ?? null,
    syncEnabled: connection?.syncEnabled ?? false,
  };
}
