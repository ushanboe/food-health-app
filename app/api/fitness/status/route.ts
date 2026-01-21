// Fitness API - Coming Soon
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'coming_soon',
    message: 'Fitness integrations are being rebuilt for better reliability',
    providers: {
      strava: { configured: false, status: 'coming_soon' },
      fitbit: { configured: false, status: 'coming_soon' },
      garmin: { configured: false, status: 'coming_soon' },
      google_fit: { configured: false, status: 'coming_soon' },
    }
  });
}
