// ============================================================
// Fitness OAuth Connect Route
// Server-side OAuth initiation - redirects to provider auth page
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const VALID_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Get provider credentials at runtime (not module load time)
function getProviderCredentials(provider: FitnessProvider): {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  scopes: string[];
} {
  switch (provider) {
    case 'google_fit':
      return {
        clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.body.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
        ],
      };
    case 'fitbit':
      return {
        clientId: process.env.FITBIT_CLIENT_ID || '',
        clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
        authUrl: 'https://www.fitbit.com/oauth2/authorize',
        scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
      };
    case 'strava':
      return {
        clientId: process.env.STRAVA_CLIENT_ID || '',
        clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
        authUrl: 'https://www.strava.com/oauth/authorize',
        scopes: ['read', 'activity:read', 'activity:read_all'],
      };
    case 'garmin':
      return {
        clientId: process.env.GARMIN_CONSUMER_KEY || '',
        clientSecret: process.env.GARMIN_CONSUMER_SECRET || '',
        authUrl: 'https://connect.garmin.com/oauthConfirm',
        scopes: [],
      };
    default:
      return { clientId: '', clientSecret: '', authUrl: '', scopes: [] };
  }
}

/**
 * GET /api/fitness/connect/[provider]
 * Initiates OAuth flow by redirecting to provider's authorization page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    return NextResponse.redirect(
      new URL(`/settings?error=invalid_provider&provider=${provider}`, request.url)
    );
  }

  const providerKey = provider as FitnessProvider;
  // Get credentials at request time
  const credentials = getProviderCredentials(providerKey);

  // Check if provider is configured
  if (!credentials.clientId) {
    // Provider not configured - redirect with friendly message
    return NextResponse.redirect(
      new URL(`/settings?error=not_configured&provider=${provider}`, request.url)
    );
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  // Generate PKCE code verifier and challenge for supported providers
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Store state and code verifier in cookies (httpOnly for security)
  const cookieStore = await cookies();
  cookieStore.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  cookieStore.set(`oauth_verifier_${provider}`, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  // Build redirect URI (our callback endpoint)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/fitness/callback/${provider}`;

  // Build authorization URL based on provider
  let authUrl: URL;

  switch (providerKey) {
    case 'google_fit':
      authUrl = new URL(credentials.authUrl);
      authUrl.searchParams.set('client_id', credentials.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', credentials.scopes.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      // PKCE for Google
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      break;

    case 'fitbit':
      authUrl = new URL(credentials.authUrl);
      authUrl.searchParams.set('client_id', credentials.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', credentials.scopes.join(' '));
      authUrl.searchParams.set('state', state);
      // PKCE for Fitbit
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      break;

    case 'strava':
      authUrl = new URL(credentials.authUrl);
      authUrl.searchParams.set('client_id', credentials.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', credentials.scopes.join(','));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('approval_prompt', 'auto');
      break;

    case 'garmin':
      // Garmin uses OAuth 1.0a - requires special handling
      // For now, redirect with a "coming soon" message
      return NextResponse.redirect(
        new URL(`/settings?error=garmin_oauth1&provider=${provider}`, request.url)
      );

    default:
      return NextResponse.redirect(
        new URL(`/settings?error=unsupported_provider&provider=${provider}`, request.url)
      );
  }

  // Redirect to provider's authorization page
  return NextResponse.redirect(authUrl.toString());
}
