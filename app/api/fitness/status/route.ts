// ============================================================
// Fitness Connection Status Route
// Returns connection status for all fitness providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';
import { cookies } from 'next/headers';

const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Check which providers have server-side credentials configured
const PROVIDER_CONFIGURED: Record<FitnessProvider, boolean> = {
  google_fit: !!(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET),
  fitbit: !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET),
  strava: !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET),
  garmin: !!(process.env.GARMIN_CONSUMER_KEY && process.env.GARMIN_CONSUMER_SECRET),
};

export interface ProviderStatus {
  provider: FitnessProvider;
  configured: boolean;      // Server has credentials
  connected: boolean;       // User has connected
  connectedAt?: string;     // When user connected
  expiresAt?: number;       // Token expiration
  needsRefresh?: boolean;   // Token needs refresh
}

export interface FitnessStatusResponse {
  providers: ProviderStatus[];
  connectedCount: number;
  configuredCount: number;
}

/**
 * GET /api/fitness/status
 * Returns connection status for all fitness providers
 */
export async function GET(request: NextRequest): Promise<NextResponse<FitnessStatusResponse>> {
  const cookieStore = await cookies();
  const providers: ProviderStatus[] = [];

  for (const provider of ALL_PROVIDERS) {
    const status: ProviderStatus = {
      provider,
      configured: PROVIDER_CONFIGURED[provider],
      connected: false,
    };

    // Check for stored tokens
    const tokenCookie = cookieStore.get(`fitness_tokens_${provider}`);
    if (tokenCookie) {
      try {
        const tokenData = JSON.parse(
          Buffer.from(tokenCookie.value, 'base64').toString('utf-8')
        );

        status.connected = true;
        status.connectedAt = tokenData.connectedAt;
        status.expiresAt = tokenData.expiresAt;
        status.needsRefresh = tokenData.expiresAt ? tokenData.expiresAt < Date.now() : false;
      } catch {
        // Invalid token data - treat as not connected
        status.connected = false;
      }
    }

    providers.push(status);
  }

  return NextResponse.json({
    providers,
    connectedCount: providers.filter(p => p.connected).length,
    configuredCount: providers.filter(p => p.configured).length,
  });
}
