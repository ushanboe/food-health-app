import { createBrowserClient } from '@supabase/ssr';

// Singleton instance - MUST be reused to preserve session
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

// Get or create Supabase client (singleton)
export function getSupabaseClient() {
  // Use environment variables only - configured in Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  // Only create new instance if no instance exists
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
}

// Alias for backward compatibility
export function getSupabase() {
  return getSupabaseClient();
}

// Reset instance (useful for testing)
export function resetSupabaseClient() {
  supabaseInstance = null;
}
