import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) || 'NOT SET',
    hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
    publishableKeyPrefix: process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 15) || 'NOT SET',
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'NOT SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
  };
  
  return NextResponse.json(config);
}
