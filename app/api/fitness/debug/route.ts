// Debug route to check environment variables (temporary)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only show if variables exist, not their values
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env_check: {
      STRAVA_CLIENT_ID: !!process.env.STRAVA_CLIENT_ID,
      STRAVA_CLIENT_SECRET: !!process.env.STRAVA_CLIENT_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    node_env: process.env.NODE_ENV,
  });
}
