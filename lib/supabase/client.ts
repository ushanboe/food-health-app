import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';

// Singleton instance - MUST be reused to preserve session
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;
let currentUrl: string = '';
let currentKey: string = '';

// Get or create Supabase client (singleton)
export function getSupabaseClient() {
  const { aiSettings } = useAppStore.getState();
  
  const supabaseUrl = aiSettings.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = aiSettings.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  // Only create new instance if credentials changed or no instance exists
  if (!supabaseInstance || supabaseUrl !== currentUrl || supabaseAnonKey !== currentKey) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    currentUrl = supabaseUrl;
    currentKey = supabaseAnonKey;
  }
  
  return supabaseInstance;
}

// Alias for backward compatibility
export function getSupabase() {
  return getSupabaseClient();
}

// Reset instance when credentials change (call this after updating settings)
export function resetSupabaseClient() {
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}
