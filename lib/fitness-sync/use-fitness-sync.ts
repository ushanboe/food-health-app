// ============================================================
// React Hook for Fitness Sync
// Provides easy integration with React components
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FitnessProvider,
  FitnessConnection,
  FitnessSyncResult,
  AggregatedFitnessData,
  FitnessTokens,
  StepData,
  SyncedActivity,
  HeartRateData,
  CaloriesData,
  SleepData,
} from './types';
import { PROVIDER_CONFIGS } from './config';

// Storage keys
const STORAGE_KEYS = {
  CONNECTIONS: 'fitness_connections',
  TOKENS: 'fitness_tokens',
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
  handleOAuthCallback: (provider: FitnessProvider, code: string) => Promise<boolean>;
  
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
  const [tokens, setTokens] = useState<Record<FitnessProvider, FitnessTokens | null>>(
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

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = () => {
    try {
      // Load connections
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

      // Load tokens
      const savedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (savedTokens) {
        const parsed = JSON.parse(savedTokens);
        const tokenMap: Record<FitnessProvider, FitnessTokens | null> = {
          google_fit: null,
          fitbit: null,
          strava: null,
          garmin: null,
        };
        for (const [provider, token] of Object.entries(parsed)) {
          if (token) {
            tokenMap[provider as FitnessProvider] = {
              ...(token as FitnessTokens),
              accessToken: atob((token as FitnessTokens).accessToken),
              refreshToken: (token as FitnessTokens).refreshToken 
                ? atob((token as FitnessTokens).refreshToken!) 
                : undefined,
            } as FitnessTokens;
          }
        }
        setTokens(tokenMap);
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

  const saveConnections = (conns: Record<FitnessProvider, FitnessConnection | null>) => {
    const connArray = Object.values(conns).filter(Boolean) as FitnessConnection[];
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connArray));
  };

  const saveTokens = (tkns: Record<FitnessProvider, FitnessTokens | null>) => {
    const encrypted: Record<string, FitnessTokens | null> = {};
    for (const [provider, token] of Object.entries(tkns)) {
      if (token) {
        encrypted[provider] = {
          ...token,
          accessToken: btoa(token.accessToken),
          refreshToken: token.refreshToken ? btoa(token.refreshToken) : undefined,
        } as FitnessTokens;
      }
    }
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(encrypted));
  };

  const isConnected = useCallback((provider: FitnessProvider): boolean => {
    return connections[provider]?.isConnected ?? false;
  }, [connections]);

  const connectedProviders = Object.entries(connections)
    .filter(([_, conn]) => conn?.isConnected)
    .map(([provider]) => provider as FitnessProvider);

  // ============================================================
  // OAuth Methods
  // ============================================================

  const connect = useCallback((provider: FitnessProvider) => {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      setSyncError(`Unknown provider: ${provider}`);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
    const state = Math.random().toString(36).substring(7);
    
    // Store state for verification
    sessionStorage.setItem(`oauth_state_${provider}`, state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(provider === 'strava' ? ',' : ' '),
      state,
    });

    // Provider-specific params
    if (provider === 'google_fit') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
    } else if (provider === 'strava') {
      params.set('approval_prompt', 'auto');
    }

    window.location.href = `${config.authUrl}?${params.toString()}`;
  }, []);

  const handleOAuthCallback = useCallback(async (
    provider: FitnessProvider,
    code: string
  ): Promise<boolean> => {
    try {
      setSyncError(null);
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

      // Exchange code for tokens via API
      const response = await fetch('/api/fitness/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code, redirectUri }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'OAuth failed');
      }

      const newTokens: FitnessTokens = await response.json();

      // Update tokens
      const updatedTokens = { ...tokens, [provider]: newTokens };
      setTokens(updatedTokens);
      saveTokens(updatedTokens);

      // Update connection
      const newConnection: FitnessConnection = {
        provider,
        isConnected: true,
        connectedAt: new Date().toISOString(),
        lastSyncAt: null,
        syncEnabled: true,
      };
      const updatedConnections = { ...connections, [provider]: newConnection };
      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      return true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Connection failed');
      return false;
    }
  }, [connections, tokens]);

  const disconnect = useCallback(async (provider: FitnessProvider) => {
    // Clear tokens
    const updatedTokens = { ...tokens, [provider]: null };
    setTokens(updatedTokens);
    saveTokens(updatedTokens);

    // Clear connection
    const updatedConnections = { ...connections, [provider]: null };
    setConnections(updatedConnections);
    saveConnections(updatedConnections);
  }, [connections, tokens]);

  // ============================================================
  // Sync Methods
  // ============================================================

  const refreshTokenIfNeeded = async (provider: FitnessProvider): Promise<string | null> => {
    const token = tokens[provider];
    if (!token) return null;

    // Check if token is expired (with 5 min buffer)
    if (token.expiresAt && token.expiresAt < Date.now() + 5 * 60 * 1000) {
      try {
        const response = await fetch('/api/fitness/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            refreshToken: token.refreshToken,
          }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const newTokens: FitnessTokens = await response.json();
        const updatedTokens = { ...tokens, [provider]: newTokens };
        setTokens(updatedTokens);
        saveTokens(updatedTokens);
        return newTokens.accessToken;
      } catch {
        // Token refresh failed, disconnect
        await disconnect(provider);
        return null;
      }
    }

    return token.accessToken;
  };

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

      const accessToken = await refreshTokenIfNeeded(provider);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await fetch('/api/fitness/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
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
  }, [connections, tokens, isConnected]);

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
    handleOAuthCallback,
    syncProvider,
    syncAll,
    syncedData,
    lastSyncTime,
    isSyncing,
    syncError,
    isLoading,
  };
}

// ============================================================
// Helper: Aggregate Results
// ============================================================

function aggregateResults(results: FitnessSyncResult[]): AggregatedFitnessData {
  // Use explicit type assertions for arrays to avoid optional property issues
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
