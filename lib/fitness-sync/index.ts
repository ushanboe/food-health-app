// ============================================================
// Unified Fitness Sync Service
// Aggregates data from all connected fitness providers
// ============================================================

import { GoogleFitClient } from './google-fit';
import { FitbitClient } from './fitbit';
import { StravaClient } from './strava';
import { GarminClient } from './garmin';
import { BaseFitnessClient } from './base-client';
import {
  FitnessProvider,
  FitnessTokens,
  FitnessConnection,
  StepData,
  HeartRateData,
  SyncedActivity,
  CaloriesData,
  SleepData,
  FitnessSyncResult,
  AggregatedFitnessData,
  FitnessSyncError,
} from './types';

// Storage keys
const STORAGE_KEYS = {
  CONNECTIONS: 'fitness_connections',
  TOKENS: 'fitness_tokens',
  LAST_SYNC: 'fitness_last_sync',
  SYNCED_DATA: 'fitness_synced_data',
};

// Simple encryption for token storage (in production, use proper encryption)
const encryptToken = (token: string): string => {
  if (typeof window === 'undefined') return token;
  return btoa(token);
};

const decryptToken = (encrypted: string): string => {
  if (typeof window === 'undefined') return encrypted;
  try {
    return atob(encrypted);
  } catch {
    return encrypted;
  }
};

export class FitnessSyncService {
  private clients: Map<FitnessProvider, BaseFitnessClient> = new Map();
  private connections: Map<FitnessProvider, FitnessConnection> = new Map();
  private initialized = false;

  constructor() {
    this.initializeClients();
  }

  // ============================================================
  // Initialization
  // ============================================================

  private initializeClients(): void {
    this.clients.set('google_fit', new GoogleFitClient());
    this.clients.set('fitbit', new FitbitClient());
    this.clients.set('strava', new StravaClient());
    this.clients.set('garmin', new GarminClient());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load saved connections and tokens
    this.loadConnections();
    this.loadTokens();
    
    this.initialized = true;
  }

  // ============================================================
  // Connection Management
  // ============================================================

  getClient(provider: FitnessProvider): BaseFitnessClient | undefined {
    return this.clients.get(provider);
  }

  getConnection(provider: FitnessProvider): FitnessConnection | undefined {
    return this.connections.get(provider);
  }

  getAllConnections(): FitnessConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectedProviders(): FitnessProvider[] {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.isConnected)
      .map(([provider]) => provider);
  }

  isConnected(provider: FitnessProvider): boolean {
    const connection = this.connections.get(provider);
    return connection?.isConnected ?? false;
  }

  // ============================================================
  // OAuth Flow
  // ============================================================

  getAuthUrl(provider: FitnessProvider, redirectUri: string, state?: string): string {
    const client = this.clients.get(provider);
    if (!client) {
      throw new FitnessSyncError(`Unknown provider: ${provider}`, provider, 'UNKNOWN_PROVIDER');
    }
    return client.getAuthUrl(redirectUri, state);
  }

  async handleOAuthCallback(
    provider: FitnessProvider,
    code: string,
    redirectUri: string
  ): Promise<FitnessConnection> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new FitnessSyncError(`Unknown provider: ${provider}`, provider, 'UNKNOWN_PROVIDER');
    }

    try {
      const tokens = await client.exchangeCodeForTokens(code, redirectUri);
      
      const connection: FitnessConnection = {
        provider,
        isConnected: true,
        connectedAt: new Date().toISOString(),
        lastSyncAt: null,
        syncEnabled: true,
      };

      this.connections.set(provider, connection);
      this.saveConnections();
      this.saveTokens(provider, tokens);

      return connection;
    } catch (error) {
      throw new FitnessSyncError(
        `Failed to connect ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        'AUTH_FAILED'
      );
    }
  }

  async disconnect(provider: FitnessProvider): Promise<void> {
    const client = this.clients.get(provider);
    if (client) {
      client.clearTokens();
    }

    this.connections.delete(provider);
    this.saveConnections();
    this.removeTokens(provider);
  }

  // ============================================================
  // Data Syncing
  // ============================================================

  async syncProvider(
    provider: FitnessProvider,
    startDate: string,
    endDate: string
  ): Promise<FitnessSyncResult> {
    const client = this.clients.get(provider);
    const connection = this.connections.get(provider);

    if (!client || !connection?.isConnected) {
      return {
        provider,
        success: false,
        error: 'Provider not connected',
        syncedAt: new Date().toISOString(),
      };
    }

    try {
      // Ensure tokens are valid
      await client.ensureValidToken();

      // Fetch all data types in parallel
      const [steps, activities, heartRate, calories, sleep] = await Promise.all([
        client.fetchSteps(startDate, endDate).catch(() => []),
        client.fetchActivities(startDate, endDate).catch(() => []),
        client.fetchHeartRate(startDate, endDate).catch(() => []),
        client.fetchCalories(startDate, endDate).catch(() => []),
        client.fetchSleep(startDate, endDate).catch(() => []),
      ]);

      const result: FitnessSyncResult = {
        provider,
        success: true,
        syncedAt: new Date().toISOString(),
        data: {
          steps,
          activities,
          heartRate,
          calories,
          sleep,
        },
      };

      // Update connection last sync time
      connection.lastSyncAt = result.syncedAt;
      this.connections.set(provider, connection);
      this.saveConnections();

      return result;
    } catch (error) {
      return {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async syncAll(
    startDate: string,
    endDate: string
  ): Promise<FitnessSyncResult[]> {
    const connectedProviders = this.getConnectedProviders();
    
    const results = await Promise.all(
      connectedProviders.map(provider => this.syncProvider(provider, startDate, endDate))
    );

    // Save aggregated data
    this.saveLastSyncData(results);

    return results;
  }

  // ============================================================
  // Data Aggregation
  // ============================================================

  aggregateData(results: FitnessSyncResult[]): AggregatedFitnessData {
    // Use internal type with required arrays for aggregation
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

      // Merge steps (take highest value per day)
      for (const step of result.data?.steps || []) {
        const existing = aggregated.steps.find(s => s.date === step.date);
        if (existing) {
          if (step.steps > existing.steps) {
            Object.assign(existing, step);
          }
        } else {
          aggregated.steps.push(step);
        }
      }

      // Merge activities (avoid duplicates by external ID)
      for (const activity of result.data?.activities || []) {
        const exists = aggregated.activities.some(
          a => a.externalId === activity.externalId && a.source === activity.source
        );
        if (!exists) {
          aggregated.activities.push(activity);
        }
      }

      // Merge heart rate (average across sources per day)
      for (const hr of result.data?.heartRate || []) {
        const existing = aggregated.heartRate.find(h => h.date === hr.date);
        if (existing) {
          // Average the values
          if (hr.averageHr && existing.averageHr) {
            existing.averageHr = Math.round((existing.averageHr + hr.averageHr) / 2);
          } else if (hr.averageHr) {
            existing.averageHr = hr.averageHr;
          }
          if (hr.restingHr && (!existing.restingHr || hr.restingHr < existing.restingHr)) {
            existing.restingHr = hr.restingHr;
          }
          if (hr.maxHr && (!existing.maxHr || hr.maxHr > existing.maxHr)) {
            existing.maxHr = hr.maxHr;
          }
        } else {
          aggregated.heartRate.push(hr);
        }
      }

      // Merge calories (take highest value per day)
      for (const cal of result.data?.calories || []) {
        const existing = aggregated.calories.find(c => c.date === cal.date);
        if (existing) {
          if (cal.totalBurned > existing.totalBurned) {
            Object.assign(existing, cal);
          }
        } else {
          aggregated.calories.push(cal);
        }
      }

      // Merge sleep (take longest sleep per day)
      for (const slp of result.data?.sleep || []) {
        const existing = aggregated.sleep.find(s => s.date === slp.date);
        if (existing) {
          if (slp.duration > existing.duration) {
            Object.assign(existing, slp);
          }
        } else {
          aggregated.sleep.push(slp);
        }
      }
    }

    // Sort all arrays by date
    aggregated.steps.sort((a, b) => a.date.localeCompare(b.date));
    aggregated.activities.sort((a, b) => b.startTime.localeCompare(a.startTime));
    aggregated.heartRate.sort((a, b) => a.date.localeCompare(b.date));
    aggregated.calories.sort((a, b) => a.date.localeCompare(b.date));
    aggregated.sleep.sort((a, b) => a.date.localeCompare(b.date));

    return aggregated;
  }

  // ============================================================
  // Storage Methods
  // ============================================================

  private loadConnections(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (stored) {
        const connections: FitnessConnection[] = JSON.parse(stored);
        for (const conn of connections) {
          this.connections.set(conn.provider, conn);
        }
      }
    } catch (error) {
      console.warn('Failed to load fitness connections:', error);
    }
  }

  private saveConnections(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const connections = Array.from(this.connections.values());
      localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    } catch (error) {
      console.warn('Failed to save fitness connections:', error);
    }
  }

  private loadTokens(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (stored) {
        const tokens: Record<FitnessProvider, FitnessTokens> = JSON.parse(stored);
        for (const [provider, encryptedTokens] of Object.entries(tokens)) {
          const client = this.clients.get(provider as FitnessProvider);
          if (client && encryptedTokens) {
            const decryptedTokens = {
              ...encryptedTokens,
              accessToken: decryptToken(encryptedTokens.accessToken),
              refreshToken: encryptedTokens.refreshToken 
                ? decryptToken(encryptedTokens.refreshToken) 
                : undefined,
            } as FitnessTokens;
            client.setTokens(decryptedTokens);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load fitness tokens:', error);
    }
  }

  private saveTokens(provider: FitnessProvider, tokens: FitnessTokens): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const allTokens: Record<string, FitnessTokens> = stored ? JSON.parse(stored) : {};
      
      allTokens[provider] = {
        ...tokens,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : undefined,
      } as FitnessTokens;
      
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(allTokens));
    } catch (error) {
      console.warn('Failed to save fitness tokens:', error);
    }
  }

  private removeTokens(provider: FitnessProvider): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (stored) {
        const allTokens: Record<string, FitnessTokens> = JSON.parse(stored);
        delete allTokens[provider];
        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(allTokens));
      }
    } catch (error) {
      console.warn('Failed to remove fitness tokens:', error);
    }
  }

  private saveLastSyncData(results: FitnessSyncResult[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const aggregated = this.aggregateData(results);
      localStorage.setItem(STORAGE_KEYS.SYNCED_DATA, JSON.stringify(aggregated));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save sync data:', error);
    }
  }

  getLastSyncData(): AggregatedFitnessData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNCED_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }
}

// Singleton instance
let fitnessSyncService: FitnessSyncService | null = null;

export function getFitnessSyncService(): FitnessSyncService {
  if (!fitnessSyncService) {
    fitnessSyncService = new FitnessSyncService();
  }
  return fitnessSyncService;
}

// Re-export types and clients
export * from './types';
export { GoogleFitClient } from './google-fit';
export { FitbitClient } from './fitbit';
export { StravaClient } from './strava';
export { GarminClient } from './garmin';
export { BaseFitnessClient } from './base-client';
