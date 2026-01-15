import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';

// Get Supabase credentials from store settings
export function getSupabaseClient() {
  const { aiSettings } = useAppStore.getState();
  
  const supabaseUrl = aiSettings.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = aiSettings.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for when we know credentials exist
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = getSupabaseClient();
  }
  return supabaseInstance;
}

// Reset instance when credentials change
export function resetSupabaseClient() {
  supabaseInstance = null;
}
