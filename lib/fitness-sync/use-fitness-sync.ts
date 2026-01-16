// ============================================================
// React Hook for Fitness Sync
// Provides easy integration with React components
// Uses server-side OAuth flow - tokens stored in httpOnly cookies
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FitnessProvider,
  FitnessConnection,
  FitnessSyncResult,
  AggregatedFitnessData,
  StepData,
  SyncedActivity,
  HeartRateData,
  CaloriesData,
  SleepData,
} from './types';

// Storage keys for local state (not tokens - those are in httpOnly cookies)
const STORAGE_KEYS = {
  CONNECTIONS: 'fitness_connections',
  SYNCED_DATA: 'fitness_synced_data',
  LAST_SYNC: 'fitness_last_sync',
};

const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

export interface UseFitnessSyncReturn {
  // Connection state
  connections: Record<FitnessProvider, FitnessConnection | null>;
  isConnected: (provider: FitnessProvider) => boolean;
  connectedProviders: FitnessProvider[];

  // OAuth actions
  connect: (provider: FitnessProvider) => void;
  disconnect: (provider: FitnessProvider) => Promise<void>;

  // Sync actions
  syncProvider: (provider: FitnessProvider, days?: number) => Promise<FitnessSyncResult | null>;
  syncAll: (days?: number) => Promise<FitnessSyncResult[]>;

  // Data
  syncedData: AggregatedFitnessData | null;
  lastSyncTime: string | null;

  // Status
  isSyncing: boolean;
  syncError: string | null;
  isLoading: boolean;

  // Refresh connection status from server
  refreshConnectionStatus: () => Promise<void>;
}

export function useFitnessSync(): UseFitnessSyncReturn {
  const [connections, setConnections] = useState<Record<FitnessProvider, FitnessConnection | null>>(
    () => ({
      google_fit: null,
      fitbit: null,
      strava: null,
      garmin: null,
    })
  );
  const [syncedData, setSyncedData] = useState<AggregatedFitnessData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state and check server connection status on mount
  useEffect(() => {
    loadSavedState();
    refreshConnectionStatus();
  }, []);

  const loadSavedState = () => {
    try {
      // Load cached connections (will be verified with server)
      const savedConnections = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (savedConnections) {
        const parsed: FitnessConnection[] = JSON.parse(savedConnections);
        const connMap: Record<FitnessProvider, FitnessConnection | null> = {
          google_fit: null,
          fitbit: null,
          strava: null,
          garmin: null,
        };
        for (const conn of parsed) {
          connMap[conn.provider] = conn;
        }
        setConnections(connMap);
      }

      // Load synced data
      const savedData = localStorage.getItem(STORAGE_KEYS.SYNCED_DATA);
      if (savedData) {
        setSyncedData(JSON.parse(savedData));
      }

      // Load last sync time
      const savedLastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (savedLastSync) {
        setLastSyncTime(savedLastSync);
      }
    } catch (error) {
      console.error('Failed to load fitness sync state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh connection status from server (checks httpOnly cookies)
  const refreshConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/fitness/status');
      if (response.ok) {
        const data = await response.json();
        const connMap: Record<FitnessProvider, FitnessConnection | null> = {
          google_fit: null,
          fitbit: null,
          strava: null,
          garmin: null,
        };

        for (const provider of ALL_PROVIDERS) {
          const status = data.connections?.[provider];
          if (status?.connected) {
            connMap[provider] = {
              provider,
              isConnected: true,
              connectedAt: status.connectedAt || new Date().toISOString(),
              lastSyncAt: status.lastSyncAt || null,
              syncEnabled: true,
            };
          }
        }

        setConnections(connMap);
        saveConnections(connMap);
      }
    } catch (error) {
      console.error('Failed to refresh connection status:', error);
    }
  }, []);

  const saveConnections = (conns: Record<FitnessProvider, FitnessConnection | null>) => {
    const connArray = Object.values(conns).filter(Boolean) as FitnessConnection[];
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connArray));
  };

  const isConnected = useCallback((provider: FitnessProvider): boolean => {
    return connections[provider]?.isConnected ?? false;
  }, [connections]);

  const connectedProviders = Object.entries(connections)
    .filter(([_, conn]) => conn?.isConnected)
    .map(([provider]) => provider as FitnessProvider);

  // ============================================================
  // OAuth Methods - Server-Side Flow
  // ============================================================

  /**
   * Initiates OAuth flow by redirecting to server-side connect endpoint
   * The server handles all OAuth logic and stores tokens in httpOnly cookies
   */
  const connect = useCallback((provider: FitnessProvider) => {
    // Redirect to server-side OAuth initiation
    window.location.href = `/api/fitness/connect/${provider}`;
  }, []);

  /**
   * Disconnects a provider by calling server-side disconnect endpoint
   * Server removes tokens from httpOnly cookies
   */
  const disconnect = useCallback(async (provider: FitnessProvider) => {
    try {
      const response = await fetch(`/api/fitness/disconnect/${provider}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Disconnect failed');
      }

      // Update local state
      const updatedConnections = { ...connections, [provider]: null };
      setConnections(updatedConnections);
      saveConnections(updatedConnections);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Disconnect failed');
    }
  }, [connections]);

  // ============================================================
  // Sync Methods
  // ============================================================

  /**
   * Syncs data from a specific provider
   * Server handles token refresh automatically using httpOnly cookies
   */
  const syncProvider = useCallback(async (
    provider: FitnessProvider,
    days: number = 7
  ): Promise<FitnessSyncResult | null> => {
    if (!isConnected(provider)) {
      return null;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

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

        // If not connected, update local state
        if (error.code === 'NOT_CONNECTED' || error.code === 'TOKEN_REFRESH_FAILED') {
          const updatedConnections = { ...connections, [provider]: null };
          setConnections(updatedConnections);
          saveConnections(updatedConnections);
        }

        throw new Error(error.error || 'Sync failed');
      }

      const result: FitnessSyncResult = await response.json();

      // Update connection last sync time
      if (result.success) {
        const updatedConnections = {
          ...connections,
          [provider]: {
            ...connections[provider]!,
            lastSyncAt: result.syncedAt,
          },
        };
        setConnections(updatedConnections);
        saveConnections(updatedConnections);
      }

      return result;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
      return {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        syncedAt: new Date().toISOString(),
      };
    } finally {
      setIsSyncing(false);
    }
  }, [connections, isConnected]);

  /**
   * Syncs data from all connected providers
   */
  const syncAll = useCallback(async (days: number = 7): Promise<FitnessSyncResult[]> => {
    setIsSyncing(true);
    setSyncError(null);

    const results: FitnessSyncResult[] = [];

    for (const provider of connectedProviders) {
      const result = await syncProvider(provider, days);
      if (result) {
        results.push(result);
      }
    }

    // Aggregate and save data
    if (results.length > 0) {
      const aggregated = aggregateResults(results);
      setSyncedData(aggregated);
      localStorage.setItem(STORAGE_KEYS.SYNCED_DATA, JSON.stringify(aggregated));

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
    }

    setIsSyncing(false);
    return results;
  }, [connectedProviders, syncProvider]);

  return {
    connections,
    isConnected,
    connectedProviders,
    connect,
    disconnect,
    syncProvider,
    syncAll,
    syncedData,
    lastSyncTime,
    isSyncing,
    syncError,
    isLoading,
    refreshConnectionStatus,
  };
}

// ============================================================
// Helper: Aggregate Results
// ============================================================

function aggregateResults(results: FitnessSyncResult[]): AggregatedFitnessData {
  const aggregated = {
    steps: [] as StepData[],
    activities: [] as SyncedActivity[],
    heartRate: [] as HeartRateData[],
    calories: [] as CaloriesData[],
    sleep: [] as SleepData[],
    sources: [] as FitnessProvider[],
    lastSyncAt: new Date().toISOString(),
  };

  for (const result of results) {
    if (!result.success || !result.data) continue;
    aggregated.sources.push(result.provider);

    // Merge steps (take highest per day)
    for (const step of result.data.steps || []) {
      const existing = aggregated.steps.find(s => s.date === step.date);
      if (existing) {
        if (step.steps > existing.steps) Object.assign(existing, step);
      } else {
        aggregated.steps.push(step);
      }
    }

    // Merge activities (avoid duplicates)
    for (const activity of result.data.activities || []) {
      const exists = aggregated.activities.some(
        a => a.externalId === activity.externalId && a.source === activity.source
      );
      if (!exists) aggregated.activities.push(activity);
    }

    // Merge heart rate
    for (const hr of result.data.heartRate || []) {
      const existing = aggregated.heartRate.find(h => h.date === hr.date);
      if (existing) {
        if (hr.averageHr) existing.averageHr = hr.averageHr;
        if (hr.restingHr) existing.restingHr = hr.restingHr;
        if (hr.maxHr && (!existing.maxHr || hr.maxHr > existing.maxHr)) existing.maxHr = hr.maxHr;
      } else {
        aggregated.heartRate.push(hr);
      }
    }

    // Merge calories (take highest per day)
    for (const cal of result.data.calories || []) {
      const existing = aggregated.calories.find(c => c.date === cal.date);
      if (existing) {
        if (cal.totalBurned > existing.totalBurned) Object.assign(existing, cal);
      } else {
        aggregated.calories.push(cal);
      }
    }

    // Merge sleep (take longest per day)
    for (const slp of result.data.sleep || []) {
      const existing = aggregated.sleep.find(s => s.date === slp.date);
      if (existing) {
        if (slp.duration > existing.duration) Object.assign(existing, slp);
      } else {
        aggregated.sleep.push(slp);
      }
    }
  }

  // Sort all arrays
  aggregated.steps.sort((a, b) => a.date.localeCompare(b.date));
  aggregated.activities.sort((a, b) => b.startTime.localeCompare(a.startTime));
  aggregated.heartRate.sort((a, b) => a.date.localeCompare(b.date));
  aggregated.calories.sort((a, b) => a.date.localeCompare(b.date));
  aggregated.sleep.sort((a, b) => a.date.localeCompare(b.date));

  return aggregated;
}
