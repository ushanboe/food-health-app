// ============================================================
// OAuth Callback Route Handler
// Handles OAuth callbacks for all fitness providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';

const VALID_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  
  // For OAuth 1.0a (Garmin)
  const oauthToken = searchParams.get('oauth_token');
  const oauthVerifier = searchParams.get('oauth_verifier');

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    return NextResponse.redirect(
      new URL(`/settings?error=invalid_provider&provider=${provider}`, request.url)
    );
  }

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || error;
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(errorDescription)}&provider=${provider}`,
        request.url
      )
    );
  }

  // Handle OAuth 2.0 callback (Google Fit, Fitbit, Strava)
  if (code) {
    // Redirect to settings page with the code
    // The client-side will handle the token exchange
    return NextResponse.redirect(
      new URL(
        `/settings?code=${code}&provider=${provider}${state ? `&state=${state}` : ''}`,
        request.url
      )
    );
  }

  // Handle OAuth 1.0a callback (Garmin)
  if (oauthToken && oauthVerifier) {
    return NextResponse.redirect(
      new URL(
        `/settings?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}&provider=${provider}`,
        request.url
      )
    );
  }

  // No valid callback parameters
  return NextResponse.redirect(
    new URL(`/settings?error=missing_code&provider=${provider}`, request.url)
  );
}
