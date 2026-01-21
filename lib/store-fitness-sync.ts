// ============================================================
// Fitness Sync Store Extension
// Adds fitness provider sync state to main store
// ============================================================

import { FitnessProvider, FitnessConnection, AggregatedFitnessData } from './fitness-sync/types';

// ============ FITNESS SYNC TYPES ============

export interface FitnessSyncState {
  // Connected providers
  fitnessConnections: Record<FitnessProvider, FitnessConnection | null>;
  
  // Synced data from external providers
  syncedFitnessData: AggregatedFitnessData | null;
  
  // Sync preferences
  fitnessSyncPreferences: {
    autoSyncEnabled: boolean;
    syncIntervalMinutes: number;
    syncDaysBack: number;
    preferredStepsSource: FitnessProvider | 'manual' | 'auto';
    preferredCaloriesSource: FitnessProvider | 'manual' | 'auto';
  };
  
  // Last sync timestamp
  lastFitnessSyncAt: string | null;
  
  // Sync status
  isFitnessSyncing: boolean;
  fitnessSyncError: string | null;
}

export interface FitnessSyncActions {
  // Connection management
  setFitnessConnection: (provider: FitnessProvider, connection: FitnessConnection | null) => void;
  clearFitnessConnection: (provider: FitnessProvider) => void;
  
  // Synced data management
  setSyncedFitnessData: (data: AggregatedFitnessData | null) => void;
  mergeSyncedSteps: (date: string) => void;
  
  // Preferences
  updateFitnessSyncPreferences: (prefs: Partial<FitnessSyncState['fitnessSyncPreferences']>) => void;
  
  // Sync status
  setFitnessSyncing: (syncing: boolean) => void;
  setFitnessSyncError: (error: string | null) => void;
  setLastFitnessSyncAt: (timestamp: string | null) => void;
  
  // Helpers
  getConnectedFitnessProviders: () => FitnessProvider[];
  isFitnessProviderConnected: (provider: FitnessProvider) => boolean;
}

// Default state values
export const defaultFitnessSyncState: FitnessSyncState = {
  fitnessConnections: {
    google_fit: null,
    fitbit: null,
    strava: null,
    garmin: null,
  },
  syncedFitnessData: null,
  fitnessSyncPreferences: {
    autoSyncEnabled: false,
    syncIntervalMinutes: 60,
    syncDaysBack: 7,
    preferredStepsSource: 'auto',
    preferredCaloriesSource: 'auto',
  },
  lastFitnessSyncAt: null,
  isFitnessSyncing: false,
  fitnessSyncError: null,
};

// Create fitness sync slice for store
export const createFitnessSyncSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): FitnessSyncActions => ({
  setFitnessConnection: (provider, connection) =>
    set((state: any) => ({
      fitnessConnections: {
        ...state.fitnessConnections,
        [provider]: connection,
      },
    })),

  clearFitnessConnection: (provider) =>
    set((state: any) => ({
      fitnessConnections: {
        ...state.fitnessConnections,
        [provider]: null,
      },
    })),

  setSyncedFitnessData: (data) =>
    set(() => ({
      syncedFitnessData: data,
    })),

  mergeSyncedSteps: (date) => {
    const state = get();
    const syncedData = state.syncedFitnessData;
    const prefs = state.fitnessSyncPreferences;
    
    if (!syncedData?.steps?.length) return;
    
    // Find synced steps for the date
    const syncedSteps = syncedData.steps.find((s: any) => s.date === date);
    if (!syncedSteps) return;
    
    // Check if we should use synced steps
    const currentLog = state.fitnessLogs.find((l: any) => l.date === date);
    const currentSteps = currentLog?.steps || 0;
    
    // Auto mode: use higher value; specific source: use if matches
    let shouldUpdate = false;
    if (prefs.preferredStepsSource === 'auto') {
      shouldUpdate = syncedSteps.steps > currentSteps;
    } else if (prefs.preferredStepsSource !== 'manual') {
      shouldUpdate = syncedSteps.source === prefs.preferredStepsSource;
    }
    
    if (shouldUpdate) {
      state.updateSteps(date, syncedSteps.steps);
    }
  },

  updateFitnessSyncPreferences: (prefs) =>
    set((state: any) => ({
      fitnessSyncPreferences: {
        ...state.fitnessSyncPreferences,
        ...prefs,
      },
    })),

  setFitnessSyncing: (syncing) =>
    set(() => ({
      isFitnessSyncing: syncing,
    })),

  setFitnessSyncError: (error) =>
    set(() => ({
      fitnessSyncError: error,
    })),

  setLastFitnessSyncAt: (timestamp) =>
    set(() => ({
      lastFitnessSyncAt: timestamp,
    })),

  getConnectedFitnessProviders: () => {
    const state = get();
    return Object.entries(state.fitnessConnections)
      .filter(([_, conn]) => (conn as FitnessConnection | null)?.connected)
      .map(([provider]) => provider as FitnessProvider);
  },

  isFitnessProviderConnected: (provider) => {
    const state = get();
    return state.fitnessConnections[provider]?.connected ?? false;
  },
});
