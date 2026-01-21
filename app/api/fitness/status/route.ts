// ============================================================
// Fitness Connection Status Route
// Returns connection status for all fitness providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';
import { cookies } from 'next/headers';

const ALL_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Function to check provider configuration at runtime (not module load time)
function isProviderConfigured(provider: FitnessProvider): boolean {
  switch (provider) {
    case 'google_fit':
      return !!(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET);
    case 'fitbit':
      return !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
    case 'strava':
      return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
    case 'garmin':
      return !!(process.env.GARMIN_CONSUMER_KEY && process.env.GARMIN_CONSUMER_SECRET);
    default:
      return false;
  }
}

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
    // Check configuration at request time, not module load time
    const configured = isProviderConfigured(provider);
    
    const status: ProviderStatus = {
      provider,
      configured,
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
