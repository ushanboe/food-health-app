import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Types for our database tables
export interface DBFoodAnalysis {
  id: string;
  user_id: string;
  timestamp: string;
  image_data?: string;
  food_name: string;
  category: string;
  health_score: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  verdict: string;
  description: string;
  alternatives: string[];
  serving_size?: string;
  barcode?: string;
  brand_name?: string;
  nutri_score?: string;
  nova_group?: number;
  source?: string;
  created_at?: string;
}

export interface DBMealEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  serving_size?: string;
  image_data?: string;
  timestamp: string;
  source_analysis_id?: string;
  created_at?: string;
}

export interface DBWeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  note?: string;
  created_at?: string;
}

export interface DBRecipe {
  id: string;
  user_id: string;
  name: string;
  servings: number;
  ingredients: any;
  thumbnail?: string;
  instructions?: string;
  created_at?: string;
}

export interface DBUserProfile {
  id: string;
  user_id: string;
  name?: string;
  dietary_preferences: string[];
  allergies: string[];
  health_goals: string[];
  daily_goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  user_stats: {
    height: number;
    current_weight: number;
    target_weight: number;
    age: number;
    gender: string;
    activity_level: string;
    weight_goal: string;
  };
  updated_at?: string;
}

let supabaseClient: SupabaseClient | null = null;

// Initialize Supabase client
export function initSupabase(url: string, anonKey: string): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseClient;
}

// Get existing client
export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

// Auth functions
export async function signUp(email: string, password: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;
  
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// OAuth providers
export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signInWithApple() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
  
  if (error) throw error;
  return data;
}
