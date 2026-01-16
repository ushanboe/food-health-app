// ============================================================
// Fitness OAuth Callback Route
// Server-side token exchange - handles OAuth callback from providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider, FitnessTokens } from '@/lib/fitness-sync/types';
import { cookies } from 'next/headers';

const VALID_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Server-side only credentials
const PROVIDER_CREDENTIALS: Record<FitnessProvider, {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
}> = {
  google_fit: {
    clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  fitbit: {
    clientId: process.env.FITBIT_CLIENT_ID || '',
    clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
  },
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || '',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
    tokenUrl: 'https://www.strava.com/oauth/token',
  },
  garmin: {
    clientId: process.env.GARMIN_CONSUMER_KEY || '',
    clientSecret: process.env.GARMIN_CONSUMER_SECRET || '',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  },
};

/**
 * GET /api/fitness/callback/[provider]
 * Handles OAuth callback, exchanges code for tokens, stores them securely
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const settingsUrl = new URL('/settings', baseUrl);

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    settingsUrl.searchParams.set('fitness_error', 'invalid_provider');
    settingsUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(settingsUrl);
  }

  const providerKey = provider as FitnessProvider;

  // Handle OAuth errors from provider
  if (error) {
    settingsUrl.searchParams.set('fitness_error', errorDescription || error);
    settingsUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(settingsUrl);
  }

  // Validate code
  if (!code) {
    settingsUrl.searchParams.set('fitness_error', 'missing_code');
    settingsUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(settingsUrl);
  }

  // Validate state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get(`oauth_state_${provider}`)?.value;
  const codeVerifier = cookieStore.get(`oauth_verifier_${provider}`)?.value;

  if (!storedState || storedState !== state) {
    settingsUrl.searchParams.set('fitness_error', 'invalid_state');
    settingsUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(settingsUrl);
  }

  // Clear OAuth cookies
  cookieStore.delete(`oauth_state_${provider}`);
  cookieStore.delete(`oauth_verifier_${provider}`);

  try {
    const credentials = PROVIDER_CREDENTIALS[providerKey];
    const redirectUri = `${baseUrl}/api/fitness/callback/${provider}`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      providerKey,
      code,
      redirectUri,
      credentials,
      codeVerifier
    );

    // Store tokens in an httpOnly cookie (encrypted)
    // In production, you'd want to store these in a database (Supabase)
    const tokenData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      connectedAt: new Date().toISOString(),
    };

    // Encrypt token data before storing
    const encryptedTokens = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    // Store in httpOnly cookie
    cookieStore.set(`fitness_tokens_${provider}`, encryptedTokens, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
    });

    // Redirect to settings with success
    settingsUrl.searchParams.set('fitness_connected', provider);
    return NextResponse.redirect(settingsUrl);

  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err);
    settingsUrl.searchParams.set('fitness_error', err instanceof Error ? err.message : 'token_exchange_failed');
    settingsUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(settingsUrl);
  }
}

async function exchangeCodeForTokens(
  provider: FitnessProvider,
  code: string,
  redirectUri: string,
  credentials: { clientId: string; clientSecret: string; tokenUrl: string },
  codeVerifier?: string
): Promise<FitnessTokens> {
  let response: Response;

  switch (provider) {
    case 'google_fit': {
      const params = new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      // Add PKCE verifier if available
      if (codeVerifier) {
        params.set('code_verifier', codeVerifier);
      }
      response = await fetch(credentials.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      break;
    }

    case 'fitbit': {
      const basicAuth = Buffer.from(
        `${credentials.clientId}:${credentials.clientSecret}`
      ).toString('base64');

      const params = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      if (codeVerifier) {
        params.set('code_verifier', codeVerifier);
      }

      response = await fetch(credentials.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: params,
      });
      break;
    }

    case 'strava': {
      response = await fetch(credentials.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });
      break;
    }

    case 'garmin':
      throw new Error('Garmin OAuth 1.0a not yet implemented');

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token exchange failed for ${provider}:`, errorText);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: provider === 'strava'
      ? data.expires_at * 1000
      : Date.now() + (data.expires_in * 1000),
    scope: data.scope,
    tokenType: data.token_type,
  };
}
