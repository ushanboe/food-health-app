// ============================================================
// Fitness Disconnect Route
// Revokes tokens and removes connection
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FitnessProvider } from '@/lib/fitness-sync/types';
import { cookies } from 'next/headers';

const VALID_PROVIDERS: FitnessProvider[] = ['google_fit', 'fitbit', 'strava', 'garmin'];

// Revocation endpoints for each provider
const REVOCATION_URLS: Partial<Record<FitnessProvider, string>> = {
  google_fit: 'https://oauth2.googleapis.com/revoke',
  fitbit: 'https://api.fitbit.com/oauth2/revoke',
  // Strava doesn't have a revocation endpoint - just delete tokens
  // Garmin OAuth 1.0a - just delete tokens
};

/**
 * POST /api/fitness/disconnect/[provider]
 * Revokes tokens and removes the connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    );
  }

  const providerKey = provider as FitnessProvider;
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(`fitness_tokens_${provider}`);

  if (tokenCookie) {
    try {
      // Decode stored tokens
      const tokenData = JSON.parse(
        Buffer.from(tokenCookie.value, 'base64').toString('utf-8')
      );

      // Try to revoke tokens at provider (best effort)
      const revocationUrl = REVOCATION_URLS[providerKey];
      if (revocationUrl && tokenData.accessToken) {
        try {
          if (providerKey === 'google_fit') {
            await fetch(`${revocationUrl}?token=${tokenData.accessToken}`, {
              method: 'POST',
            });
          } else if (providerKey === 'fitbit') {
            const clientId = process.env.FITBIT_CLIENT_ID || '';
            const clientSecret = process.env.FITBIT_CLIENT_SECRET || '';
            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            await fetch(revocationUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
              },
              body: new URLSearchParams({ token: tokenData.accessToken }),
            });
          }
        } catch (revokeError) {
          // Log but don't fail - we'll still delete local tokens
          console.warn(`Failed to revoke ${provider} token:`, revokeError);
        }
      }
    } catch (parseError) {
      console.warn(`Failed to parse ${provider} tokens:`, parseError);
    }

    // Delete the token cookie
    cookieStore.delete(`fitness_tokens_${provider}`);
  }

  return NextResponse.json({
    success: true,
    provider,
    message: `Disconnected from ${provider}`,
  });
}

/**
 * GET /api/fitness/disconnect/[provider]
 * Alternative method - redirects to settings after disconnect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as FitnessProvider)) {
    return NextResponse.redirect(
      new URL(`/settings?fitness_error=invalid_provider`, baseUrl)
    );
  }

  const cookieStore = await cookies();

  // Delete the token cookie
  cookieStore.delete(`fitness_tokens_${provider}`);

  return NextResponse.redirect(
    new URL(`/settings?fitness_disconnected=${provider}`, baseUrl)
  );
}
