import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // Handle different auth callback types
  const code = searchParams.get('code');           // OAuth & magic link
  const token_hash = searchParams.get('token_hash'); // Email confirmation
  const type = searchParams.get('type');           // signup, recovery, etc.
  const next = searchParams.get('next') ?? '/cloud-sync';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // If there's an error from Supabase, redirect with error message
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${origin}/cloud-sync?error=${encodeURIComponent(error_description || error)}`
    );
  }

  const cookieStore = await cookies();
  
  // Get Supabase URL and key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/settings?error=supabase_not_configured`);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Code exchange error:', error);
    return NextResponse.redirect(`${origin}/cloud-sync?error=auth_failed`);
  }

  // Handle email confirmation (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'email',
    });
    
    if (!error) {
      // Email confirmed successfully!
      if (type === 'signup') {
        return NextResponse.redirect(`${origin}/cloud-sync?verified=true`);
      } else if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/cloud-sync?recovery=true`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Token verification error:', error);
    return NextResponse.redirect(`${origin}/cloud-sync?error=verification_failed`);
  }

  // No valid auth parameters
  return NextResponse.redirect(`${origin}/cloud-sync?error=invalid_callback`);
}
