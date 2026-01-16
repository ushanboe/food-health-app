// ============================================================
// Fitness OAuth Token Exchange API
// Server-side token exchange to protect client secrets
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider, FitnessTokens } from '@/lib/fitness-sync/types';
import { PROVIDER_CONFIGS } from '@/lib/fitness-sync/config';

const PROVIDER_SECRETS: Record<FitnessProvider, { clientId: string; clientSecret: string }> = {
  google_fit: {
    clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
  },
  fitbit: {
    clientId: process.env.FITBIT_CLIENT_ID || '',
    clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
  },
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || '',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
  },
  garmin: {
    clientId: process.env.GARMIN_CONSUMER_KEY || '',
    clientSecret: process.env.GARMIN_CONSUMER_SECRET || '',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, code, redirectUri, refreshToken } = body;

    if (!provider || !PROVIDER_CONFIGS[provider as FitnessProvider]) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const config = PROVIDER_CONFIGS[provider as FitnessProvider];
    const secrets = PROVIDER_SECRETS[provider as FitnessProvider];

    if (!secrets.clientId || !secrets.clientSecret) {
      return NextResponse.json(
        { error: `${provider} is not configured. Please add API credentials.` },
        { status: 400 }
      );
    }

    let tokens: FitnessTokens;

    if (refreshToken) {
      // Token refresh
      tokens = await refreshAccessToken(provider, refreshToken, config, secrets);
    } else if (code) {
      // Initial token exchange
      tokens = await exchangeCodeForTokens(provider, code, redirectUri, config, secrets);
    } else {
      return NextResponse.json(
        { error: 'Missing code or refreshToken' },
        { status: 400 }
      );
    }

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth failed' },
      { status: 500 }
    );
  }
}

async function exchangeCodeForTokens(
  provider: FitnessProvider,
  code: string,
  redirectUri: string,
  config: typeof PROVIDER_CONFIGS[FitnessProvider],
  secrets: { clientId: string; clientSecret: string }
): Promise<FitnessTokens> {
  let response: Response;

  switch (provider) {
    case 'google_fit':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: secrets.clientId,
          client_secret: secrets.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      break;

    case 'fitbit':
      const fitbitCredentials = Buffer.from(
        `${secrets.clientId}:${secrets.clientSecret}`
      ).toString('base64');
      
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${fitbitCredentials}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      break;

    case 'strava':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: secrets.clientId,
          client_secret: secrets.clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });
      break;

    case 'garmin':
      // Garmin uses OAuth 1.0a - handled differently
      throw new Error('Garmin OAuth requires special handling');

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: provider === 'strava' 
      ? data.expires_at * 1000 
      : Date.now() + data.expires_in * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

async function refreshAccessToken(
  provider: FitnessProvider,
  refreshToken: string,
  config: typeof PROVIDER_CONFIGS[FitnessProvider],
  secrets: { clientId: string; clientSecret: string }
): Promise<FitnessTokens> {
  let response: Response;

  switch (provider) {
    case 'google_fit':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: secrets.clientId,
          client_secret: secrets.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      break;

    case 'fitbit':
      const fitbitCredentials = Buffer.from(
        `${secrets.clientId}:${secrets.clientSecret}`
      ).toString('base64');
      
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${fitbitCredentials}`,
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      break;

    case 'strava':
      response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: secrets.clientId,
          client_secret: secrets.clientSecret,
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
      : Date.now() + data.expires_in * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
}
